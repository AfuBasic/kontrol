<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
