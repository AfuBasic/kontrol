<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Feature extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'group',
        'suggested_plan',
        'is_global',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * @return BelongsToMany<Plan, $this>
     */
    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'plan_features')
            ->withPivot('is_enabled', 'limit')
            ->withTimestamps();
    }

    public function scopeByGroup(mixed $query, string $group): mixed
    {
        return $query->where('group', $group);
    }

    public function scopeActive(mixed $query): mixed
    {
        return $query->where('is_active', true);
    }
}
