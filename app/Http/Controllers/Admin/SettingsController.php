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
                // 1. Visitor Access
                'access_codes_enabled' => (bool) $settings->access_codes_enabled,
                'access_code_min_lifespan_minutes' => (int) ($settings->access_code_min_lifespan_minutes ?: 30),
                'access_code_max_lifespan_minutes' => (int) ($settings->access_code_max_lifespan_minutes ?: 1440),
                'access_code_single_use' => (bool) $settings->access_code_single_use,
                'require_vehicle_information' => (bool) $settings->require_vehicle_information,
                'allow_residents_to_extend_visitor_passes' => (bool) $settings->allow_residents_to_extend_visitor_passes,
                'visitor_checkout_enabled' => (bool) $settings->visitor_checkout_enabled,

                // 2. Security Operations
                'incident_categories' => $settings->incident_categories ?: [
                    'Theft',
                    'Noise Complaint',
                    'Vandalism',
                    'Unauthorized Entry',
                    'Property Damage',
                    'Medical Emergency',
                ],
                'default_incident_severity' => $settings->default_incident_severity ?: 'Low',
                'require_photo_evidence_for_incidents' => (bool) $settings->require_photo_evidence_for_incidents,
                'require_resolution_notes_for_incidents' => (bool) $settings->require_resolution_notes_for_incidents,
                'allow_residents_to_report_incidents' => (bool) $settings->allow_residents_to_report_incidents,
                'notify_admins_immediately_for_critical_incidents' => (bool) $settings->notify_admins_immediately_for_critical_incidents,

                // 3. Collections & Billing
                'allow_partial_payments' => (bool) $settings->allow_partial_payments,
                'minimum_partial_payment_amount' => $settings->minimum_partial_payment_amount ? round($settings->minimum_partial_payment_amount / 100, 2) : 0,
                'minimum_partial_payment_percentage' => (int) ($settings->minimum_partial_payment_percentage ?: 0),
                'collection_reminder_frequency' => $settings->collection_reminder_frequency ?: 'weekly',
                'collection_maximum_reminder_attempts' => (int) ($settings->collection_maximum_reminder_attempts ?: 3),
                'send_reminder_before_due_date_days' => (int) ($settings->send_reminder_before_due_date_days ?: 1),
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
