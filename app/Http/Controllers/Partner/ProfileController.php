<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\EstateApplication;
use App\Services\PaystackService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private PaystackService $paystackService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $partner = $user->partner;
        $rawTab = $request->string('tab')->toString() ?: 'overview';
        // Back-compat for older links
        $tab = $rawTab === 'account' ? 'overview' : $rawTab;

        $activity = [];
        $finance = [
            'total_earned' => 0,
            'pending_commissions' => 0,
            'next_settlement_date' => CarbonImmutable::now()->addMonthNoOverflow()->startOfMonth()->format('F j, Y'),
        ];

        if ($partner) {
            $activity = $partner->estateApplications()
                ->latest()
                ->limit(15)
                ->get()
                ->map(fn (EstateApplication $application) => [
                    'id' => $application->id,
                    'title' => $application->estate_name,
                    'status' => $application->partnerStatusKey(),
                    'status_label' => $application->partnerStatusLabel(),
                    'at' => $application->updated_at?->toIso8601String(),
                    'at_human' => $application->updated_at?->diffForHumans(),
                ])
                ->values()
                ->all();

            $finance = [
                'total_earned' => (int) $partner->earnings()->sum('total_amount'),
                'pending_commissions' => (int) $partner->commissionableRevenues()
                    ->where('status', 'pending')
                    ->sum('commission_amount'),
                'next_settlement_date' => CarbonImmutable::now()
                    ->addMonthNoOverflow()
                    ->startOfMonth()
                    ->format('F j, Y'),
            ];
        }

        $banks = $tab === 'banking'
            ? collect($this->paystackService->getBanks())
                ->map(fn (array $bank) => [
                    'name' => $bank['name'] ?? '',
                    'code' => $bank['code'] ?? '',
                ])
                ->filter(fn (array $bank) => $bank['name'] !== '' && $bank['code'] !== '')
                ->values()
                ->all()
            : [];

        return Inertia::render('Partner/Profile', [
            'tab' => $tab,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at?->toDateString(),
                'created_at_label' => $user->created_at?->format('F Y'),
            ],
            'partner' => $partner ? [
                'id' => $partner->id,
                'partner_code' => 'PRT-'.str_pad((string) $partner->id, 6, '0', STR_PAD_LEFT),
                'name' => $partner->name,
                'status' => $partner->status,
                'description' => $partner->description,
                'website' => $partner->website,
                'contact_person' => $partner->contact_person,
                'commission_type' => $partner->commission_type,
                'commission_rate' => $partner->commission_rate !== null
                    ? (string) $partner->commission_rate
                    : null,
                'commission_length' => $partner->commission_length,
                'created_at' => $partner->created_at?->toDateString(),
                'created_at_label' => $partner->created_at?->format('F Y'),
                'banking' => [
                    'bank_name' => $partner->bank_name,
                    'bank_code' => $partner->bank_code,
                    'account_number' => $partner->account_number,
                    'account_number_masked' => $partner->maskedAccountNumber(),
                    'account_name' => $partner->account_name,
                    'account_verified_at' => $partner->account_verified_at?->toIso8601String(),
                    'is_verified' => $partner->hasVerifiedBankAccount(),
                ],
            ] : null,
            'finance' => $finance,
            'banks' => $banks,
            'activity' => $activity,
            'preferences' => [
                'email_product' => true,
                'email_settlements' => true,
                'email_pipeline' => true,
                'email_security' => true,
                'browser_push' => false,
            ],
        ]);
    }
}
