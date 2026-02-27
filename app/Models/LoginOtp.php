<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
