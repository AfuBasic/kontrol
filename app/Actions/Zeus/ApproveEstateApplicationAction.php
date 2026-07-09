<?php

namespace App\Actions\Zeus;

use App\Models\Estate;
use App\Models\EstateApplication;
use App\Notifications\Partner\EstateRequestAcceptedNotification;
use Illuminate\Support\Facades\DB;

class ApproveEstateApplicationAction
{
    public function __construct(
        private CreateEstateAction $createEstateAction,
    ) {}

    /**
     * Approve an estate application and create the estate.
     *
     * Residents choose their own plans after the estate is live — intake
     * no longer selects a plan. Partner-sourced apps attach commission attribution.
     * Partner members are notified by email + database + broadcast when applicable.
     */
    public function execute(EstateApplication $application): Estate
    {
        $estate = DB::transaction(function () use ($application) {
            $payload = [
                'name' => $application->estate_name,
                'email' => $application->email,
                'address' => $application->address,
            ];

            if ($application->isPartnerSourced() && $application->partner_id) {
                $payload['has_partner'] = true;
                $payload['partner_id'] = $application->partner_id;
                $payload['partner_source'] = 'partner_request';
                $payload['partner_notes'] = $application->notes;
            }

            $estate = $this->createEstateAction->execute($payload);

            $application->update([
                'status' => 'approved',
                'estate_id' => $estate->id,
                'reviewed_at' => now(),
            ]);

            return $estate;
        });

        $this->notifyPartnerMembers($application->fresh(['partner.members']), $estate);

        return $estate;
    }

    private function notifyPartnerMembers(EstateApplication $application, Estate $estate): void
    {
        if (! $application->isPartnerSourced() || ! $application->partner) {
            return;
        }

        foreach ($application->partner->members as $member) {
            $member->notify(new EstateRequestAcceptedNotification($application, $estate));
        }
    }
}
