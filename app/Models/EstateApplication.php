<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $source
 * @property int|null $partner_id
 * @property int|null $estate_id
 * @property string $estate_name
 * @property string|null $contact_name
 * @property string $email
 * @property string|null $address
 * @property string|null $state
 * @property string|null $lga
 * @property string $phone
 * @property int|null $number_of_houses
 * @property string|null $notes
 * @property string $status
 * @property string|null $rejection_reason
 * @property string|null $info_request_message
 * @property CarbonImmutable|null $reviewed_at
 * @property int|null $assigned_to
 * @property string|null $challenges
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property CarbonImmutable|null $deleted_at
 * @property-read Partner|null $partner
 * @property-read Estate|null $estate
 * @property-read User|null $assignedTo
 * @property-read Collection<int, ApplicationNote> $notesList
 * @property-read Collection<int, ApplicationTimeline> $timelineEvents
 */
class EstateApplication extends Model
{
    use SoftDeletes;

    public const SOURCE_PUBLIC = 'public';

    public const SOURCE_PARTNER = 'partner';

    public const OPEN_STATUSES = [
        'pending',
        'received',
        'under_review',
        'info_requested',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'source',
        'partner_id',
        'estate_id',
        'estate_name',
        'contact_name',
        'email',
        'address',
        'state',
        'lga',
        'phone',
        'number_of_houses',
        'notes',
        'status',
        'reviewed_at',
        'assigned_to',
        'challenges',
        'rejection_reason',
        'info_request_message',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'deleted_at' => 'datetime',
            'number_of_houses' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
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
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * @return HasMany<ApplicationNote, $this>
     */
    public function notesList(): HasMany
    {
        return $this->hasMany(ApplicationNote::class);
    }

    /**
     * @return HasMany<ApplicationTimeline, $this>
     */
    public function timelineEvents(): HasMany
    {
        return $this->hasMany(ApplicationTimeline::class);
    }

    public function isPending(): bool
    {
        return in_array($this->status, self::OPEN_STATUSES, true);
    }

    public function isPartnerSourced(): bool
    {
        return $this->source === self::SOURCE_PARTNER || $this->partner_id !== null;
    }

    public function markAsContacted(): void
    {
        $this->update([
            'status' => 'under_review',
            'reviewed_at' => now(),
        ]);
    }

    public function markAsApproved(): void
    {
        $this->update([
            'status' => 'approved',
            'reviewed_at' => now(),
        ]);
    }

    public function markAsRejected(): void
    {
        $this->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
        ]);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', self::OPEN_STATUSES);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeForPartner(Builder $query, int $partnerId): Builder
    {
        return $query->where('partner_id', $partnerId);
    }

    /**
     * Partner portal status label (Submitted / Accepted / Rejected only).
     */
    public function partnerStatusLabel(): string
    {
        return match ($this->partnerStatusKey()) {
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            default => 'Submitted',
        };
    }

    /**
     * Partner pipeline column key.
     *
     * Collapses internal review states into three partner-facing buckets:
     * submitted → accepted → rejected.
     */
    public function partnerStatusKey(): string
    {
        return match ($this->status) {
            'approved' => 'accepted',
            'rejected' => 'rejected',
            default => 'submitted',
        };
    }
}
