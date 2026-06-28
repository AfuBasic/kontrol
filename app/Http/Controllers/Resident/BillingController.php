<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Auth\GenerateMagicLoginUrlAction;
use App\Actions\Billing\InitializeCardSetupAction;
use App\Actions\Billing\PaymentInitializationException;
use App\Actions\Billing\ProcessResidentPaymentAction;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Services\Billing\InvoiceGenerationService;
use App\Services\CouponService;
use App\Services\EstateContextService;
use App\Services\ResidentSubscriptionService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BillingController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private InvoiceGenerationService $invoiceGenerationService,
    ) {}

    public function index(): Response|RedirectResponse
    {
        $user = auth()->user();
        abort_if($user->isHouseholdMember(), 403, 'Household members do not have access to billing.');

        $estate = $this->estateContext->getEstate();

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        if (! $subscription) {
            $service = app(ResidentSubscriptionService::class);
            $subscription = $service->createForUser($user, $estate);
        }

        if (! $subscription) {
            return redirect()->route('resident.home')->with('info', 'Billing is managed by your estate.');
        }

        $invoices = Invoice::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['paid', 'failed']) // Only show finalized transactions
            ->latest()
            ->paginate(5);

        $plans = Plan::where('is_active', true)
            ->where('visibility', 'public') // Assuming residents see public plans
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

        return Inertia::render('Resident/Billing/Index', [
            'subscription' => [
                'status' => $subscription->status,
                'has_saved_card' => $subscription->hasSavedCard(),
                'card_brand' => $subscription->card_brand,
                'card_last4' => $subscription->card_last4,
                'current_period_end' => $subscription->current_period_end?->toDateString(),
                'trial_ends_at' => $subscription->trial_ends_at?->toDateString(),
                'plan_id' => $subscription->plan_id,
            ],
            'plans' => $plans,
            'recentInvoices' => $invoices,
        ]);
    }

    public function subscribe(Request $request, ProcessResidentPaymentAction $initialize): RedirectResponse|SymfonyResponse
    {
        $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'coupon_code' => ['nullable', 'string'],
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
                route('resident.billing.index'),
                $request->coupon_code,
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

        $result = $couponService->validate($request->code, $user, $estate);

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

    public function generateMagicUrl(GenerateMagicLoginUrlAction $action): JsonResponse
    {
        $user = auth()->user();
        $url = $action->execute($user, route('resident.billing.index', [], false));

        return response()->json([
            'status' => 'success',
            'magic_url' => $url,
        ]);
    }
}
