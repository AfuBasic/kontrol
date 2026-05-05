<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_board_post_id
 * @property int $estate_id
 * @property string $disk
 * @property string $path
 * @property string $url
 * @property string $mime_type
 * @property int $size_bytes
 * @property int|null $width
 * @property int|null $height
 * @property string $hash
 * @property int $sort_order
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \App\Models\Estate $estate
 * @property-read \App\Models\EstateBoardPost $post
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereDisk($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereEstateBoardPostId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereHash($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereHeight($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereMimeType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia wherePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereSizeBytes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateBoardPostMedia whereWidth($value)
 *
 * @mixin \Eloquent
 */
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
