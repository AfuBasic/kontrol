<?php

namespace App\Models;

use App\Enums\CommissionStatus;
use App\Enums\PartnerStatus;
use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property string $name
 * @property int|null $partner_id
 * @property string $email
 * @property string|null $address
 * @property string $status
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read EstateInviteLink|null $inviteLink
 * @property-read Partner|null $partner
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ResidentSubscription> $residentSubscriptions
 * @property-read int|null $resident_subscriptions_count
 * @property-read EstateSettings $settings
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SosEvent> $sosEvents
 * @property-read int|null $sos_events_count
 * @property-read Plan|null $subscription
 * @property-read EstateSubscription|null $subscriptionRecord
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $users
 * @property-read int|null $users_count
 *
 * @method static \Database\Factories\EstateFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate whereAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate wherePartnerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Estate whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class Estate extends Model
{
    use GeneratesUlid, HasFactory;

    protected $fillable = [
        'name',
        'email',
        'address',
        'status',
        'billing_mode',
        'partner_id',
        'partner_source',
        'commission_plan_id',
        'commission_starts_at',
        'commission_ends_at',
        'partner_date',
        'activation_date',
        'partner_status',
        'commission_status',
        'partner_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'partner_status' => PartnerStatus::class,
            'commission_status' => CommissionStatus::class,
            'commission_starts_at' => 'date',
            'commission_ends_at' => 'date',
            'partner_date' => 'date',
            'activation_date' => 'date',
        ];
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'estate_users_membership')
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * @return HasMany<AdministrativeAssignment, $this>
     */
    public function administrativeAssignments(): HasMany
    {
        return $this->hasMany(AdministrativeAssignment::class);
    }

    /**
     * @return HasMany<Zone, $this>
     */
    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasAcceptedAdmin(): bool
    {
        return DB::table('estate_users_membership')
            ->join('model_has_roles', function ($join) {
                $join->on('estate_users_membership.user_id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('estate_users_membership.estate_id', $this->id)
            ->where('estate_users_membership.status', 'accepted')
            ->where('model_has_roles.estate_id', $this->id)
            ->where('roles.name', 'admin')
            ->exists();
    }

    /**
     * Cache for active feature slugs to prevent redundant DB hits in a single request.
     */
    protected ?array $memoizedFeatures = null;

    public function hasFeature(string $featureSlug): bool
    {
        return in_array($featureSlug, $this->getActiveFeatureSlugs(), true);
    }

    /**
     * Clear the in-request memoized features.
     */
    public function clearMemoizedFeatures(): void
    {
        $this->memoizedFeatures = null;
    }

    public function getActiveFeatureSlugs(): array
    {
        if ($this->memoizedFeatures !== null) {
            return $this->memoizedFeatures;
        }

        return $this->memoizedFeatures = Cache::remember(
            'estate_features:all_active',
            now()->addMinutes(15),
            function () {
                return Feature::where('is_active', true)
                    ->pluck('slug')
                    ->toArray();
            }
        );
    }

    public function getFeatureLimit(string $featureSlug): ?string
    {
        $subscription = $this->subscriptionRecord;

        if (! $subscription || $subscription->isCancelled() || ! $subscription->plan) {
            return '0';
        }

        $feature = $subscription->plan->features()
            ->where('slug', $featureSlug)
            ->wherePivot('is_enabled', true)
            ->first();

        return $feature ? $feature->pivot->limit : '0';
    }

    public function getHouseholdFeatureLimit(?User $primaryResident = null): ?string
    {
        if ($this->settings->charge_type === 'residents' && $primaryResident) {
            $subscription = $this->householdSubjectSubscription($primaryResident);

            if (! $subscription || ! $subscription->plan) {
                return null;
            }

            return $this->getFeatureLimitFromPlan($subscription->plan, 'household-management');
        }

        return $this->getFeatureLimit('household-management');
    }

    public function getHouseholdMemberLimit(?User $primaryResident = null): ?int
    {
        return $this->normalizeFeatureLimit($this->getHouseholdFeatureLimit($primaryResident));
    }

    public function householdManagementIsAvailableFor(?User $primaryResident = null): bool
    {
        if ($this->settings->charge_type === 'residents' && $primaryResident) {
            $subscription = $this->householdSubjectSubscription($primaryResident);

            return ! $subscription || ! $subscription->plan || $subscription->plan->hasFeature('household-management');
        }

        return (bool) $this->subscriptionRecord?->plan?->hasFeature('household-management');
    }

    private function householdSubjectSubscription(User $primaryResident): ?ResidentSubscription
    {
        $subject = $primaryResident;

        if ($primaryResident->isHouseholdMember()) {
            $household = $primaryResident->householdOf()->where('estate_id', $this->id)->first();
            $subject = $household?->primaryResident ?? $primaryResident;
        }

        return $subject->residentSubscription()
            ->with('plan')
            ->where('estate_id', $this->id)
            ->first();
    }

    private function getFeatureLimitFromPlan(Plan $plan, string $featureSlug): ?string
    {
        $feature = $plan->features()
            ->where('slug', $featureSlug)
            ->wherePivot('is_enabled', true)
            ->first();

        return $feature ? $feature->pivot->limit : '0';
    }

    private function normalizeFeatureLimit(?string $limit): ?int
    {
        if ($limit === null) {
            return null;
        }

        $normalizedLimit = trim($limit);

        if ($normalizedLimit === '' || strtolower($normalizedLimit) === 'unlimited') {
            return null;
        }

        $limitValue = (int) $normalizedLimit;

        return $limitValue > 0 ? $limitValue : null;
    }

    public function canAddMoreResidents(): bool
    {
        $limit = $this->subscriptionRecord?->plan?->max_residents;
        if ($limit === null) {
            return true;
        }

        // Count active residents
        $currentResidents = $this->users()
            ->wherePivot('status', 'accepted')
            ->count();

        return $currentResidents < $limit;
    }

    public function canAddMoreAdmins(): bool
    {
        $limit = $this->subscriptionRecord?->plan?->max_admins;
        if ($limit === null) {
            return true;
        }

        $currentAdmins = DB::table('estate_users_membership')
            ->join('model_has_roles', function ($join) {
                $join->on('estate_users_membership.user_id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('estate_users_membership.estate_id', $this->id)
            ->where('estate_users_membership.status', 'accepted')
            ->where('model_has_roles.estate_id', $this->id)
            ->where('roles.name', 'admin')
            ->count();

        return $currentAdmins < $limit;
    }

    public function canAddMoreSecurity(): bool
    {
        $limit = $this->subscriptionRecord?->plan?->max_security;
        if ($limit === null) {
            return true;
        }

        $currentSecurity = DB::table('estate_users_membership')
            ->join('model_has_roles', function ($join) {
                $join->on('estate_users_membership.user_id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('estate_users_membership.estate_id', $this->id)
            ->where('estate_users_membership.status', 'accepted')
            ->where('model_has_roles.estate_id', $this->id)
            ->where('roles.name', 'security')
            ->count();

        return $currentSecurity < $limit;
    }

    public function canAddMoreHouseholdMembers(User $primaryResident): bool
    {
        if (! $this->householdManagementIsAvailableFor($primaryResident)) {
            return false;
        }

        $limit = $this->getHouseholdMemberLimit($primaryResident);

        if ($limit === null) {
            return true;
        }

        $currentMembers = $primaryResident->householdMembers()
            ->where('estate_id', $this->id)
            ->count();

        return $currentMembers < $limit;
    }

    /**
     * @return HasOne<EstateSettings, $this>
     */
    public function settings(): HasOne
    {
        return $this->hasOne(EstateSettings::class)->withDefault();
    }

    /**
     * @return HasOneThrough<Plan, EstateSubscription>
     */
    public function subscription(): HasOneThrough
    {
        return $this->hasOneThrough(
            Plan::class,
            EstateSubscription::class,
            'estate_id',
            'id',
            'id',
            'plan_id'
        );
    }

    /**
     * @return HasOne<EstateSubscription, $this>
     */
    public function subscriptionRecord(): HasOne
    {
        return $this->hasOne(EstateSubscription::class);
    }

    /**
     * @return HasMany<EstateInviteLink, $this>
     */
    public function inviteLinks(): HasMany
    {
        return $this->hasMany(EstateInviteLink::class)->where('role', 'resident');
    }

    /**
     * @return HasMany<EstateInviteLink, $this>
     */
    public function propertyOwnerInviteLinks(): HasMany
    {
        return $this->hasMany(EstateInviteLink::class)->where('role', 'property_owner');
    }

    /**
     * @return HasMany<EstateInviteLink, $this>
     */
    public function securityInviteLinks(): HasMany
    {
        return $this->hasMany(EstateInviteLink::class)->where('role', 'security');
    }

    /**
     * @return HasMany<ResidentSubscription, $this>
     */
    public function residentSubscriptions(): HasMany
    {
        return $this->hasMany(ResidentSubscription::class);
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<CommissionPlan, $this>
     */
    public function commissionPlan(): BelongsTo
    {
        return $this->belongsTo(CommissionPlan::class);
    }

    public function commissionDaysRemaining(): ?int
    {
        if (! $this->commission_ends_at) {
            return null;
        }

        $remaining = now()->startOfDay()->diffInDays($this->commission_ends_at, false);

        return max(0, (int) $remaining);
    }

    public function hasActiveCommissionWindow(): bool
    {
        if ($this->commission_status !== CommissionStatus::Active) {
            return false;
        }

        $today = now()->startOfDay();

        if ($this->commission_starts_at && $today->lt($this->commission_starts_at)) {
            return false;
        }

        if ($this->commission_ends_at && $today->gt($this->commission_ends_at)) {
            return false;
        }

        return true;
    }

    /**
     * @return HasMany<SosEvent, $this>
     */
    public function sosEvents(): HasMany
    {
        return $this->hasMany(SosEvent::class);
    }

    /**
     * @return HasMany<Collection, $this>
     */
    public function collections(): HasMany
    {
        return $this->hasMany(Collection::class);
    }

    /**
     * @return HasMany<CollectionAssignment, $this>
     */
    public function collectionAssignments(): HasMany
    {
        return $this->hasMany(CollectionAssignment::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }
}
