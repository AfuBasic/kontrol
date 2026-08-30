<?php

namespace App\Services\Resident;

use App\Enums\AccessCodeStatus;
use App\Enums\VisitorPassReminderStatus;
use App\Models\AccessCode;
use App\Models\User;
use App\Models\VisitorPassReminder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VisitorPassReminderService
{
    /**
     * Standard predefined reminder offsets in minutes:
     * 24h (1440), 12h (720), 6h (360), 2h (120), 1h (60).
     *
     * @var array<int, array{minutes: int, label: string}>
     */
    public const PRESET_OPTIONS = [
        ['minutes' => 1440, 'label' => '24 hours before'],
        ['minutes' => 720, 'label' => '12 hours before'],
        ['minutes' => 360, 'label' => '6 hours before'],
        ['minutes' => 120, 'label' => '2 hours before'],
        ['minutes' => 60, 'label' => '1 hour before'],
    ];

    /**
     * Get valid reminder options whose calculated dispatch time is in the future.
     *
     * @return array<int, array{minutes: int, label: string}>
     */
    public function getAvailableReminderOptions(AccessCode $accessCode): array
    {
        if (! $accessCode->starts_at) {
            return [];
        }

        $now = now();
        $startsAt = $accessCode->starts_at;

        return collect(self::PRESET_OPTIONS)
            ->filter(function ($option) use ($startsAt, $now) {
                $remindAt = $startsAt->copy()->subMinutes($option['minutes']);

                return $remindAt->greaterThan($now);
            })
            ->values()
            ->all();
    }

    /**
     * Schedule or update a reminder for a scheduled visitor pass.
     *
     * @throws ValidationException
     */
    public function setReminder(AccessCode $accessCode, int $offsetMinutes, User $user): VisitorPassReminder
    {
        if (! in_array($accessCode->status, [AccessCodeStatus::Active, AccessCodeStatus::Scheduled], true)) {
            throw ValidationException::withMessages([
                'reminder' => ['Reminders can only be set for active or scheduled visitor passes.'],
            ]);
        }

        if (! $accessCode->starts_at) {
            throw ValidationException::withMessages([
                'reminder' => ['A scheduled start time is required to set a visit reminder.'],
            ]);
        }

        $validOffsets = collect(self::PRESET_OPTIONS)->pluck('minutes')->all();
        if (! in_array($offsetMinutes, $validOffsets, true)) {
            throw ValidationException::withMessages([
                'reminder_offset_minutes' => ['Invalid reminder option selected.'],
            ]);
        }

        $scheduledFor = $accessCode->starts_at->copy()->subMinutes($offsetMinutes);
        if ($scheduledFor->isPast()) {
            throw ValidationException::withMessages([
                'reminder_offset_minutes' => ['The selected reminder time has already passed.'],
            ]);
        }

        return VisitorPassReminder::updateOrCreate(
            [
                'access_code_id' => $accessCode->id,
                'user_id' => $user->id,
            ],
            [
                'estate_id' => $accessCode->estate_id,
                'reminder_offset_minutes' => $offsetMinutes,
                'scheduled_for' => $scheduledFor,
                'status' => VisitorPassReminderStatus::Scheduled,
                'cancelled_at' => null,
                'sent_at' => null,
            ]
        );
    }

    /**
     * Remove / cancel an active reminder for a pass.
     */
    public function removeReminder(AccessCode $accessCode, User $user): bool
    {
        $reminder = VisitorPassReminder::query()
            ->where('access_code_id', $accessCode->id)
            ->where('user_id', $user->id)
            ->first();

        if ($reminder) {
            $reminder->cancel();

            return true;
        }

        return false;
    }

    /**
     * Recalculate reminder when a pass's start time changes.
     */
    public function rescheduleReminder(AccessCode $accessCode): ?VisitorPassReminder
    {
        $reminder = $accessCode->reminder;

        if (! $reminder || $reminder->status !== VisitorPassReminderStatus::Scheduled) {
            return null;
        }

        if (! $accessCode->starts_at) {
            $reminder->cancel();

            return $reminder;
        }

        $newScheduledFor = $accessCode->starts_at->copy()->subMinutes($reminder->reminder_offset_minutes);

        if ($newScheduledFor->isPast()) {
            $reminder->cancel();

            return $reminder;
        }

        $reminder->update([
            'scheduled_for' => $newScheduledFor,
        ]);

        return $reminder;
    }

    /**
     * Atomically claim due reminders for batch processing.
     *
     * @return Collection<int, VisitorPassReminder>
     */
    public function claimDueReminders(int $limit = 50): Collection
    {
        return DB::transaction(function () use ($limit) {
            $ids = VisitorPassReminder::query()
                ->where('status', VisitorPassReminderStatus::Scheduled)
                ->where('scheduled_for', '<=', now())
                ->lockForUpdate()
                ->limit($limit)
                ->pluck('id');

            if ($ids->isEmpty()) {
                return new Collection;
            }

            VisitorPassReminder::query()->whereIn('id', $ids)->update([
                'status' => VisitorPassReminderStatus::Sending,
            ]);

            return VisitorPassReminder::with(['accessCode.estate', 'user'])->whereIn('id', $ids)->get();
        });
    }
}
