<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\EstateOrganizationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstateOrganization extends Model
{
    /** @use HasFactory<EstateOrganizationFactory> */
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'name',
        'type',
        'operating_hours',
        'hours_enforcement',
        'quick_entry_enabled',
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
