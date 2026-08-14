<?php

namespace App\Services\Admin;

use App\Jobs\Admin\PublishCollectionJob;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Models\Zone;
use App\Notifications\Resident\CollectionReminderNotification;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CollectionService
{
    public function getCollections(Estate $estate): LengthAwarePaginator
    {
        return Collection::where('estate_id', $estate->id)
            ->withCount(['assignments', 'targets'])
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
                'due_at' => $data['due_at'] ?? null,
                'due_day' => $data['due_day'] ?? 1,
                'grace_days' => $data['grace_days'] ?? 0,
                'late_fee' => $data['late_fee'] ?? null,
                'applies_to' => $data['applies_to'] ?? 'all',
                'status' => 'draft',
                'created_by' => auth()->id(),
            ]);

            $this->syncTargets($collection, $data);

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
                'due_at' => $data['due_at'] ?? null,
                'due_day' => $data['due_day'] ?? 1,
                'grace_days' => $data['grace_days'] ?? 0,
                'late_fee' => $data['late_fee'] ?? null,
                'applies_to' => $data['applies_to'] ?? 'all',
            ]);

            $this->syncTargets($collection, $data);

            return $collection;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncTargets(Collection $collection, array $data): void
    {
        $collection->targets()->delete();

        if ($collection->applies_to === 'target' && isset($data['targets'])) {
            foreach ($data['targets'] as $targetId) {
                $collection->targets()->create([
                    'target_type' => User::class,
                    'target_id' => $targetId,
                ]);
            }

            return;
        }

        if ($collection->applies_to === 'zone' && isset($data['zones'])) {
            foreach ($data['zones'] as $zoneId) {
                $collection->targets()->create([
                    'target_type' => Zone::class,
                    'target_id' => $zoneId,
                ]);
            }
        }
    }

    public function publishCollection(Collection $collection): void
    {
        $collection->update(['status' => 'active']);

        // Dispatch job to generate initial assignments
        PublishCollectionJob::dispatch($collection->id);
    }

    public function getCollectionStats(Collection $collection): array
    {
        $today = Carbon::today()->toDateString();
        $stats = DB::table('collection_assignments')
            ->where('collection_id', $collection->id)
            ->selectRaw('
                COUNT(*) as total_assignments,
                SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status IN ("pending", "grace") OR (status = "partial" AND (grace_until >= ? OR (grace_until IS NULL AND due_date >= ?))) THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = "overdue" OR (status = "partial" AND (grace_until < ? OR (grace_until IS NULL AND due_date < ?))) THEN 1 ELSE 0 END) as overdue_count,
                SUM(amount_due) as total_expected,
                SUM(amount_paid) as total_collected
            ', [$today, $today, $today, $today])
            ->first();

        return [
            'total_assignments' => (int) ($stats->total_assignments ?? 0),
            'paid_count' => (int) ($stats->paid_count ?? 0),
            'pending_count' => (int) ($stats->pending_count ?? 0),
            'overdue_count' => (int) ($stats->overdue_count ?? 0),
            'total_expected' => (int) ($stats->total_expected ?? 0),
            'total_collected' => (int) ($stats->total_collected ?? 0),
        ];
    }

    public function sendReminders(Collection $collection): int
    {
        $settings = EstateSettings::forEstate($collection->estate_id);
        $maxAttempts = (int) ($settings->collection_maximum_reminder_attempts ?: 3);

        $assignments = $collection->assignments()
            ->where('status', '!=', 'paid')
            ->where(function ($q) use ($maxAttempts) {
                $q->whereNull('reminder_count')
                    ->orWhere('reminder_count', '<', $maxAttempts);
            })
            ->with('user')
            ->get();

        $sentCount = 0;
        foreach ($assignments as $assignment) {
            $assignment->user->notify(new CollectionReminderNotification($assignment));
            $assignment->increment('reminder_count');
            $sentCount++;
        }

        return $sentCount;
    }

    public function exportActivity(Collection $collection): string
    {
        $assignments = $collection->assignments()
            ->with('user')
            ->latest()
            ->get();

        $headers = [
            'Resident',
            'Email',
            'Amount Due',
            'Amount Paid',
            'Status',
            'Due Date',
            'Paid At',
        ];

        $callback = function () use ($assignments, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            foreach ($assignments as $assignment) {
                fputcsv($file, [
                    $assignment->user->name,
                    $assignment->user->email,
                    $assignment->amount_due,
                    $assignment->amount_paid,
                    ucfirst($assignment->status),
                    $assignment->due_date->format('Y-m-d'),
                    $assignment->paid_at ? $assignment->paid_at->format('Y-m-d H:i') : 'N/A',
                ]);
            }

            fclose($file);
        };

        ob_start();
        $callback();

        return ob_get_clean();
    }

    public function recordPayment(CollectionAssignment $assignment, array $data): void
    {
        DB::transaction(function () use ($assignment, $data) {
            $amount = (int) $data['amount'];
            $assignment->amount_paid += $amount;

            if ($assignment->amount_paid >= $assignment->amount_due) {
                $assignment->status = 'paid';
                $assignment->paid_at = now();
            } else {
                $assignment->status = 'partial';
            }

            $assignment->save();

            // Create a payment record for tracking
            $assignment->payments()->create([
                'estate_id' => $assignment->estate_id,
                'user_id' => $assignment->user_id,
                'amount' => $amount,
                'provider' => $data['method'] ?? 'manual',
                'status' => 'success',
                'reference' => 'MANUAL-'.strtoupper(Str::random(8)),
                'paid_at' => now(),
            ]);
        });
    }
}
