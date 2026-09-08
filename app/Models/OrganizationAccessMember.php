<?php

namespace App\Models;

use Database\Factories\OrganizationAccessMemberFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrganizationAccessMember extends Model
{
    /** @use HasFactory<OrganizationAccessMemberFactory> */
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'identifier',
        'category',
        'status',
        'valid_from',
        'valid_until',
        'metadata',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valid_from' => 'date',
            'valid_until' => 'date',
            'metadata' => 'array',
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
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<AccessCode, $this>
     */
    public function accessCodes(): HasMany
    {
        return $this->hasMany(AccessCode::class, 'organization_member_id');
    }

    /**
     * @return HasOne<AccessCode, $this>
     */
    public function activeAccessCode(): HasOne
    {
        return $this->hasOne(AccessCode::class, 'organization_member_id')
            ->where('status', 'active')
            ->latestOfMany();
    }

    public function isValidNow(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $today = now()->startOfDay();

        if ($this->valid_from && $today->lt($this->valid_from->startOfDay())) {
            return false;
        }

        if ($this->valid_until && $today->gt($this->valid_until->endOfDay())) {
            return false;
        }

        return true;
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeValidNow(Builder $query): Builder
    {
        $today = now()->toDateString();

        return $query->where('status', 'active')
            ->where(function (Builder $q) use ($today) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', $today);
            })
            ->where(function (Builder $q) use ($today) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', $today);
            });
    }
}
