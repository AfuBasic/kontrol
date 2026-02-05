<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramLinkToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'token',
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
     *
     * @param  Builder<TelegramLinkToken>  $query
     * @return Builder<TelegramLinkToken>
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->whereNull('used_at')
            ->where('expires_at', '>', now());
    }

    /**
     * Scope to filter by user.
     *
     * @param  Builder<TelegramLinkToken>  $query
     * @return Builder<TelegramLinkToken>
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
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

    /**
     * Generate a unique 6-digit token.
     */
    public static function generateToken(): string
    {
        do {
            $token = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (self::query()->valid()->where('token', $token)->exists());

        return $token;
    }
}
