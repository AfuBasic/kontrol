<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $provider_identifier
 * @property int $effective_user_id
 * @property int $estate_id
 * @property string|null $reason
 * @property string $session_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property CarbonImmutable $started_at
 * @property CarbonImmutable|null $ended_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $effectiveUser
 * @property-read Estate $estate
 *
 * @method static Builder<static>|ImpersonationSession active()
 * @method static Builder<static>|ImpersonationSession forEstate(int $estateId)
 */
class ImpersonationSession extends Model
{
    use HasFactory;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'ended_at' => 'immutable_datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function effectiveUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'effective_user_id');
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * Scope query to only currently active sessions.
     *
     * @param  Builder<ImpersonationSession>  $query
     * @return Builder<ImpersonationSession>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('ended_at');
    }

    /**
     * Scope query to sessions for a specific estate.
     *
     * @param  Builder<ImpersonationSession>  $query
     * @return Builder<ImpersonationSession>
     */
    public function scopeForEstate(Builder $query, int $estateId): Builder
    {
        return $query->where('estate_id', $estateId);
    }

    public function isActive(): bool
    {
        return $this->ended_at === null;
    }
}
