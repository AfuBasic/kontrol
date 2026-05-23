<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $token
 * @property string|null $destination_url
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $used_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 *
 * @method static Builder<static>|MagicLoginToken newModelQuery()
 * @method static Builder<static>|MagicLoginToken newQuery()
 * @method static Builder<static>|MagicLoginToken query()
 * @method static Builder<static>|MagicLoginToken valid()
 * @method static Builder<static>|MagicLoginToken whereCreatedAt($value)
 * @method static Builder<static>|MagicLoginToken whereDestinationUrl($value)
 * @method static Builder<static>|MagicLoginToken whereExpiresAt($value)
 * @method static Builder<static>|MagicLoginToken whereId($value)
 * @method static Builder<static>|MagicLoginToken whereToken($value)
 * @method static Builder<static>|MagicLoginToken whereUpdatedAt($value)
 * @method static Builder<static>|MagicLoginToken whereUsedAt($value)
 * @method static Builder<static>|MagicLoginToken whereUserId($value)
 *
 * @mixin \Eloquent
 */
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
