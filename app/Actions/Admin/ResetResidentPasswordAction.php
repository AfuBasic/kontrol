<?php

namespace App\Actions\Admin;

use App\Events\Admin\ResidentCreated;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ResetResidentPasswordAction
{
    public function execute(User $resident, Estate $estate): void
    {
        // 1. Reset password and verification status
        $resident->update([
            'password' => null,
            'email_verified_at' => null,
        ]);

        // 2. We DO NOT change the pivot status to pending here.
        // This keeps the resident as "accepted" in the estate, so they don't
        // reappear in the "Pending Applications" list, while their null
        // email_verified_at will naturally show them as "Inactive" in the UI.

        // 3. Resend invitation email
        event(new ResidentCreated($resident, $estate, true));

        activity()
            ->performedOn($resident)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('reset password for resident '.$resident->email);
    }
}
