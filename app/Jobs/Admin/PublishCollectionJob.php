<?php

namespace App\Jobs\Admin;

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\User;
use App\Notifications\Resident\NewCollectionNotification;
use App\Services\Admin\CollectionService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PublishCollectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $collectionId) {}

    public function handle(): void
    {
        $collection = Collection::with('targets')->findOrFail($this->collectionId);
        $estate = $collection->estate;

        $userIds = app(CollectionService::class)->resolveTargetUserIds($collection);

        $dueDate = $collection->due_at;

        if ($collection->isRecurring()) {
            $dueDate = Carbon::parse($collection->start_date)->day($collection->due_day);
        }

        if (! $dueDate) {
            $dueDate = $collection->start_date;
        }

        $graceUntil = $collection->grace_days > 0
            ? Carbon::parse($dueDate)->addDays($collection->grace_days)
            : null;

        $period = $collection->isRecurring()
            ? Carbon::parse($collection->start_date)->format($collection->recurring_interval === 'monthly' ? 'Y-m' : 'Y')
            : null;

        $today = Carbon::today();
        $status = 'pending';

        if ($graceUntil && $dueDate->lt($today) && $graceUntil->gte($today)) {
            $status = 'grace';
        } elseif ($dueDate->lt($today)) {
            $status = 'overdue';
        }

        foreach ($userIds as $userId) {
            $user = User::with('profile')->find($userId);
            $propertyId = $user?->profile?->property_id;

            $assignment = CollectionAssignment::firstOrCreate(
                [
                    'collection_id' => $collection->id,
                    'user_id' => $userId,
                    'period' => $period,
                ],
                [
                    'estate_id' => $estate->id,
                    'property_id' => $propertyId,
                    'amount_due' => $collection->amount,
                    'amount_paid' => 0,
                    'status' => $status,
                    'due_date' => $dueDate,
                    'grace_until' => $graceUntil,
                ]
            );

            if ($assignment->wasRecentlyCreated) {
                $assignment->user->notify(new NewCollectionNotification($assignment));
            }
        }
    }
}
