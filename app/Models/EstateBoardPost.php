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

/**
 * @property int $id
 * @property int $estate_id
 * @property int $user_id
 * @property string|null $title
 * @property string $body
 * @property EstateBoardPostStatus $status
 * @property EstateBoardPostAudience $audience
 * @property \Carbon\CarbonImmutable|null $published_at
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Activity> $activities
 * @property-read int|null $activities_count
 * @property-read \App\Models\User $author
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\EstateBoardComment> $comments
 * @property-read int|null $comments_count
 * @property-read \App\Models\Estate $estate
 * @property-read string $hashid
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\EstateBoardPostMedia> $media
 * @property-read int|null $media_count
 *
 * @method static \Database\Factories\EstateBoardPostFactory factory($count = null, $state = [])
 * @method static Builder<static>|EstateBoardPost forAudience(array $audiences)
 * @method static Builder<static>|EstateBoardPost forEstate(int $estateId)
 * @method static Builder<static>|EstateBoardPost newModelQuery()
 * @method static Builder<static>|EstateBoardPost newQuery()
 * @method static Builder<static>|EstateBoardPost published()
 * @method static Builder<static>|EstateBoardPost query()
 * @method static Builder<static>|EstateBoardPost whereAudience($value)
 * @method static Builder<static>|EstateBoardPost whereBody($value)
 * @method static Builder<static>|EstateBoardPost whereCreatedAt($value)
 * @method static Builder<static>|EstateBoardPost whereEstateId($value)
 * @method static Builder<static>|EstateBoardPost whereId($value)
 * @method static Builder<static>|EstateBoardPost wherePublishedAt($value)
 * @method static Builder<static>|EstateBoardPost whereStatus($value)
 * @method static Builder<static>|EstateBoardPost whereTitle($value)
 * @method static Builder<static>|EstateBoardPost whereUpdatedAt($value)
 * @method static Builder<static>|EstateBoardPost whereUserId($value)
 *
 * @mixin \Eloquent
 */
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
     * The accessors to append to the model's array form.
     *
     * @var array<string>
     */
    protected $appends = ['hashid'];

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
