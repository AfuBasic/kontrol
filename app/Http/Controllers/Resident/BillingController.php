<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Auth\GenerateMagicLoginUrlAction;
use App\Actions\Billing\InitializeCardSetupAction;
use App\Actions\Billing\PaymentInitializationException;
use App\Actions\Billing\ProcessResidentPaymentAction;
use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\Billing\InvoiceGenerationService;
use App\Services\CouponService;
use App\Services\EstateContextService;
use App\Services\ResidentSubscriptionService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use PdfStudio\Laravel\Facades\Pdf;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BillingController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private InvoiceGenerationService $invoiceGenerationService,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->has('coupon')) {
            return redirect()->route('resident.billing.subscription', ['coupon' => $request->coupon]);
        }

        if ($request->get('section') === 'renewal') {
            return redirect()->route('resident.billing.payment');
        }

        [$user, $estate, $subscription] = $this->resolveSubscription();

        if (! $subscription) {
            return redirect()->route('resident.home')->with('info', 'Billing is managed by your estate.');
        }

        $plan = $subscription->plan_id
            ? Plan::find($subscription->plan_id)
            : Plan::where('is_active', true)->where('visibility', 'public')->orderBy('sort_order')->first();

        $subData = $this->formatSubscriptionData($subscription, $plan);

        $invoicesQuery = Invoice::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['paid', 'failed']);

        $totalInvoices = (clone $invoicesQuery)->count();
        $paidInvoices = (clone $invoicesQuery)->where('status', 'paid')->count();
        $openInvoices = (clone $invoicesQuery)->where('status', '!=', 'paid')->count();
        $latestInvoice = (clone $invoicesQuery)->latest()->first();

        return Inertia::render('Resident/Billing/Index', [
            'subscription' => $subData,
            'receiptSummary' => [
                'total_count' => $totalInvoices,
                'paid_count' => $paidInvoices,
                'open_count' => $openInvoices,
                'latest_invoice' => $latestInvoice ? [
                    'amount' => $latestInvoice->formatted_amount,
                    'status' => $latestInvoice->status,
                    'created_at' => $latestInvoice->created_at?->toDateString(),
                    'invoice_number' => $latestInvoice->invoice_number,
                ] : null,
            ],
        ]);
    }

    public function subscription(): Response|RedirectResponse
    {
        [$user, $estate, $subscription] = $this->resolveSubscription();

        if (! $subscription) {
            return redirect()->route('resident.home')->with('info', 'Billing is managed by your estate.');
        }

        $plans = Plan::where('is_active', true)
            ->where('visibility', 'public')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'price', 'billing_interval'])
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'price' => $plan->price,
                    'billing_interval' => $plan->billing_interval,
                    'formatted_price' => $plan->formatted_price,
                ];
            });

        $currentPlan = $plans->firstWhere('id', $subscription->plan_id) ?: $plans->first();
        $planModel = $currentPlan ? Plan::find($currentPlan['id']) : null;

        $bestCoupon = Coupon::query()
            ->availableTo($user, $estate)
            ->get()
            ->filter(fn ($coupon) => ! $coupon->isLimitReached($user))
            ->sortByDesc(fn ($coupon) => $coupon->type === 'percentage' ? $coupon->value * 1000 : $coupon->value)
            ->first();

        return Inertia::render('Resident/Billing/Subscription', [
            'subscription' => $this->formatSubscriptionData($subscription, $planModel),
            'plans' => $plans,
            'autoAppliedCoupon' => $bestCoupon ? [
                'id' => $bestCoupon->id,
                'code' => $bestCoupon->code,
                'campaign_name' => $bestCoupon->campaign_name,
                'type' => $bestCoupon->type,
                'value' => $bestCoupon->value,
                'formatted_value' => $bestCoupon->type === 'percentage' ? "{$bestCoupon->value}%" : '₦'.number_format($bestCoupon->value / 100, 2),
            ] : null,
        ]);
    }

    public function payment(): Response|RedirectResponse
    {
        [$user, $estate, $subscription] = $this->resolveSubscription();

        if (! $subscription) {
            return redirect()->route('resident.home')->with('info', 'Billing is managed by your estate.');
        }

        $plan = $subscription->plan_id ? Plan::find($subscription->plan_id) : null;

        return Inertia::render('Resident/Billing/Payment', [
            'subscription' => $this->formatSubscriptionData($subscription, $plan),
        ]);
    }

    public function receipts(): Response|RedirectResponse
    {
        [$user, $estate, $subscription] = $this->resolveSubscription();

        if (! $subscription) {
            return redirect()->route('resident.home')->with('info', 'Billing is managed by your estate.');
        }

        $invoices = Invoice::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['paid', 'failed'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Resident/Billing/Receipts', [
            'subscription' => $this->formatSubscriptionData($subscription),
            'recentInvoices' => $invoices,
        ]);
    }

    public function downloadReceipt(Invoice $invoice): HttpResponse
    {
        $user = auth()->user();
        abort_if(! $user || ! $user->contextHasRole(['resident', 'property_owner']), 403, 'Unauthorized.');

        $estate = $this->estateContext->getEstate();

        abort_if(
            $invoice->user_id !== $user->id || $invoice->estate_id !== $estate->id,
            404,
            'Invoice not found.'
        );

        abort_if(
            $invoice->status !== 'paid',
            403,
            'Receipts can only be downloaded for paid invoices.'
        );

        $invoice->loadMissing(['estate', 'plan', 'user', 'paymentTransactions']);

        return Pdf::view('pdf.invoice-pdf')
            ->data(['invoice' => $invoice])
            ->download("receipt-{$invoice->invoice_number}.pdf");
    }

    public function enableAutoRenew(): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        abort_if(! $subscription, 404, 'No subscription found.');
        abort_if(! $subscription->hasSavedCard(), 422, 'Cannot enable automatic renewal without a saved card.');

        $subscription->update([
            'auto_renew_enabled' => true,
            'auto_renew_opted_out' => false,
        ]);

        return back()->with('success', 'Automatic renewal has been enabled.');
    }

    public function disableAutoRenew(): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        abort_if(! $subscription, 404, 'No subscription found.');

        $subscription->update([
            'auto_renew_enabled' => false,
            'auto_renew_opted_out' => true,
        ]);

        return back()->with('success', 'Automatic renewal has been turned off.');
    }

    public function dismissAutoRenewSuggestion(): JsonResponse|RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        if ($subscription) {
            $currentMonthKey = $subscription->current_period_start ? $subscription->current_period_start->format('Y-m') : now()->format('Y-m');
            $dismissCacheKey = "auto_renew_dismissed:{$subscription->id}:{$currentMonthKey}";
            $ttl = $subscription->current_period_end && $subscription->current_period_end->isFuture()
                ? $subscription->current_period_end
                : now()->endOfMonth();

            Cache::put($dismissCacheKey, true, $ttl);
        }

        if (request()->wantsJson()) {
            return response()->json(['status' => 'success']);
        }

        return back();
    }

    public function subscribe(Request $request, ProcessResidentPaymentAction $initialize): RedirectResponse|SymfonyResponse
    {
        $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'coupon_code' => ['nullable', 'string'],
            'auto_renew_consent' => ['nullable', 'boolean'],
        ]);

        $user = auth()->user();
        $estate = $this->estateContext->getEstate();
        $plan = Plan::findOrFail($request->plan_id);

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        abort_if(! $subscription, 403, 'No resident subscription found.');

        try {
            $result = $initialize->execute(
                $subscription,
                $plan,
                route('resident.billing.payment.callback'),
                route('resident.billing.subscription'),
                $request->coupon_code,
                (bool) $request->boolean('auto_renew_consent', false),
            );
        } catch (PaymentInitializationException $e) {
            return back()->with('error', $e->getUserMessage());
        }

        if ($result->isExternal()) {
            return Inertia::location($result->redirectUrl);
        }

        $redirect = redirect($result->redirectUrl);

        if ($result->hasFlash()) {
            $redirect->with($result->flashType, $result->flashMessage);
        }

        return $redirect;
    }

    public function validateCoupon(Request $request, CouponService $couponService): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'plan_id' => ['required', 'exists:plans,id'],
        ]);

        $user = auth()->user();
        $estate = $this->estateContext->getEstate();
        $plan = Plan::findOrFail($request->plan_id);

        $result = $couponService->validate($request->code, $user, $estate, $plan);

        if ($result['status'] !== 'success') {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
            ], 422);
        }

        /** @var Coupon $coupon */
        $coupon = $result['coupon'];
        $discount = $coupon->calculateDiscount($plan->price);

        return response()->json([
            'status' => 'success',
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount' => $discount,
            'formatted_discount' => '₦'.number_format($discount / 100, 2),
            'final_amount' => max(0, $plan->price - $discount),
            'formatted_final_amount' => '₦'.number_format(max(0, $plan->price - $discount) / 100, 2),
        ]);
    }

    public function setupPaymentMethod(InitializeCardSetupAction $action): RedirectResponse|SymfonyResponse
    {
        $user = auth()->user();

        try {
            $redirectUrl = $action->execute(
                $user,
                route('resident.billing.payment.callback')
            );

            return Inertia::location($redirectUrl);
        } catch (Exception $e) {
            return back()->with('error', 'Failed to initialize card setup: '.$e->getMessage());
        }
    }

    public function generateMagicUrl(Request $request, GenerateMagicLoginUrlAction $action): JsonResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();
        $params = [];
        if ($request->has('coupon')) {
            $params['coupon'] = $request->coupon;
        }

        $destination = $request->input('destination', 'index');
        $destinationRoute = match ($destination) {
            'subscription' => route('resident.billing.subscription', $params, false),
            'payment' => route('resident.billing.payment', $params, false),
            'receipts' => route('resident.billing.receipts', $params, false),
            default => route('resident.billing.index', $params, false),
        };

        $assignment = $this->estateContext->getAssignment()
            ?? app(ContextManager::class)->getValidAssignments($user)->firstWhere('estate_id', $estate->id);

        $url = $action->execute($user, $destinationRoute, $assignment);

        return response()->json([
            'status' => 'success',
            'magic_url' => $url,
        ]);
    }

    /**
     * @return array{0: User, 1: Estate, 2: ?ResidentSubscription}
     */
    private function resolveSubscription(): array
    {
        $user = auth()->user();
        abort_if(! $user->contextHasRole(['resident', 'property_owner']), 403, 'Only residents and property owners can manage billing.');

        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        if (! $subscription) {
            $service = app(ResidentSubscriptionService::class);
            $subscription = $service->createForUser($user, $estate);
        }

        return [$user, $estate, $subscription];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSubscriptionData(ResidentSubscription $subscription, ?Plan $plan = null): array
    {
        $currentMonthKey = $subscription->current_period_start ? $subscription->current_period_start->format('Y-m') : now()->format('Y-m');
        $dismissCacheKey = "auto_renew_dismissed:{$subscription->id}:{$currentMonthKey}";
        $isDismissed = (bool) Cache::get($dismissCacheKey, false);

        $hasUrgentBillingIssue = $subscription->status === 'past_due' ||
            ($subscription->status === 'active' && $subscription->current_period_end && $subscription->current_period_end->isPast()) ||
            ($subscription->status === 'trial' && $subscription->trial_ends_at && $subscription->trial_ends_at->isPast());

        $canAutoRenew = $subscription->hasSavedCard() && ! $subscription->auto_renew_enabled;
        $showAutoRenewSuggestion = $canAutoRenew && ! $subscription->auto_renew_opted_out && ! $isDismissed && ! $hasUrgentBillingIssue;

        $isTrialExpired = $subscription->status === 'trial' && $subscription->trial_ends_at && $subscription->trial_ends_at->isPast();
        $isSubscriptionExpired = ($subscription->status === 'active' || $subscription->status === 'past_due') &&
            $subscription->current_period_end && $subscription->current_period_end->isPast();

        $computedStatus = 'active';
        if ($isTrialExpired || $isSubscriptionExpired || $subscription->status === 'expired') {
            $computedStatus = 'expired';
        } elseif ($subscription->status === 'past_due') {
            $computedStatus = 'past_due';
        } elseif ($subscription->status === 'trial') {
            $computedStatus = 'trial';
        }

        $periodEnd = $subscription->current_period_end ?: $subscription->trial_ends_at;
        $daysRemaining = $periodEnd ? (int) ceil(now()->diffInDays($periodEnd, false)) : 999;
        $isExpiringSoon = $daysRemaining <= 5 && $daysRemaining >= 0 && ! in_array($computedStatus, ['expired', 'past_due'], true);

        return [
            'status' => $subscription->status,
            'computed_status' => $computedStatus,
            'is_expiring_soon' => $isExpiringSoon,
            'days_remaining' => $daysRemaining,
            'has_saved_card' => $subscription->hasSavedCard(),
            'auto_renew_enabled' => (bool) $subscription->auto_renew_enabled,
            'can_auto_renew' => $canAutoRenew,
            'show_auto_renew_suggestion' => $showAutoRenewSuggestion,
            'payment_method' => $subscription->hasSavedCard() ? [
                'type' => 'card',
                'brand' => $subscription->card_brand ?: 'Card',
                'last4' => $subscription->card_last4 ?: '••••',
            ] : null,
            'card_brand' => $subscription->card_brand,
            'card_last4' => $subscription->card_last4,
            'current_period_start' => $subscription->current_period_start?->toDateString(),
            'current_period_end' => $subscription->current_period_end?->toDateString(),
            'trial_ends_at' => $subscription->trial_ends_at?->toDateString(),
            'plan_id' => $subscription->plan_id,
            'plan_name' => $plan?->name ?? 'Resident Plan',
            'plan_price' => $plan?->formatted_price ?? null,
            'billing_interval' => $plan?->billing_interval ?? null,
        ];
    }
}
