<?php

namespace App\Services\Admin;

use App\Jobs\Admin\PublishCollectionJob;
use App\Models\Collection;
use App\Models\Estate;
use Illuminate\Support\Facades\DB;

class CollectionService
{
    public function getCollections(Estate $estate)
    {
        return Collection::where('estate_id', $estate->id)
            ->withCount('assignments')
            ->latest()
            ->paginate(15);
    }

    public function createCollection(Estate $estate, array $data): Collection
    {
        return DB::transaction(function () use ($estate, $data) {
            $collection = Collection::create([
                'estate_id' => $estate->id,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'amount' => $data['amount'],
                'billing_type' => $data['billing_type'],
                'recurring_interval' => $data['recurring_interval'] ?? null,
                'start_date' => $data['start_date'],
                'due_day' => $data['due_day'] ?? 1,
                'grace_days' => $data['grace_days'] ?? 0,
                'late_fee' => $data['late_fee'] ?? null,
                'applies_to' => $data['applies_to'] ?? 'all',
                'status' => 'draft',
                'created_by' => auth()->id(),
            ]);

            if ($collection->applies_to === 'target' && isset($data['targets'])) {
                foreach ($data['targets'] as $target) {
                    $collection->targets()->create([
                        'target_type' => $target['type'],
                        'target_id' => $target['id'],
                    ]);
                }
            }

            return $collection;
        });
    }

    public function updateCollection(Collection $collection, array $data): Collection
    {
        return DB::transaction(function () use ($collection, $data) {
            $collection->update([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'amount' => $data['amount'],
                'billing_type' => $data['billing_type'],
                'recurring_interval' => $data['recurring_interval'] ?? null,
                'start_date' => $data['start_date'],
                'due_day' => $data['due_day'] ?? 1,
                'grace_days' => $data['grace_days'] ?? 0,
                'late_fee' => $data['late_fee'] ?? null,
                'applies_to' => $data['applies_to'] ?? 'all',
            ]);

            if ($collection->applies_to === 'target' && isset($data['targets'])) {
                $collection->targets()->delete();
                foreach ($data['targets'] as $target) {
                    $collection->targets()->create([
                        'target_type' => $target['type'],
                        'target_id' => $target['id'],
                    ]);
                }
            }

            return $collection;
        });
    }

    public function publishCollection(Collection $collection): void
    {
        $collection->update(['status' => 'active']);

        // Dispatch job to generate initial assignments
        PublishCollectionJob::dispatch($collection->id);
    }

    public function getCollectionStats(Collection $collection): array
    {
        $stats = DB::table('collection_assignments')
            ->where('collection_id', $collection->id)
            ->selectRaw('
                COUNT(*) as total_assignments,
                SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = "overdue" THEN 1 ELSE 0 END) as overdue_count,
                SUM(amount_due) as total_expected,
                SUM(amount_paid) as total_collected
            ')
            ->first();

        return (array) $stats;
    }
}
