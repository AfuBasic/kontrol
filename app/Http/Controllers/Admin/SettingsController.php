<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\UpdateEstateSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEstateSettingsRequest;
use App\Services\Admin\UserService;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        protected UserService $userService,
        protected EstateContextService $estateContext,
        protected PaystackService $paystackService
    ) {}

    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();
        $settings = $estate->settings;

        // Create settings with defaults if they don't exist
        if (! $settings) {
            $settings = $estate->settings()->create([]);
        }

        return Inertia::render('Admin/Settings/Index', [
            'settings' => [
                'access_codes_enabled' => $settings->access_codes_enabled,
                'access_code_min_lifespan_minutes' => $settings->access_code_min_lifespan_minutes,
                'access_code_max_lifespan_minutes' => $settings->access_code_max_lifespan_minutes,
                'access_code_single_use' => $settings->access_code_single_use,
                'access_code_grace_period_minutes' => $settings->access_code_grace_period_minutes,
                'access_code_daily_limit_per_resident' => $settings->access_code_daily_limit_per_resident,
                'access_code_require_confirmation' => $settings->access_code_require_confirmation,
                'free_trial_enabled' => $settings->free_trial_enabled,
                'free_trial_days' => $settings->free_trial_days,
                'grace_period_days' => $settings->grace_period_days,
                'contacts' => $settings->contacts ?? [],
                'bank_name' => $settings->bank_name,
                'bank_code' => $settings->bank_code,
                'account_number' => $settings->account_number,
                'account_name' => $settings->account_name,
                'paystack_subaccount_code' => $settings->paystack_subaccount_code,
            ],
        ]);
    }

    public function banks(): JsonResponse
    {
        return response()->json($this->paystackService->getBanks());
    }

    public function update(UpdateEstateSettingsRequest $request, UpdateEstateSettingsAction $action): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $settings = $estate->settings;

        if (! $settings) {
            $settings = $estate->settings()->create([]);
        }

        $action->execute($settings, $request->validated());

        return back()->with('success', 'Settings updated successfully.');
    }

    public function updateBanking(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'bank_name' => 'required|string',
            'bank_code' => 'required|string',
            'account_number' => 'required|string|size:10',
            'account_name' => 'required|string',
        ]);

        $estate = $this->estateContext->getEstate();
        $settings = $estate->settings;

        try {
            if ($settings->paystack_subaccount_code) {
                // Update existing subaccount
                $this->paystackService->updateSubaccount($settings->paystack_subaccount_code, [
                    'settlement_bank' => $data['bank_code'],
                    'account_number' => $data['account_number'],
                ]);
            } else {
                // Create new subaccount
                $subaccount = $this->paystackService->createSubaccount([
                    'business_name' => $estate->name,
                    'settlement_bank' => $data['bank_code'],
                    'account_number' => $data['account_number'],
                    'percentage_charge' => 0.5, // 0.5% Kontrol platform fee
                ]);
                $data['paystack_subaccount_code'] = $subaccount['subaccount_code'];
            }

            $settings->update($data);

            return back()->with('success', 'Banking details updated and synchronized with Paystack.');
        } catch (\Exception $e) {
            return back()->withErrors(['banking' => 'Failed to sync with Paystack: '.$e->getMessage()]);
        }
    }
}
