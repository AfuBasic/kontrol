<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
