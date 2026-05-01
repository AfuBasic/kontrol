<?php

namespace App\Jobs\Admin;

use App\Models\Collection;
use App\Models\CollectionAssignment;
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
        $periodFormat = $collection->recurring_interval === 'monthly' ? 'Y-m' : 'Y';
        $currentPeriod = $now->format($periodFormat);

        // Check if we should create assignments for this period
        // For monthly: If current day is the due_day
        if ($collection->recurring_interval === 'monthly' && $now->day != $collection->due_day) {
            return;
        }

        // For yearly: If current month and day match start_date month and day
        if ($collection->recurring_interval === 'yearly') {
            $startDate = Carbon::parse($collection->start_date);
            if ($now->month != $startDate->month || $now->day != $startDate->day) {
                return;
            }
        }

        Log::info("Generating assignments for collection: {$collection->name} for period: {$currentPeriod}");

        // Reuse target user identification logic (could move to service)
        $userIds = $this->getTargetUserIds($collection);

        $dueDate = $now->copy()->toDateString();
        $graceUntil = $collection->grace_days > 0
            ? $now->copy()->addDays($collection->grace_days)->toDateString()
            : null;

        foreach ($userIds as $userId) {
            CollectionAssignment::query()->firstOrCreate(
                [
                    'collection_id' => $collection->id,
                    'user_id' => $userId,
                    'period' => $currentPeriod,
                ],
                [
                    'estate_id' => $collection->estate_id,
                    'amount_due' => $collection->amount,
                    'amount_paid' => 0,
                    'status' => 'pending',
                    'due_date' => $dueDate,
                    'grace_until' => $graceUntil,
                ]
            );
        }
    }

    private function getTargetUserIds(Collection $collection): array
    {
        if ($collection->applies_to === 'all') {
            return User::query()
                ->withRole('resident', $collection->estate_id)
                ->pluck('users.id')
                ->toArray();
        }

        return $collection->targets()
            ->where('target_type', 'user')
            ->pluck('target_id')
            ->toArray();
    }
}
