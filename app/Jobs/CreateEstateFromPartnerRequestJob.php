<?php

namespace App\Jobs;

use App\Actions\Zeus\CreateEstateAction;
use App\Enums\CommissionStatus;
use App\Enums\PartnerRequestStatus;
use App\Enums\PartnerStatus;
use App\Models\CommissionPlan;
use App\Models\PartnerRequest;
use App\Models\Plan;
use App\Services\Commission\PartnerAttributionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class CreateEstateFromPartnerRequestJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PartnerRequest $partnerRequest,
    ) {}

    public function handle(CreateEstateAction $createEstateAction, PartnerAttributionService $attributionService): void
    {
        DB::transaction(function () use ($createEstateAction, $attributionService) {
            $partnerRequest = $this->partnerRequest->fresh(['partner']);
            $partner = $partnerRequest->partner;
            $defaultPlan = Plan::query()->first();

            $estate = $createEstateAction->execute([
                'name' => $partnerRequest->estate_name,
                'admin_name' => $partnerRequest->chairman_name,
                'email' => $partnerRequest->chairman_email,
                'address' => $partnerRequest->estate_address,
                'plan_id' => $defaultPlan?->id,
            ]);

            $commissionPlan = CommissionPlan::cloneFromPartner($partner);
            $startsAt = now()->startOfDay();

            $estate->update([
                'partner_id' => $partner->id,
                'partner_source' => 'partner_request',
                'commission_plan_id' => $commissionPlan->id,
                'commission_starts_at' => $startsAt,
                // Per-resident post-trial tenure; no estate-level end clock.
                'commission_ends_at' => null,
                'partner_date' => $partnerRequest->created_at?->toDateString() ?? now()->toDateString(),
                'activation_date' => now()->toDateString(),
                'partner_status' => PartnerStatus::Activated,
                'commission_status' => CommissionStatus::Active,
                'partner_notes' => $partnerRequest->notes,
            ]);

            $partnerRequest->update([
                'estate_id' => $estate->id,
                'status' => PartnerRequestStatus::EstateCreated,
            ]);

            $attributionService->logPartnerStatusChange(
                $estate,
                PartnerStatus::Approved,
                PartnerStatus::Activated,
            );
        });
    }
}
