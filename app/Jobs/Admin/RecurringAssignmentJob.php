<?php

namespace App\Jobs\Admin;

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Property;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RecurringAssignmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $now = Carbon::now();

        // Find all active recurring collections
        $collections = Collection::query()
            ->where('status', 'active')
            ->where('billing_type', 'recurring')
            ->get();

        foreach ($collections as $collection) {
            $this->processCollection($collection, $now);
        }
    }

    private function processCollection(Collection $collection, Carbon $now): void
    {
        $startDate = Carbon::parse($collection->start_date);
        $periodFormat = match ($collection->recurring_interval) {
            'weekly' => 'Y-W',
            'yearly' => 'Y',
            default => 'Y-m',   // monthly
        };
        $currentPeriod = $now->format($periodFormat);

        // New assignments are created on the anniversary of start_date each period,
        // NOT on due_day. due_day is when payment is due (used for reminders/overdue logic).
        if ($collection->recurring_interval === 'weekly') {
            // Trigger on the same day-of-week as the start_date
            if ($now->dayOfWeek !== $startDate->dayOfWeek) {
                return;
            }
        }

        if ($collection->recurring_interval === 'monthly') {
            if ($now->day !== $startDate->day) {
                return;
            }
        }

        if ($collection->recurring_interval === 'yearly') {
            if ($now->month !== $startDate->month || $now->day !== $startDate->day) {
                return;
            }
        }

        Log::info("Generating assignments for collection: {$collection->name} for period: {$currentPeriod}");

        $userIds = $this->getTargetUserIds($collection);

        // due_date is due_day of the current period, not today (the start day)
        // For weekly collections, the due_date is 7 days from today (start of the week)
        if ($collection->recurring_interval === 'weekly') {
            $dueDate = $now->copy()->addDays(7);
        } else {
            $dueDate = $now->copy()->day($collection->due_day);

            // Handle edge case: if due_day is less than start day (e.g. starts on 20th, due on 5th),
            // the due date falls in the next month
            if ($dueDate->lt($now)) {
                $dueDate->addMonth();
            }
        }

        $graceUntil = $collection->grace_days > 0
            ? $dueDate->copy()->addDays($collection->grace_days)
            : null;

        foreach ($userIds as $userId) {
            $user = User::with('profile')->find($userId);
            $propertyId = $user?->profile?->property_id;

            CollectionAssignment::query()->firstOrCreate(
                [
                    'collection_id' => $collection->id,
                    'user_id' => $userId,
                    'period' => $currentPeriod,
                ],
                [
                    'estate_id' => $collection->estate_id,
                    'property_id' => $propertyId,
                    'amount_due' => $collection->amount,
                    'amount_paid' => 0,
                    'status' => 'pending',
                    'due_date' => $dueDate->toDateString(),
                    'grace_until' => $graceUntil?->toDateString(),
                ]
            );
        }
    }

    private function getTargetUserIds(Collection $collection): array
    {
        $creator = $collection->creator;
        setPermissionsTeamId($collection->estate_id);
        $isPropertyOwner = $creator && $creator->hasRole('property_owner');
        $userIds = [];

        if ($collection->applies_to === 'all') {
            if ($isPropertyOwner) {
                $userIds = User::whereHas('estates', fn ($q) => $q->where('estates.id', $collection->estate_id)->where('estate_users_membership.property_owner_id', $creator->id))
                    ->pluck('users.id')
                    ->toArray();
            } else {
                $userIds = User::query()
                    ->withRole('resident', $collection->estate_id)
                    ->pluck('users.id')
                    ->toArray();
            }
        } else {
            foreach ($collection->targets as $target) {
                if ($target->target_type === User::class || $target->target_type === 'user') {
                    $userIds[] = $target->target_id;
                } elseif ($target->target_type === Property::class || $target->target_type === 'property' || $target->target_type === 'App\Models\Property') {
                    $propertyResidentIds = User::whereHas('profile', fn ($q) => $q->where('property_id', $target->target_id))
                        ->pluck('id')
                        ->toArray();
                    $userIds = array_merge($userIds, $propertyResidentIds);
                }
            }
        }

        if ($collection->include_creator) {
            $userIds[] = $collection->created_by;

            return array_values(array_unique($userIds));
        }

        return array_values(array_filter(array_unique($userIds), fn ($id) => (int) $id !== (int) $collection->created_by));
    }
}
