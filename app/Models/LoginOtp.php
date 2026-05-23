<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $code
 * @property string|null $ip_address
 * @property string $user_agent_hash
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $created_at
 * @property-read User $user
 *
 * @method static Builder<static>|LoginOtp newModelQuery()
 * @method static Builder<static>|LoginOtp newQuery()
 * @method static Builder<static>|LoginOtp query()
 * @method static Builder<static>|LoginOtp valid()
 * @method static Builder<static>|LoginOtp whereCode($value)
 * @method static Builder<static>|LoginOtp whereCreatedAt($value)
 * @method static Builder<static>|LoginOtp whereExpiresAt($value)
 * @method static Builder<static>|LoginOtp whereId($value)
 * @method static Builder<static>|LoginOtp whereIpAddress($value)
 * @method static Builder<static>|LoginOtp whereUserAgentHash($value)
 * @method static Builder<static>|LoginOtp whereUserId($value)
 *
 * @mixin \Eloquent
 */
class LoginOtp extends Model
{
    public $timestamps = false;

    protected $table = 'login_otps';

    protected $fillable = [
        'user_id',
        'code',
        'ip_address',
        'user_agent_hash',
        'expires_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'created_at' => 'datetime',
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
     * Scope: non-expired OTPs.
     *
     * @param  Builder<LoginOtp>  $query
     * @return Builder<LoginOtp>
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->where('expires_at', '>', now());
    }
}
