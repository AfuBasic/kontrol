<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Payment;
use App\Services\EstateContextService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CollectionAnalyticsController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext
    ) {}

    public function index(Request $request): JsonResponse
    {
        $estateId = $this->estateContext->getEstate()->id;
        $days = (int) $request->input('days', 30);
        
        $cacheKey = "estate_{$estateId}_collection_analytics_{$days}";
        $ttl = 300; // Cache for 5 minutes to ensure high speed loading

        $data = Cache::remember($cacheKey, $ttl, function () use ($estateId, $days) {
            return [
                'trends' => $this->getRevenueTrends($estateId, $days),
                'activity' => $this->getRecentActivity($estateId),
                'performance' => $this->getCollectionPerformance($estateId),
                'distribution' => $this->getRevenueDistribution($estateId),
                'outstanding' => $this->getOutstandingBalances($estateId),
            ];
        });

        return response()->json($data);
    }

    private function getRevenueTrends(int $estateId, int $days): array
    {
        $startDate = Carbon::now()->subDays($days)->startOfDay();
        
        // Expected revenue (assignments created)
        $expectedRaw = CollectionAssignment::whereHas('collection', function ($q) use ($estateId) {
            $q->where('estate_id', $estateId)
              ->whereDoesntHave('creator.roles', function ($sq) use ($estateId) {
                  $sq->where('name', 'property_owner')
                     ->where('model_has_roles.estate_id', $estateId);
              });
        })
        ->where('created_at', '>=', $startDate)
        ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount_due) as total'))
        ->groupBy('date')
        ->pluck('total', 'date');

        // Actual revenue (payments successful)
        $actualRaw = Payment::where('status', 'success')
            ->whereHas('collectionAssignment.collection', function ($q) use ($estateId) {
                $q->where('estate_id', $estateId)
                  ->whereDoesntHave('creator.roles', function ($sq) use ($estateId) {
                      $sq->where('name', 'property_owner')
                         ->where('model_has_roles.estate_id', $estateId);
                  });
            })
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as total'))
            ->groupBy('date')
            ->pluck('total', 'date');

        $trends = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $dateStr = Carbon::now()->subDays($i)->format('Y-m-d');
            $trends[] = [
                'date' => Carbon::parse($dateStr)->format('M d'),
                'expected' => (float) ($expectedRaw[$dateStr] ?? 0),
                'actual' => (float) ($actualRaw[$dateStr] ?? 0),
            ];
        }

        return $trends;
    }

    private function getRecentActivity(int $estateId): array
    {
        return Payment::with(['user', 'collectionAssignment.collection'])
            ->where('status', 'success')
            ->whereHas('collectionAssignment.collection', function ($q) use ($estateId) {
                $q->where('estate_id', $estateId)
                  ->whereDoesntHave('creator.roles', function ($sq) use ($estateId) {
                      $sq->where('name', 'property_owner')
                         ->where('model_has_roles.estate_id', $estateId);
                  });
            })
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'actor' => $payment->user ? $payment->user->name : 'Unknown User',
                    'action' => 'paid for ' . ($payment->collectionAssignment->collection->name ?? 'Collection'),
                    'amount' => (float) $payment->amount,
                    'timestamp' => $payment->created_at->diffForHumans(),
                ];
            })->toArray();
    }

    private function getCollectionPerformance(int $estateId): array
    {
        return Collection::where('estate_id', $estateId)
            ->where('status', 'active')
            ->whereDoesntHave('creator.roles', function ($sq) use ($estateId) {
                $sq->where('name', 'property_owner')
                   ->where('model_has_roles.estate_id', $estateId);
            })
            ->withCount('assignments')
            ->get()
            ->map(function ($collection) {
                $expected = $collection->assignments()->sum('amount_due');
                $collected = $collection->assignments()->sum('amount_paid');
                
                return [
                    'id' => $collection->id,
                    'name' => $collection->name,
                    'expected' => (float) $expected,
                    'collected' => (float) $collected,
                    'progress' => $expected > 0 ? min(100, round(($collected / $expected) * 100)) : 0,
                ];
            })
            ->filter(fn ($item) => $item['expected'] > 0)
            ->sortByDesc('expected')
            ->values()
            ->toArray();
    }

    private function getRevenueDistribution(int $estateId): array
    {
        return Collection::where('estate_id', $estateId)
            ->whereDoesntHave('creator.roles', function ($sq) use ($estateId) {
                $sq->where('name', 'property_owner')
                   ->where('model_has_roles.estate_id', $estateId);
            })
            ->get()
            ->map(function ($collection) {
                return [
                    'name' => $collection->name,
                    'value' => (float) $collection->assignments()->sum('amount_paid')
                ];
            })
            ->filter(fn ($item) => $item['value'] > 0)
            ->sortByDesc('value')
            ->values()
            ->toArray();
    }

    private function getOutstandingBalances(int $estateId): array
    {
        $overdueAssignments = CollectionAssignment::with(['user.profile', 'collection'])
            ->whereHas('collection', function ($q) use ($estateId) {
                $q->where('estate_id', $estateId)
                  ->whereDoesntHave('creator.roles', function ($sq) use ($estateId) {
                      $sq->where('name', 'property_owner')
                         ->where('model_has_roles.estate_id', $estateId);
                  });
            })
            ->whereRaw('(amount_due - amount_paid) > 0')
            ->where(function($q) {
                $q->where('status', 'overdue')
                  ->orWhere(function($sq) {
                      $sq->whereIn('status', ['pending', 'partial'])
                         ->where(function($subq) {
                             $subq->whereNotNull('grace_until')->where('grace_until', '<', Carbon::today())
                                  ->orWhere(function($ssq) {
                                      $ssq->whereNull('grace_until')->where('due_date', '<', Carbon::today());
                                  });
                         });
                  });
            })
            ->get();

        // Group by user
        $grouped = $overdueAssignments->groupBy('user_id');

        $result = $grouped->map(function ($assignments) {
            $user = $assignments->first()->user;
            $totalOverdue = $assignments->sum(fn ($a) => $a->amount_due - $a->amount_paid);
            
            // Find the oldest due date
            $oldestDate = $assignments->min(function ($a) {
                return $a->grace_until ? Carbon::parse($a->grace_until) : Carbon::parse($a->due_date);
            });
            $daysOverdue = $oldestDate ? Carbon::today()->diffInDays($oldestDate) : 0;
            
            return [
                'user_id' => $user->id ?? null,
                'name' => $user->name ?? 'Unknown User',
                'property' => $user->profile->unit_number ?? 'Unknown Unit',
                'amount' => (float) $totalOverdue,
                'days_overdue' => $daysOverdue,
            ];
        })
        ->sortByDesc('amount')
        ->take(5)
        ->values()
        ->toArray();

        return $result;
    }
}
