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
        // 1. Reset password
        $resident->update(['password' => null]);

        // 2. Set status to pending for the current estate
        $resident->estates()->updateExistingPivot($estate->id, ['status' => 'pending']);

        // 3. Resend invitation email
        event(new ResidentCreated($resident, $estate, true));

        activity()
            ->performedOn($resident)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('reset password for resident ' . $resident->email);
    }
}
