<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstateInviteLink extends Model
{
    protected $fillable = [
        'estate_id',
        'token',
        'is_active',
        'usage_count',
        'max_usages',
        'requires_approval',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer',
        'max_usages' => 'integer',
        'requires_approval' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function isFull(): bool
    {
        return $this->max_usages !== null && $this->usage_count >= $this->max_usages;
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->isFull()) {
            return false;
        }

        if ($this->isExpired()) {
            return false;
        }

        return true;
    }
}
