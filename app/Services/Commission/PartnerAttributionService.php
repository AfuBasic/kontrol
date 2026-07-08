<?php

namespace App\Services\Commission;

use App\Enums\CommissionStatus;
use App\Enums\PartnerStatus;
use App\Models\CommissionPlan;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class PartnerAttributionService
{
    public function applyPartnerAttribution(
        Estate $estate,
        Partner $partner,
        ?string $partnerSource = null,
        ?string $notes = null,
        ?PartnerStatus $status = null,
    ): Estate {
        $commissionPlan = CommissionPlan::cloneFromPartner($partner);
        $startsAt = now()->startOfDay();
        $endsAt = $startsAt->copy()->addMonths($commissionPlan->duration_months);

        $estate->update([
            'partner_id' => $partner->id,
            'partner_source' => $partnerSource ?? 'partner_portal',
            'commission_plan_id' => $commissionPlan->id,
            'commission_starts_at' => $startsAt,
            'commission_ends_at' => $endsAt,
            'partner_date' => now()->toDateString(),
            'activation_date' => $estate->isActive() ? now()->toDateString() : null,
            'partner_status' => $status ?? PartnerStatus::Approved,
            'commission_status' => CommissionStatus::Active,
            'partner_notes' => $notes,
        ]);

        return $estate->fresh(['partner', 'commissionPlan']);
    }

    public function logPartnerChange(
        Estate $estate,
        ?int $oldPartnerId,
        ?int $newPartnerId,
        ?string $reason = null,
        ?User $causer = null,
    ): void {
        $adminId = $causer?->id ?? Auth::id();
        $message = "Partner changed from {$oldPartnerId} to {$newPartnerId} by {$adminId}.";

        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        activity()
            ->performedOn($estate)
            ->causedBy($causer ?? Auth::user())
            ->withProperties([
                'estate_id' => $estate->id,
                'old_partner_id' => $oldPartnerId,
                'new_partner_id' => $newPartnerId,
                'reason' => $reason,
            ])
            ->log($message);
    }

    public function logPartnerStatusChange(
        Estate $estate,
        PartnerStatus $oldStatus,
        PartnerStatus $newStatus,
        ?User $causer = null,
    ): void {
        $adminId = $causer?->id ?? Auth::id();

        activity()
            ->performedOn($estate)
            ->causedBy($causer ?? Auth::user())
            ->withProperties([
                'estate_id' => $estate->id,
                'old_status' => $oldStatus->value,
                'new_status' => $newStatus->value,
            ])
            ->log("Partner status changed from {$oldStatus->value} to {$newStatus->value} by {$adminId}.");
    }
}
