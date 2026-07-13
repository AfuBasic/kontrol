<?php

namespace App\Actions\Zeus;

use App\Enums\CommissionStatus;
use App\Enums\PartnerStatus;
use App\Models\CommissionPlan;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\User;
use App\Services\Commission\PartnerAttributionService;
use Illuminate\Support\Facades\DB;

class UpdatePartnerAssignmentAction
{
    public function __construct(
        private PartnerAttributionService $attributionService,
    ) {}

    /**
     * @param  array{partner_id: int|null, reason?: string|null}  $data
     */
    public function execute(Estate $estate, array $data, ?User $causer = null): Estate
    {
        return DB::transaction(function () use ($estate, $data, $causer) {
            $oldPartnerId = $estate->partner_id;
            $newPartnerId = $data['partner_id'] ?? null;

            if ($oldPartnerId === $newPartnerId) {
                return $estate;
            }

            $updateData = [
                'partner_id' => $newPartnerId,
            ];

            if ($newPartnerId) {
                $partner = Partner::findOrFail($newPartnerId);
                $commissionPlan = CommissionPlan::cloneFromPartner($partner);
                $startsAt = now()->startOfDay();

                $updateData = array_merge($updateData, [
                    'commission_plan_id' => $commissionPlan->id,
                    'commission_starts_at' => $startsAt,
                    // Length is enforced per resident post-trial; keep estate window open.
                    'commission_ends_at' => null,
                    'partner_date' => $estate->partner_date ?? now()->toDateString(),
                    'partner_status' => $estate->partner_status ?? PartnerStatus::Approved,
                    'commission_status' => CommissionStatus::Active,
                ]);
            } else {
                $updateData = array_merge($updateData, [
                    'commission_plan_id' => null,
                    'commission_starts_at' => null,
                    'commission_ends_at' => null,
                    'commission_status' => CommissionStatus::Inactive,
                ]);
            }

            $estate->update($updateData);

            $this->attributionService->logPartnerChange(
                $estate,
                $oldPartnerId,
                $newPartnerId,
                $data['reason'] ?? null,
                $causer,
            );

            return $estate->fresh(['partner', 'commissionPlan']);
        });
    }
}
