<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\EstateOrganizationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstateOrganization extends Model
{
    /** @use HasFactory<EstateOrganizationFactory> */
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'name',
        'type',
        'access_policy',
        'operating_hours',
        'hours_enforcement',
        'quick_entry_enabled',
        'arrival_confirmation_required',
        'confirmation_window_minutes',
        'confirmation_escalation',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'operating_hours' => 'array',
            'hours_enforcement' => 'string',
            'quick_entry_enabled' => 'boolean',
            'arrival_confirmation_required' => 'boolean',
            'confirmation_window_minutes' => 'integer',
            'confirmation_escalation' => 'string',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
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
     * @return HasMany<AccessLog, $this>
     */
    public function accessLogs(): HasMany
    {
        return $this->hasMany(AccessLog::class, 'organization_id');
    }

    /**
     * Resolve effective enforcement level ('off', 'warn', 'block') against estate settings.
     */
    public function resolvedEnforcement(?EstateSettings $settings = null): string
    {
        $orgEnforcement = $this->hours_enforcement ?: 'inherit';

        if ($orgEnforcement !== 'inherit') {
            return $orgEnforcement;
        }

        if (! $settings) {
            $settings = EstateSettings::forEstate($this->estate_id);
        }

        return $settings->quick_entry_hours_enforcement ?: 'warn';
    }

    /**
     * Check if a given time is within the organization's operating hours.
     */
    public function isWithinOperatingHours(?CarbonInterface $at = null): bool
    {
        if (empty($this->operating_hours) || ! is_array($this->operating_hours)) {
            return true;
        }

        $time = $at ? $at->copy() : now();
        $dayKey = strtolower($time->format('l')); // e.g. 'monday'

        $hours = $this->operating_hours;

        // 1. Check day-specific configuration
        if (isset($hours[$dayKey])) {
            $dayConfig = $hours[$dayKey];

            if (is_array($dayConfig)) {
                if (isset($dayConfig['closed']) && $dayConfig['closed'] === true) {
                    return false;
                }

                $open = $dayConfig['open'] ?? null;
                $close = $dayConfig['close'] ?? null;

                if ($open && $close) {
                    $currentTime = $time->format('H:i');

                    return $currentTime >= $open && $currentTime <= $close;
                }
            }
        }

        // 2. Check general open/close configuration
        if (isset($hours['open']) && isset($hours['close'])) {
            if (! empty($hours['days']) && is_array($hours['days'])) {
                $days = array_map('strtolower', $hours['days']);
                if (! in_array($dayKey, $days, true)) {
                    return false;
                }
            }

            $currentTime = $time->format('H:i');

            return $currentTime >= $hours['open'] && $currentTime <= $hours['close'];
        }

        return true;
    }

    /**
     * Check if a given time is within any active public access window.
     */
    public function isWithinPublicWindow(?CarbonInterface $at = null): bool
    {
        if ($this->access_policy !== 'public_window') {
            return false;
        }

        $time = $at ? $at->copy() : now();
        $dayOfWeek = $time->dayOfWeek;

        return $this->publicWindows()
            ->where('is_active', true)
            ->where('day_of_week', $dayOfWeek)
            ->get()
            ->contains(fn (OrganizationPublicWindow $window) => $window->isOpenAt($time));
    }

    /**
     * Check if organization has unrestricted access policy (e.g. Hospital).
     */
    public function isUnrestricted(): bool
    {
        return $this->access_policy === 'unrestricted';
    }

    /**
     * Check if organization requires arrival confirmation.
     */
    public function requiresArrivalConfirmation(): bool
    {
        if ($this->isUnrestricted()) {
            return false;
        }

        return (bool) $this->arrival_confirmation_required;
    }

    /**
     * Scope to active organizations.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to quick entry enabled organizations.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeQuickEntryEnabled(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('quick_entry_enabled', true);
    }
}
