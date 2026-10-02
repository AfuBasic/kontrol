<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
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
 *
 * @property int $id
 * @property int $estate_id
 * @property string $name
 * @property string $type
 * @property bool $is_active
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
        'access_policy',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
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

    /**
     * Check if the organization is within any active public window (now, or at a given time).
     */
    public function isWithinPublicWindow(?CarbonInterface $at = null): bool
    {
        $at ??= CarbonImmutable::now();

        return $this->publicWindows()
            ->where('is_active', true)
            ->get()
            ->contains(fn ($window) => $window->isOpenAt($at));
    }

    /**
     * Whether a walk-in (quick entry) may be admitted at the given time.
     *
     * Unrestricted organizations are always open, public-window organizations only during an
     * open window, and managed organizations never take walk-ins. Closed means no entry.
     */
    public function acceptsWalkInsAt(?CarbonInterface $at = null): bool
    {
        return match ($this->access_policy) {
            'unrestricted' => true,
            'public_window' => $this->isWithinPublicWindow($at),
            default => false,
        };
    }

    /**
     * True when walk-ins depend on hours the organization has not set yet, so every
     * walk-in is turned away until an admin adds them.
     */
    public function needsWalkInHours(): bool
    {
        return $this->access_policy === 'public_window' && ! $this->hasPublicWindows();
    }

    /**
     * Walk-in status for the gate's destination picker.
     *
     * @return array{open: bool, label: string}
     */
    public function walkInStatus(): array
    {
        if ($this->access_policy === 'unrestricted') {
            return ['open' => true, 'label' => 'Always open'];
        }

        if ($this->access_policy !== 'public_window') {
            return ['open' => false, 'label' => 'Closed to walk-ins'];
        }

        $now = CarbonImmutable::now();
        $windows = $this->publicWindows()->where('is_active', true)->get();

        if ($windows->isEmpty()) {
            return ['open' => false, 'label' => 'No walk-in hours set'];
        }

        $current = $windows->first(fn ($window) => $window->isOpenAt($now));
        if ($current) {
            return ['open' => true, 'label' => 'Open until '.CarbonImmutable::parse($current->end_time)->format('g:i A')];
        }

        // Next opening within the coming week.
        for ($offset = 0; $offset <= 7; $offset++) {
            $day = $now->addDays($offset);
            $next = $windows
                ->filter(fn ($window) => (int) $window->day_of_week === $day->dayOfWeek)
                ->sortBy('start_time')
                ->first(fn ($window) => $offset > 0 || substr($window->start_time, 0, 8) > $now->format('H:i:s'));

            if ($next) {
                $time = CarbonImmutable::parse($next->start_time)->format('g:i A');
                $when = $offset === 0 ? "today {$time}" : ($offset === 1 ? "tomorrow {$time}" : $day->format('D')." {$time}");

                return ['open' => false, 'label' => "Closed · opens {$when}"];
            }
        }

        return ['open' => false, 'label' => 'Closed'];
    }

    public function isUnrestricted(): bool
    {
        return $this->access_policy === 'unrestricted';
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
