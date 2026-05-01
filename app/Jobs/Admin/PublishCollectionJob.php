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

class PublishCollectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $collectionId) {}

    public function handle(): void
    {
        $collection = Collection::with('targets')->findOrFail($this->collectionId);
        $estate = $collection->estate;

        $userIds = $this->getTargetUserIds($collection, $estate);

        $dueDate = $collection->start_date;
        $graceUntil = $collection->grace_days > 0
            ? Carbon::parse($dueDate)->addDays($collection->grace_days)
            : null;

        $period = $collection->isRecurring()
            ? Carbon::parse($collection->start_date)->format($collection->recurring_interval === 'monthly' ? 'Y-m' : 'Y')
            : null;

        foreach ($userIds as $userId) {
            CollectionAssignment::firstOrCreate(
                [
                    'collection_id' => $collection->id,
                    'user_id' => $userId,
                    'period' => $period,
                ],
                [
                    'estate_id' => $estate->id,
                    'amount_due' => $collection->amount,
                    'amount_paid' => 0,
                    'status' => 'pending',
                    'due_date' => $dueDate,
                    'grace_until' => $graceUntil,
                ]
            );
        }
    }

    private function getTargetUserIds(Collection $collection, $estate): array
    {
        if ($collection->applies_to === 'all') {
            return User::withRole('resident', $estate->id)
                ->pluck('users.id')
                ->toArray();
        }

        $userIds = [];
        foreach ($collection->targets as $target) {
            if ($target->target_type === 'user') {
                $userIds[] = $target->target_id;
            }
            // Add block/unit logic here if needed,
            // e.g., finding all residents in a specific block
        }

        return array_unique($userIds);
    }
}
