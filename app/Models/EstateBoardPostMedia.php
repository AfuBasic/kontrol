<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstateBoardPostMedia extends Model
{
    use HasFactory;

    protected $table = 'estate_board_post_media';

    protected $fillable = [
        'estate_board_post_id',
        'estate_id',
        'disk',
        'path',
        'url',
        'mime_type',
        'size_bytes',
        'width',
        'height',
        'hash',
        'sort_order',
    ];

    /**
     * @return BelongsTo<EstateBoardPost, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(EstateBoardPost::class, 'estate_board_post_id');
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }
}
