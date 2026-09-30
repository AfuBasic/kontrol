<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @extends Model<EstateOrganization>
 *
 * @method static \Illuminate\Database\Eloquent\Builder|EstateOrganization active()
 * @method static \Illuminate\Database\Eloquent\Builder|EstateOrganization quickEntryEnabled()
 *
 * @property int $id
 * @property int $estate_id
 * @property string $name
 * @property string $type
 * @property bool $is_active
 * @property bool $quick_entry_enabled
 * @property string|null $confirmation_policy
 * @property int|null $arrival_confirmation_minutes
 * @property string $access_policy
 * @property string|null $notes
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property-read Estate $estate
 * @property-read Collection<int, OrganizationMembership> $memberships
 * @property-read Collection<int, OrganizationAccessMember> $accessMembers
 * @property-read Collection<int, AccessLog> $accessLogs
 * @property-read Collection<int, OrganizationPublicWindow> $publicWindows
 * @property-read Collection<int, OrganizationBulkInvite> $bulkInvites
 *
 * @mixin \Eloquent
 */
class EstateOrganization extends Model
{
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'name',
        'type',
        'is_active',
        'quick_entry_enabled',
        'confirmation_policy',
        'arrival_confirmation_minutes',
        'access_policy',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'quick_entry_enabled' => 'boolean',
            'arrival_confirmation_minutes' => 'integer',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * @return HasMany<OrganizationMembership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(OrganizationMembership::class, 'organization_id');
    }

    /**
     * @return HasMany<OrganizationAccessMember, $this>
     */
    public function accessMembers(): HasMany
    {
        return $this->hasMany(OrganizationAccessMember::class, 'organization_id');
    }

    /**
     * @return HasMany<OrganizationPublicWindow, $this>
     */
    public function publicWindows(): HasMany
    {
        return $this->hasMany(OrganizationPublicWindow::class, 'organization_id');
    }

    /**
     * @return HasMany<OrganizationBulkInvite, $this>
     */
    public function bulkInvites(): HasMany
    {
        return $this->hasMany(OrganizationBulkInvite::class, 'organization_id');
    }

    /**
     * @return HasMany<AccessLog, $this>
     */
    public function accessLogs(): HasMany
    {
        return $this->hasMany(AccessLog::class, 'organization_id');
    }

    public function scopeActive($query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeQuickEntryEnabled($query): Builder
    {
        return $query->where('quick_entry_enabled', true);
    }

    /**
     * Check if the organization is within any active public window right now.
     */
    public function isWithinPublicWindow(): bool
    {
        $now = CarbonImmutable::now();

        return $this->publicWindows()
            ->where('is_active', true)
            ->get()
            ->contains(fn ($window) => $window->isOpenAt($now));
    }

    public function isUnrestricted(): bool
    {
        return $this->access_policy === 'unrestricted';
    }

    /**
     * Resolve the effective hours enforcement mode for this organization.
     *
     * Since hours_enforcement was removed from estate_organizations,
     * enforcement is now estate-level only via EstateSettings::quick_entry_hours_enforcement.
     */
    public function resolvedEnforcement(EstateSettings $settings): string
    {
        return $settings->quick_entry_hours_enforcement ?: 'warn';
    }

    /**
     * Check if this organization has any configured public windows.
     */
    public function hasPublicWindows(): bool
    {
        return $this->publicWindows()->active()->exists();
    }

    /**
     * Check if the organization is outside its operating hours
     * (has windows but none are currently active).
     */
    public function isOutsideOperatingHours(): bool
    {
        return $this->hasPublicWindows() && ! $this->isWithinPublicWindow();
    }

    public function confirmationState(): ?string
    {
        if ($this->confirmation_policy === 'none' || $this->arrival_confirmation_minutes === null) {
            return null;
        }

        $since = CarbonImmutable::now()->subMinutes($this->arrival_confirmation_minutes);

        $pendingCount = $this->accessLogs()
            ->whereNull('checked_out_at')
            ->where('verified_at', '<=', $since)
            ->whereNull('arrival_confirmed_at')
            ->count();

        if ($pendingCount > 0) {
            return 'overdue';
        }

        return 'confirmed';
    }

    public function requiresArrivalConfirmation(): bool
    {
        return $this->confirmation_policy === 'required'
            && $this->arrival_confirmation_minutes !== null;
    }

    /**
     * Determine if this organization has an active subscription either directly,
     * through its estate subscription, or through any active member's resident subscription.
     */
    public function hasActiveSubscription(?User $user = null): bool
    {
        // 1. Check estate-level subscription
        $estateSub = $this->estate?->subscriptionRecord;
        if ($estateSub && ($estateSub->isActive() || $estateSub->isOnTrial())) {
            return true;
        }

        // 2. Check the specific user's resident subscription if provided
        if ($user) {
            $userSub = ResidentSubscription::where('user_id', $user->id)
                ->where('estate_id', $this->estate_id)
                ->first();

            if ($userSub && $userSub->isActive()) {
                return true;
            }
        }

        // 3. Check any active organization member's resident subscription
        $memberUserIds = $this->memberships()
            ->where('is_active', true)
            ->pluck('user_id');

        return ResidentSubscription::whereIn('user_id', $memberUserIds)
            ->where('estate_id', $this->estate_id)
            ->get()
            ->contains(fn (ResidentSubscription $sub) => $sub->isActive());
    }
}
