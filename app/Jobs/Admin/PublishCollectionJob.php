<?php

namespace App\Jobs\Admin;

use App\Models\AdministrativeAssignment;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use App\Notifications\Resident\NewCollectionNotification;
use App\Services\ZoneAudienceResolver;
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
        \Illuminate\Support\Facades\Log::info('getTargetUserIds returned:', ['ids' => $userIds]);

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

    private function getTargetUserIds(Collection $collection, $estate): array
    {
        $creator = $collection->creator;
        $isPropertyOwner = false;
        if ($creator) {
            $assignment = AdministrativeAssignment::with('role')
                ->where('user_id', $creator->id)
                ->where('estate_id', $estate->id)
                ->where('is_active', true)
                ->first();
            $isPropertyOwner = $assignment?->role?->name === 'property_owner';
        }
        $userIds = [];

        if ($collection->applies_to === 'all') {
            if ($isPropertyOwner) {
                $userIds = User::whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
                    ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $creator->id))
                    ->active()
                    ->acceptedInvitation()
                    ->pluck('users.id')
                    ->toArray();
            } else {
                $userIds = User::withRole('resident', $estate->id)
                    ->active()
                    ->acceptedInvitation()
                    ->pluck('users.id')
                    ->toArray();
            }
        } elseif ($collection->applies_to === 'property_owner') {
            $userIds = User::withRole('property_owner', $estate->id)
                ->active()
                ->acceptedInvitation()
                ->pluck('users.id')
                ->toArray();
        } elseif ($collection->applies_to === 'zone') {
            $zoneIds = $collection->targets
                ->filter(fn ($target) => $this->isZoneTarget($target->target_type))
                ->pluck('target_id')
                ->all();

            $userIds = app(ZoneAudienceResolver::class)->userIdsInZones($estate->id, $zoneIds);
        } else {
            foreach ($collection->targets as $target) {
                if ($target->target_type === User::class || $target->target_type === 'user') {
                    $userIds[] = $target->target_id;
                } elseif ($target->target_type === Property::class || $target->target_type === 'property' || $target->target_type === 'App\Models\Property') {
                    $propertyResidentIds = User::whereHas('profile', fn ($q) => $q->where('property_id', $target->target_id))
                        ->active()
                        ->acceptedInvitation()
                        ->pluck('id')
                        ->toArray();
                    $userIds = array_merge($userIds, $propertyResidentIds);
                } elseif ($this->isZoneTarget($target->target_type)) {
                    $zoneResidentIds = app(ZoneAudienceResolver::class)->userIdsInZones($estate->id, [(int) $target->target_id]);
                    $userIds = array_merge($userIds, $zoneResidentIds);
                }
            }
        }

        if ($collection->include_creator) {
            $userIds[] = $collection->created_by;

            return array_values(array_unique($userIds));
        }

        return array_values(array_filter(array_unique($userIds), fn ($id) => (int) $id !== (int) $collection->created_by));
    }

    private function isZoneTarget(string $targetType): bool
    {
        return $targetType === Zone::class || $targetType === 'zone' || $targetType === 'App\Models\Zone';
    }
}
