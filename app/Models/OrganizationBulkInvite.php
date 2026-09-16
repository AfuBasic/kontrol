<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizationBulkInvite extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'estate_id',
        'created_by',
        'name',
        'purpose',
        'valid_from',
        'valid_until',
        'auto_renew',
        'status',
        'renewal_blocked_reason',
        'last_renewed_at',
        'next_renewal_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valid_from' => 'date',
            'valid_until' => 'date',
            'auto_renew' => 'boolean',
            'last_renewed_at' => 'datetime',
            'next_renewal_at' => 'date',
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
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class, 'estate_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<OrganizationBulkInviteRecipient, $this>
     */
    public function recipients(): HasMany
    {
        return $this->hasMany(OrganizationBulkInviteRecipient::class, 'bulk_invite_id');
    }

    /**
     * @return HasMany<OrganizationBulkInviteRenewal, $this>
     */
    public function renewals(): HasMany
    {
        return $this->hasMany(OrganizationBulkInviteRenewal::class, 'bulk_invite_id');
    }

    /**
     * Scope query to eligible auto-renewal records.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeEligibleForAutoRenewal(Builder $query): Builder
    {
        return $query->where('auto_renew', true)
            ->where('status', 'active')
            ->whereNotNull('next_renewal_at')
            ->whereDate('next_renewal_at', '<=', now()->addDay());
    }
}
