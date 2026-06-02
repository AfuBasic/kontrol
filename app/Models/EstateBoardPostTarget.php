<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstateBoardPostTarget extends Model
{
    protected $fillable = [
        'estate_board_post_id',
        'target_type',
        'target_id',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(EstateBoardPost::class, 'estate_board_post_id');
    }
}
