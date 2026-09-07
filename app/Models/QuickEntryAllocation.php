<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuickEntryAllocation extends Model
{
    /** @use HasFactory<\Database\Factories\QuickEntryAllocationFactory> */
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'user_id',
        'checkpoint_id',
        'device_fingerprint',
        'allocated_tags',
        'allocated_count',
        'used_count',
        'expires_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allocated_tags' => 'array',
            'allocated_count' => 'integer',
            'used_count' => 'integer',
            'expires_at' => 'datetime',
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
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if allocation has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}

