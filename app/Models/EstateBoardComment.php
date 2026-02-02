<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
