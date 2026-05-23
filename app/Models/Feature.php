<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string $group AI, Notifications, Integrations, Core
 * @property string|null $suggested_plan
 * @property bool $is_global Available to all plans
 * @property bool $is_active
 * @property int $sort_order
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Collection<int, Plan> $plans
 * @property-read int|null $plans_count
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature byGroup(string $group)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereGroup($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereIsGlobal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereSuggestedPlan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Feature whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
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
