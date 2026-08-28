<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Estate;
use App\Models\PaymentTransaction;
use App\Services\Zeus\TransactionIntelligenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Eager-load relationships shared by both index and show.
     *
     * @return array<string>
     */
    private function eagerLoads(): array
    {
        return [
            'estate:id,name,email,address,billing_mode',
            'user:id,name,email',
            'invoice.plan:id,name,slug,billing_interval,price',
            'invoice.user:id,name,email',
        ];
    }

    public function index(Request $request, TransactionIntelligenceService $intelligenceService): Response
    {
        $query = PaymentTransaction::query()
            ->with($this->eagerLoads())
            ->latest();

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('paystack_reference', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhereHas('invoice.user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('estate_id')) {
            $query->where('estate_id', $request->estate_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->paginate(20)->withQueryString();

        // Platform Metrics
        $stats = $intelligenceService->getMetrics();
        $volumeTrend = $intelligenceService->getVolumeTrend();

        return Inertia::render('Zeus/Transactions/Index', [
            'transactions' => $transactions,
            'estates' => Estate::select('id', 'name')->get(),
            'filters' => $request->only(['search', 'estate_id', 'status', 'date_from', 'date_to']),
            'stats' => $stats,
            'volumeTrend' => $volumeTrend,
        ]);
    }

    /**
     * Return a single fully-enriched transaction for the detail drawer.
     */
    public function show(PaymentTransaction $transaction): JsonResponse
    {
        $transaction->loadMissing($this->eagerLoads());

        return response()->json($transaction);
    }
}
