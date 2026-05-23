<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $user_agent_hash
 * @property string|null $ip_address
 * @property CarbonImmutable $last_used_at
 * @property CarbonImmutable|null $created_at
 * @property-read User $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice whereIpAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice whereLastUsedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice whereUserAgentHash($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TrustedDevice whereUserId($value)
 *
 * @mixin \Eloquent
 */
class TrustedDevice extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'user_agent_hash',
        'ip_address',
        'last_used_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
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
}
