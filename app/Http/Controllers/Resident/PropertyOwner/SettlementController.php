<?php

namespace App\Http\Controllers\Resident\PropertyOwner;

use App\Http\Controllers\Controller;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class SettlementController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext,
        protected PaystackService $paystackService
    ) {}

    /**
     * Display the settlement configuration page.
     */
    public function index(): Response
    {
        $user = auth()->user();
        $profile = $user->profile;

        $banks = $this->paystackService->getBanks();

        return Inertia::render('Resident/PropertyOwner/Settlement', [
            'settlement' => [
                'bank_name' => $profile?->bank_name,
                'bank_code' => $profile?->bank_code,
                'account_number' => $profile?->account_number,
                'account_name' => $profile?->account_name,
                'paystack_subaccount_code' => $profile?->paystack_subaccount_code,
            ],
            'banks' => $banks,
        ]);
    }

    /**
     * Resolve account name and create/update Paystack subaccount.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'bank_code' => ['required', 'string'],
            'bank_name' => ['required', 'string'],
            'account_number' => ['required', 'string', 'digits:10'],
        ]);

        $user = auth()->user();
        $profile = $user->profile;

        if (! $profile) {
            return back()->withErrors(['message' => 'User profile not found.']);
        }

        try {
            // 1. Resolve Account Name with Paystack
            $resolution = $this->paystackService->resolveAccountNumber(
                $request->input('account_number'),
                $request->input('bank_code')
            );

            $accountName = $resolution['account_name'] ?? null;

            if (! $accountName) {
                return back()->withErrors(['account_number' => 'Could not verify account name. Please check details.']);
            }

            $subaccountData = [
                'business_name' => $accountName.' (Kontrol)',
                'settlement_bank' => $request->input('bank_code'),
                'account_number' => $request->input('account_number'),
                'percentage_charge' => 0.5,
            ];

            // 2. Create or Update Paystack Subaccount
            if ($profile->paystack_subaccount_code) {
                try {
                    $this->paystackService->updateSubaccount(
                        $profile->paystack_subaccount_code,
                        $subaccountData
                    );
                    $subaccountCode = $profile->paystack_subaccount_code;
                } catch (\Exception $e) {
                    Log::warning('Paystack subaccount update failed, creating new one', ['error' => $e->getMessage()]);
                    $subaccount = $this->paystackService->createSubaccount($subaccountData);
                    $subaccountCode = $subaccount['subaccount_code'];
                }
            } else {
                $subaccount = $this->paystackService->createSubaccount($subaccountData);
                $subaccountCode = $subaccount['subaccount_code'];
            }

            // 3. Save to profile
            $profile->update([
                'bank_name' => $request->input('bank_name'),
                'bank_code' => $request->input('bank_code'),
                'account_number' => $request->input('account_number'),
                'account_name' => $accountName,
                'paystack_subaccount_code' => $subaccountCode,
            ]);

            return back()->with('success', 'Settlement account successfully configured.');

        } catch (\Exception $e) {
            Log::error('Settlement update failed', ['error' => $e->getMessage()]);

            return back()->withErrors(['message' => 'Error: '.$e->getMessage()]);
        }
    }

    /**
     * Resolve account number via Paystack for Property Owner.
     */
    public function resolve(Request $request): JsonResponse
    {
        $request->validate([
            'account_number' => ['required', 'string', 'digits:10'],
            'bank_code' => ['required', 'string'],
        ]);

        try {
            $resolution = $this->paystackService->resolveAccountNumber(
                $request->input('account_number'),
                $request->input('bank_code')
            );

            return response()->json([
                'success' => true,
                'account_name' => $resolution['account_name'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
