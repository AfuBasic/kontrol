<?php

namespace App\Models;

use App\Casts\IncidentCategoryCast;
use App\Enums\IncidentPriority;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Traits\GeneratesUlid;
use App\Traits\HasHashid;
use App\Traits\ZoneScoped;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
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
    use ZoneScoped;

    protected $fillable = [
        'estate_id',
        'zone_id',
        'reporter_id',
        'reporter_type',
        'source',
        'title',
        'body',
        'category',
        'priority',
        'status',
        'assigned_to',
        'upvotes_count',
        'comments_count',
        'attachment_url',
        'attachment_type',
        'attachment_hash',
        'acknowledged_at',
        'resolving_at',
        'solved_at',
        'closed_at',
        'location',
        'is_private',
    ];

    protected $appends = [
        'reporter_role_label',
        'reference_code',
    ];

    /**
     * Get a human-readable incident reference code.
     */
    public function getReferenceCodeAttribute(): string
    {
        $year = $this->created_at ? $this->created_at->format('Y') : date('Y');
        $idPad = str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);

        return "INC-{$year}-{$idPad}";
    }

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
            'category' => IncidentCategoryCast::class,
            'priority' => IncidentPriority::class,
            'source' => IncidentSource::class,
            'acknowledged_at' => 'datetime',
            'resolving_at' => 'datetime',
            'solved_at' => 'datetime',
            'closed_at' => 'datetime',
            'is_private' => 'boolean',
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
     * @return BelongsTo<Zone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function reporter(): MorphTo
    {
        return $this->morphTo();
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

    public function getReporterRoleAttribute(): string
    {
        $reporter = $this->reporter;
        if (! $reporter) {
            return 'System';
        }
        if ($reporter instanceof User) {
            $assignment = AdministrativeAssignment::with('role')
                ->where('user_id', $reporter->id)
                ->where('estate_id', $this->estate_id)
                ->where('is_active', true)
                ->first();

            if ($assignment && $assignment->role) {
                return match ($assignment->role->name) {
                    'admin' => 'Estate Administrator',
                    'security' => 'Security Personnel',
                    'property_owner' => 'Property Owner',
                    'household_member' => 'Household Member',
                    'resident' => 'Resident',
                    default => 'Resident',
                };
            }

            return 'Resident';
        }

        return class_basename($reporter);
    }

    public function isReporter(User $user): bool
    {
        return $this->reporter_id === $user->id && $this->reporter_type === get_class($user);
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
