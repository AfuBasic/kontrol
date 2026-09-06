<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstateOrganization extends Model
{
    /** @use HasFactory<\Database\Factories\EstateOrganizationFactory> */
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'name',
        'type',
        'operating_hours',
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

