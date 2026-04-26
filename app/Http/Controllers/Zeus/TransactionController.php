<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\PaymentTransaction;
use App\Models\ResidentSubscription;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PaymentTransaction::query()
            ->with(['estate:id,name', 'invoice.user:id,name,email'])
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
        $stats = [
            'total_volume' => PaymentTransaction::where('status', 'success')->sum('amount'),
            'monthly_volume' => PaymentTransaction::where('status', 'success')
                ->where('created_at', '>=', now()->startOfMonth())
                ->sum('amount'),
            'success_rate' => $this->calculateSuccessRate(),
            'resident_trials' => ResidentSubscription::where('status', 'trial')
                ->where('current_period_end', '>', now())
                ->count(),
            'estate_trials' => EstateSubscription::where('status', 'trial')
                ->where('trial_ends_at', '>', now())
                ->count(),
        ];

        return Inertia::render('Zeus/Transactions/Index', [
            'transactions' => $transactions,
            'estates' => Estate::select('id', 'name')->get(),
            'filters' => $request->only(['search', 'estate_id', 'status', 'date_from', 'date_to']),
            'stats' => $stats,
        ]);
    }

    private function calculateSuccessRate(): float
    {
        $total = PaymentTransaction::count();
        if ($total === 0) {
            return 100;
        }

        $success = PaymentTransaction::where('status', 'success')->count();
        return round(($success / $total) * 100, 1);
    }
}
