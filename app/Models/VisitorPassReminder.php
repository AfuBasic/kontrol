<?php

namespace App\Models;

use App\Enums\VisitorPassReminderStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $access_code_id
 * @property int $user_id
 * @property int $estate_id
 * @property int $reminder_offset_minutes
 * @property CarbonImmutable $scheduled_for
 * @property VisitorPassReminderStatus $status
 * @property CarbonImmutable|null $sent_at
 * @property CarbonImmutable|null $cancelled_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read AccessCode $accessCode
 * @property-read User $user
 * @property-read Estate $estate
 */
class VisitorPassReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'access_code_id',
        'user_id',
        'estate_id',
        'reminder_offset_minutes',
        'scheduled_for',
        'status',
        'sent_at',
        'cancelled_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => VisitorPassReminderStatus::class,
            'scheduled_for' => 'datetime',
            'sent_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'reminder_offset_minutes' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<AccessCode, $this>
     */
    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(AccessCode::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * @param  Builder<VisitorPassReminder>  $query
     * @return Builder<VisitorPassReminder>
     */
    public function scopeDue(Builder $query): Builder
    {
        return $query->where('status', VisitorPassReminderStatus::Scheduled)
            ->where('scheduled_for', '<=', now());
    }

    /**
     * @param  Builder<VisitorPassReminder>  $query
     * @return Builder<VisitorPassReminder>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', VisitorPassReminderStatus::Scheduled);
    }

    /**
     * @param  Builder<VisitorPassReminder>  $query
     * @return Builder<VisitorPassReminder>
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function cancel(): void
    {
        $this->update([
            'status' => VisitorPassReminderStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    public function markAsSending(): void
    {
        $this->update([
            'status' => VisitorPassReminderStatus::Sending,
        ]);
    }

    public function markAsSent(): void
    {
        $this->update([
            'status' => VisitorPassReminderStatus::Sent,
            'sent_at' => now(),
        ]);
    }

    public function markAsFailed(): void
    {
        $this->update([
            'status' => VisitorPassReminderStatus::Failed,
        ]);
    }
}
