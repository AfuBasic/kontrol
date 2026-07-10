<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateMonthlyPartnerEarningsJob;
use App\Models\CommissionableRevenue;
use App\Models\PartnerEarning;
use App\Notifications\Partner\EarningSettledNotification;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SettlementsController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $partnerSearch = $request->string('partner')->toString();
        $monthFrom = $request->string('month_from')->toString();
        $monthTo = $request->string('month_to')->toString();

        $query = PartnerEarning::query()
            ->with(['partner:id,name', 'settledBy:id,name'])
            ->orderByDesc('month')
            ->orderByDesc('id');

        if ($status === 'accruing') {
            $query->whereNull('settled_at')
                ->whereDate('month', CarbonImmutable::now()->startOfMonth()->toDateString());
        } elseif ($status === 'pending') {
            $query->whereNull('settled_at')
                ->whereDate('month', '<', CarbonImmutable::now()->startOfMonth()->toDateString());
        } elseif ($status === 'paid') {
            $query->whereNotNull('settled_at');
        } elseif ($status === 'unsettled' || $status === '') {
            // Default inbox: unsettled first; still allow paid via filter
            if ($status === 'unsettled' || $status === '') {
                // Show unsettled primarily; also recent paid for history
                if ($status === '') {
                    // No filter: unsettled + last 30 days paid
                    $query->where(function ($q) {
                        $q->whereNull('settled_at')
                            ->orWhere('settled_at', '>=', now()->subDays(30));
                    });
                }
            }
        }

        if ($partnerSearch !== '') {
            $query->whereHas('partner', function ($q) use ($partnerSearch) {
                $q->where('name', 'like', "%{$partnerSearch}%");
            });
        }

        if ($monthFrom !== '') {
            $query->whereDate('month', '>=', CarbonImmutable::parse($monthFrom)->startOfMonth()->toDateString());
        }

        if ($monthTo !== '') {
            $query->whereDate('month', '<=', CarbonImmutable::parse($monthTo)->startOfMonth()->toDateString());
        }

        $earnings = $query
            ->paginate(30)
            ->withQueryString()
            ->through(fn (PartnerEarning $earning) => $this->transformEarning($earning));

        $outstanding = (int) PartnerEarning::query()->whereNull('settled_at')->sum('total_amount');
        $partnersWithBalance = (int) PartnerEarning::query()
            ->whereNull('settled_at')
            ->distinct('partner_id')
            ->count('partner_id');
        $unsettledCount = (int) PartnerEarning::query()->whereNull('settled_at')->count();

        return Inertia::render('Zeus/Settlements/Index', [
            'earnings' => $earnings,
            'summary' => [
                'outstanding_kobo' => $outstanding,
                'partners_with_balance' => $partnersWithBalance,
                'unsettled_count' => $unsettledCount,
            ],
            'filters' => [
                'status' => $status,
                'partner' => $partnerSearch,
                'month_from' => $monthFrom,
                'month_to' => $monthTo,
            ],
            'statusOptions' => [
                ['value' => '', 'label' => 'Unsettled + recent paid'],
                ['value' => 'unsettled', 'label' => 'Unsettled only'],
                ['value' => 'accruing', 'label' => 'Accruing (this month)'],
                ['value' => 'pending', 'label' => 'Pending settlement'],
                ['value' => 'paid', 'label' => 'Paid'],
            ],
        ]);
    }

    public function pay(Request $request, PartnerEarning $earning): RedirectResponse
    {
        if ($earning->isSettled()) {
            throw ValidationException::withMessages([
                'earning' => 'This earning has already been settled.',
            ])->status(409);
        }

        $validated = $request->validate([
            'payment_reference' => ['required', 'string', 'max:255'],
            'payment_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->settleEarning($earning, $validated['payment_reference'], $validated['payment_note'] ?? null);

        return redirect()
            ->route('zeus.settlements.index')
            ->with('success', "Marked {$earning->month->format('F Y')} as paid for {$earning->partner?->name}.");
    }

    public function payBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'earning_ids' => ['required', 'array', 'min:1'],
            'earning_ids.*' => ['integer', 'exists:partner_earnings,id'],
            'payment_reference' => ['required', 'string', 'max:255'],
            'payment_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $earnings = PartnerEarning::query()
            ->with('partner.members')
            ->whereIn('id', $validated['earning_ids'])
            ->whereNull('settled_at')
            ->get();

        if ($earnings->isEmpty()) {
            return redirect()
                ->route('zeus.settlements.index')
                ->with('error', 'No unsettled earnings selected.');
        }

        foreach ($earnings as $earning) {
            $this->settleEarning(
                $earning,
                $validated['payment_reference'],
                $validated['payment_note'] ?? null,
            );
        }

        return redirect()
            ->route('zeus.settlements.index')
            ->with('success', "Settled {$earnings->count()} earning period(s).");
    }

    public function snapshot(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m-d'],
            'mode' => ['nullable', 'in:snapshot,close'],
        ]);

        $mode = $validated['mode'] ?? GenerateMonthlyPartnerEarningsJob::MODE_SNAPSHOT;
        $month = isset($validated['month'])
            ? CarbonImmutable::parse($validated['month'])->startOfMonth()
            : CarbonImmutable::now()->startOfMonth();

        GenerateMonthlyPartnerEarningsJob::dispatch($month, $mode);

        $label = $mode === GenerateMonthlyPartnerEarningsJob::MODE_CLOSE ? 'Close' : 'Snapshot';

        return redirect()
            ->route('zeus.settlements.index')
            ->with('success', "{$label} job queued for {$month->format('F Y')}.");
    }

    /**
     * @return array<string, mixed>
     */
    private function transformEarning(PartnerEarning $earning): array
    {
        $monthStart = $earning->month->startOfMonth()->startOfDay();
        $monthEnd = $earning->month->endOfMonth()->endOfDay();

        $revenueCount = CommissionableRevenue::query()
            ->where('partner_id', $earning->partner_id)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->whereIn('status', $earning->isSettled() ? ['settled', 'aggregated', 'pending'] : ['pending', 'aggregated'])
            ->count();

        return [
            'id' => $earning->id,
            'partner_id' => $earning->partner_id,
            'partner_name' => $earning->partner?->name ?? 'Unknown',
            'month' => $earning->month->format('Y-m-01'),
            'month_label' => $earning->month->format('F Y'),
            'is_current_month' => $earning->isAccruing(),
            'total_amount' => $earning->total_amount,
            'revenue_amount' => $earning->revenue_amount,
            'revenue_count' => $revenueCount,
            'settled_at' => $earning->settled_at?->toIso8601String(),
            'settled_at_human' => $earning->settled_at?->format('M j, Y g:i A'),
            'payment_reference' => $earning->payment_reference,
            'payment_reference_masked' => $earning->maskedPaymentReference(),
            'payment_note' => $earning->payment_note,
            'settled_by' => $earning->settledBy?->name,
            'status' => $earning->statusKey(),
            'status_label' => $earning->statusLabel(),
            'is_settled' => $earning->isSettled(),
            'is_pending' => $earning->isPendingSettlement() && ! $earning->isAccruing(),
            'is_accruing' => $earning->isAccruing(),
        ];
    }

    private function settleEarning(PartnerEarning $earning, string $paymentReference, ?string $paymentNote): void
    {
        DB::transaction(function () use ($earning, $paymentReference, $paymentNote) {
            $earning->refresh();

            if ($earning->isSettled()) {
                return;
            }

            $monthStart = $earning->month->startOfMonth()->startOfDay();
            $monthEnd = $earning->month->endOfMonth()->endOfDay();

            $earning->update([
                'settled_at' => now(),
                'payment_reference' => $paymentReference,
                'payment_note' => $paymentNote,
                'settled_by_user_id' => auth()->id(),
            ]);

            CommissionableRevenue::query()
                ->where('partner_id', $earning->partner_id)
                ->whereIn('status', ['aggregated', 'pending'])
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->update(['status' => 'settled']);
        });

        $earning->loadMissing('partner.members');
        if ($earning->partner) {
            foreach ($earning->partner->members as $member) {
                $member->notify(new EarningSettledNotification($earning));
            }
        }
    }
}
