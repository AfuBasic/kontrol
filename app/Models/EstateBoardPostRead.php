<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstateBoardPostRead extends Model
{
    protected $fillable = [
        'estate_board_post_id',
        'user_id',
    ];

    public function post()
    {
        return $this->belongsTo(EstateBoardPost::class, 'estate_board_post_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
