<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MagicLoginToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'token',
        'destination_url',
        'expires_at',
        'used_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to only valid (unused, not expired) tokens.
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->whereNull('used_at')
            ->where('expires_at', '>', now());
    }

    /**
     * Check if this token is still valid.
     */
    public function isValid(): bool
    {
        return $this->used_at === null && $this->expires_at->isFuture();
    }

    /**
     * Mark this token as used.
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
