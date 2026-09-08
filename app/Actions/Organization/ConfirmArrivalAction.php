<?php

namespace App\Actions\Organization;

use App\Models\AccessLog;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ConfirmArrivalAction
{
    /**
     * Confirm a visitor/member arrival for an organization.
     */
    public function execute(AccessLog $log, User $confirmedBy): AccessLog
    {
        if (! $log->organization_id) {
            throw ValidationException::withMessages([
                'log' => ['This access log is not associated with an organization.'],
            ]);
        }

        if ($log->confirmed_at) {
            // Idempotent: already confirmed
            return $log;
        }

        $log->update([
            'confirmed_at' => now(),
            'confirmed_by' => $confirmedBy->id,
        ]);

        activity('arrival_confirmation')
            ->causedBy($confirmedBy)
            ->performedOn($log)
            ->withProperties([
                'organization_id' => $log->organization_id,
                'confirmed_at' => $log->confirmed_at->toISOString(),
            ])
            ->log('Arrival confirmed by organization staff');

        return $log;
    }
}
