<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\OrganizationPublicWindowFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationPublicWindow extends Model
{
    /** @use HasFactory<OrganizationPublicWindowFactory> */
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<EstateOrganization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(EstateOrganization::class, 'organization_id');
    }

    /**
     * Check if this window is open at a specific time (or now).
     */
    public function isOpenAt(?CarbonInterface $at = null): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $time = $at ? $at->copy() : now();

        if ($time->dayOfWeek !== $this->day_of_week) {
            return false;
        }

        $currentTime = $time->format('H:i:s');
        $start = substr($this->start_time, 0, 8);
        $end = substr($this->end_time, 0, 8);

        return $currentTime >= $start && $currentTime <= $end;
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeForDay(Builder $query, int $dayOfWeek): Builder
    {
        return $query->where('day_of_week', $dayOfWeek);
    }
}
