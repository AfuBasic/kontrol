<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property int $price Price in kobo/cents
 * @property string $billing_interval
 * @property bool $is_featured
 * @property string|null $badge e.g. Most Popular, Best Value
 * @property string $color Tailwind color name for display
 * @property string $visibility
 * @property int|null $max_residents null = unlimited
 * @property int|null $max_security null = unlimited
 * @property int|null $max_admins null = unlimited
 * @property bool $is_active
 * @property int $sort_order
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Feature> $features
 * @property-read int|null $features_count
 * @property-read string $formatted_price
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\EstateSubscription> $subscriptions
 * @property-read int|null $subscriptions_count
 * @method static \Database\Factories\PlanFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereBadge($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereBillingInterval($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereColor($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereIsFeatured($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereMaxAdmins($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereMaxResidents($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereMaxSecurity($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan wherePrice($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Plan whereVisibility($value)
 * @mixin \Eloquent
 */
class Plan extends Model
{
    use HasFactory;

    protected $appends = ['formatted_price'];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_interval',
        'is_featured',
        'badge',
        'color',
        'visibility',
        'max_residents',
        'max_security',
        'max_admins',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'integer',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'max_residents' => 'integer',
        'max_security' => 'integer',
        'max_admins' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * @return BelongsToMany<Feature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'plan_features')
            ->withPivot('is_enabled', 'limit')
            ->withTimestamps();
    }

    /**
     * @return HasMany<EstateSubscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(EstateSubscription::class);
    }

    public function getFormattedPriceAttribute(): string
    {
        return '₦'.number_format($this->price / 100, 2);
    }
}
