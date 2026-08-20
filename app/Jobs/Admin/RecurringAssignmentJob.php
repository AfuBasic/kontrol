<?php

namespace App\Jobs\Admin;

use App\Models\AdministrativeAssignment;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use App\Services\ZoneAudienceResolver;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RecurringAssignmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $now = Carbon::now();

        // Find all active recurring collections that are due for processing
        $collections = Collection::query()
            ->where('status', 'active')
            ->where('billing_type', 'recurring')
            ->where('next_processing_date', '<=', $now->endOfDay())
            ->with(['targets', 'creator', 'estate'])
            ->get();

        foreach ($collections as $collection) {
            $this->processCollection($collection, $now);
        }
    }

    private function processCollection(Collection $collection, Carbon $now): void
    {
        while ($collection->next_processing_date && $collection->next_processing_date->startOfDay()->lte($now->startOfDay())) {
            $processingDate = $collection->next_processing_date->copy();

            $periodFormat = match ($collection->recurring_interval) {
                'weekly' => 'Y-W',
                'yearly' => 'Y',
                default => 'Y-m',   // monthly
            };
            $currentPeriod = $processingDate->format($periodFormat);

            Log::info("Generating assignments for collection: {$collection->name} for period: {$currentPeriod}");

            $userIds = $this->getTargetUserIds($collection);

            if ($collection->recurring_interval === 'weekly') {
                $dueDate = $processingDate->copy()->addDays(7);
            } else {
                $dueDate = $processingDate->copy()->day($collection->due_day);
                if ($dueDate->lt($processingDate)) {
                    $dueDate->addMonthNoOverflow();
                }
            }

            $graceUntil = $collection->grace_days > 0
                ? $dueDate->copy()->addDays($collection->grace_days)
                : null;

            $this->createAssignments($collection, $userIds, $currentPeriod, $dueDate, $graceUntil);

            // Increment next_processing_date
            if ($collection->recurring_interval === 'weekly') {
                $collection->next_processing_date = $collection->next_processing_date->addWeek();
            } elseif ($collection->recurring_interval === 'yearly') {
                $collection->next_processing_date = $collection->next_processing_date->addYearNoOverflow();
            } else {
                $collection->next_processing_date = $collection->next_processing_date->addMonthNoOverflow();
            }

            $collection->save();
        }
    }

    private function createAssignments(Collection $collection, array $userIds, string $currentPeriod, CarbonInterface $dueDate, ?CarbonInterface $graceUntil): void
    {
        if (empty($userIds)) {
            return;
        }

        $users = User::with('profile')->whereIn('id', $userIds)->get()->keyBy('id');

        $existingAssignments = CollectionAssignment::withoutGlobalScopes()
            ->where('collection_id', $collection->id)
            ->where('period', $currentPeriod)
            ->whereIn('user_id', $userIds)
            ->pluck('user_id')
            ->toArray();

        $existingMap = array_flip($existingAssignments);
        $now = now();
        $insertData = [];

        foreach ($userIds as $userId) {
            if (isset($existingMap[$userId])) {
                continue;
            }

            $user = $users->get($userId);
            $propertyId = $user?->profile?->property_id;

            $insertData[] = [
                'ulid' => (string) Str::ulid(),
                'collection_id' => $collection->id,
                'user_id' => $userId,
                'period' => $currentPeriod,
                'estate_id' => $collection->estate_id,
                'property_id' => $propertyId,
                'amount_due' => $collection->amount,
                'amount_paid' => 0,
                'status' => 'pending',
                'due_date' => $dueDate->toDateString(),
                'grace_until' => $graceUntil?->toDateString(),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (! empty($insertData)) {
            foreach (array_chunk($insertData, 500) as $chunk) {
                CollectionAssignment::insert($chunk);
            }
        }
    }

    private function getTargetUserIds(Collection $collection): array
    {
        $creator = $collection->creator;
        $isPropertyOwner = false;
        if ($creator) {
            $assignment = AdministrativeAssignment::with('role')
                ->where('user_id', $creator->id)
                ->where('estate_id', $collection->estate_id)
                ->where('is_active', true)
                ->first();
            $isPropertyOwner = $assignment?->role?->name === 'property_owner';
        }
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
        } elseif ($collection->applies_to === 'zone') {
            $zoneIds = $collection->targets
                ->filter(fn ($target) => $this->isZoneTarget($target->target_type))
                ->pluck('target_id')
                ->all();

            $userIds = app(ZoneAudienceResolver::class)->userIdsInZones($collection->estate_id, $zoneIds, false);
        } else {
            foreach ($collection->targets as $target) {
                if ($target->target_type === User::class || $target->target_type === 'user') {
                    $userIds[] = $target->target_id;
                } elseif ($target->target_type === Property::class || $target->target_type === 'property' || $target->target_type === 'App\Models\Property') {
                    $propertyResidentIds = User::whereHas('profile', fn ($q) => $q->where('property_id', $target->target_id))
                        ->pluck('id')
                        ->toArray();
                    $userIds = array_merge($userIds, $propertyResidentIds);
                } elseif ($this->isZoneTarget($target->target_type)) {
                    $zoneResidentIds = app(ZoneAudienceResolver::class)->userIdsInZones($collection->estate_id, [(int) $target->target_id], false);
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
