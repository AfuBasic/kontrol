<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EstateSettings;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SettlementController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private PaystackService $paystackService
    ) {}

    /**
     * Resolve account number via Paystack.
     */
    public function resolve(Request $request): JsonResponse
    {
        $request->validate([
            'account_number' => 'required|string|size:10',
            'bank_code' => 'required|string',
        ]);

        try {
            $data = $this->paystackService->resolveAccountNumber(
                $request->account_number,
                $request->bank_code
            );

            return response()->json([
                'success' => true,
                'account_name' => $data['account_name'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not resolve account: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update settlement banking details.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string'],
            'bank_code' => ['required', 'string'],
            'account_number' => ['required', 'string', 'size:10'],
            'account_name' => ['required', 'string'],
        ]);

        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        try {
            // Synchronize with Paystack (Create or Update Subaccount)
            if ($settings->paystack_subaccount_code) {
                $this->paystackService->updateSubaccount($settings->paystack_subaccount_code, [
                    'settlement_bank' => $validated['bank_code'],
                    'account_number' => $validated['account_number'],
                ]);
            } else {
                $subaccount = $this->paystackService->createSubaccount([
                    'business_name' => $estate->name,
                    'settlement_bank' => $validated['bank_code'],
                    'account_number' => $validated['account_number'],
                    'percentage_charge' => 0.5, // 0.5% platform fee
                ]);
                $settings->paystack_subaccount_code = $subaccount['subaccount_code'];
            }

            // Save details to database
            $settings->fill($validated)->save();

            return back()->with('success', 'Settlement account updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['banking' => 'Paystack Error: '.$e->getMessage()]);
        }
    }
}
