<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $estate_board_post_id
 * @property int $estate_id
 * @property int $user_id
 * @property string $body
 * @property int|null $parent_id
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property \Carbon\CarbonImmutable|null $deleted_at
 * @property-read \App\Models\User $author
 * @property-read \App\Models\Estate $estate
 * @property-read EstateBoardComment|null $parent
 * @property-read \App\Models\EstateBoardPost $post
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EstateBoardComment> $replies
 * @property-read int|null $replies_count
 * @method static \Database\Factories\EstateBoardCommentFactory factory($count = null, $state = [])
 * @method static Builder<static>|EstateBoardComment newModelQuery()
 * @method static Builder<static>|EstateBoardComment newQuery()
 * @method static Builder<static>|EstateBoardComment onlyTrashed()
 * @method static Builder<static>|EstateBoardComment query()
 * @method static Builder<static>|EstateBoardComment topLevel()
 * @method static Builder<static>|EstateBoardComment whereBody($value)
 * @method static Builder<static>|EstateBoardComment whereCreatedAt($value)
 * @method static Builder<static>|EstateBoardComment whereDeletedAt($value)
 * @method static Builder<static>|EstateBoardComment whereEstateBoardPostId($value)
 * @method static Builder<static>|EstateBoardComment whereEstateId($value)
 * @method static Builder<static>|EstateBoardComment whereId($value)
 * @method static Builder<static>|EstateBoardComment whereParentId($value)
 * @method static Builder<static>|EstateBoardComment whereUpdatedAt($value)
 * @method static Builder<static>|EstateBoardComment whereUserId($value)
 * @method static Builder<static>|EstateBoardComment withTrashed(bool $withTrashed = true)
 * @method static Builder<static>|EstateBoardComment withoutTrashed()
 * @mixin \Eloquent
 */
class EstateBoardComment extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'estate_board_post_id',
        'estate_id',
        'user_id',
        'body',
        'parent_id',
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

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<EstateBoardComment, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(EstateBoardComment::class, 'parent_id');
    }

    /**
     * @return HasMany<EstateBoardComment, $this>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(EstateBoardComment::class, 'parent_id');
    }

    /**
     * Scope: Top-level comments only (no parent).
     *
     * @param  Builder<EstateBoardComment>  $query
     * @return Builder<EstateBoardComment>
     */
    public function scopeTopLevel(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }
}
