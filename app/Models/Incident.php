<?php

namespace App\Models;

use App\Enums\IncidentCategory;
use App\Enums\IncidentStatus;
use App\Traits\GeneratesUlid;
use App\Traits\HasHashid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Incident extends Model
{
    use GeneratesUlid, HasHashid {
        HasHashid::resolveRouteBinding insteadof GeneratesUlid;
    }
    use HasFactory;
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'estate_id',
        'reporter_id',
        'title',
        'body',
        'category',
        'status',
        'assigned_to',
        'upvotes_count',
        'comments_count',
        'attachment_url',
        'attachment_type',
        'acknowledged_at',
        'resolving_at',
        'solved_at',
        'closed_at',
    ];

    protected $appends = ['hashid'];

    /**
     * Get the hashid connection name for this model.
     */
    public static function hashidConnection(): string
    {
        return 'incidents';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => IncidentStatus::class,
            'category' => IncidentCategory::class,
            'acknowledged_at' => 'datetime',
            'resolving_at' => 'datetime',
            'solved_at' => 'datetime',
            'closed_at' => 'datetime',
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
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * @return HasMany<IncidentComment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(IncidentComment::class);
    }

    /**
     * @return HasMany<IncidentUpvote, $this>
     */
    public function upvotes(): HasMany
    {
        return $this->hasMany(IncidentUpvote::class);
    }

    public function isUpvotedBy(User $user): bool
    {
        return $this->upvotes()->where('user_id', $user->id)->exists();
    }

    public function isReporter(User $user): bool
    {
        return $this->reporter_id === $user->id;
    }

    public function scopeForEstate(Builder $query, int $estateId): Builder
    {
        return $query->where('estate_id', $estateId);
    }

    public function scopeWithStatus(Builder $query, IncidentStatus $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeOpenOnly(Builder $query): Builder
    {
        return $query->where('status', '!=', IncidentStatus::Closed);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'assigned_to', 'title', 'body'])
            ->logOnlyDirty();
    }
}
