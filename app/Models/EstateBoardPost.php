<?php

namespace App\Models;

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostStatus;
use App\Traits\HasHashid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class EstateBoardPost extends Model
{
    use HasFactory;
    use HasHashid;
    use LogsActivity;

    protected $fillable = [
        'estate_id',
        'user_id',
        'title',
        'body',
        'status',
        'audience',
        'published_at',
    ];

    /**
     * Get the hashid connection name for this model.
     */
    public static function hashidConnection(): string
    {
        return 'estate_board_posts';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => EstateBoardPostStatus::class,
            'audience' => EstateBoardPostAudience::class,
            'published_at' => 'datetime',
        ];
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
     * @return HasMany<EstateBoardPostMedia, $this>
     */
    public function media(): HasMany
    {
        return $this->hasMany(EstateBoardPostMedia::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<EstateBoardComment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(EstateBoardComment::class);
    }

    /**
     * Scope: Published posts only.
     *
     * @param  Builder<EstateBoardPost>  $query
     * @return Builder<EstateBoardPost>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', EstateBoardPostStatus::Published)
            ->whereNotNull('published_at');
    }

    /**
     * Scope: Posts for a specific estate.
     *
     * @param  Builder<EstateBoardPost>  $query
     * @return Builder<EstateBoardPost>
     */
    public function scopeForEstate(Builder $query, int $estateId): Builder
    {
        return $query->where('estate_id', $estateId);
    }

    /**
     * Scope: Posts visible to a specific audience.
     *
     * @param  Builder<EstateBoardPost>  $query
     * @param  array<EstateBoardPostAudience>  $audiences
     * @return Builder<EstateBoardPost>
     */
    public function scopeForAudience(Builder $query, array $audiences): Builder
    {
        return $query->whereIn('audience', $audiences);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'body', 'status', 'audience'])
            ->logOnlyDirty();
    }
}
