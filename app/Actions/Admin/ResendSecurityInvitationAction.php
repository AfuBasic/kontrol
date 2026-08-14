<?php

namespace App\Actions\Admin;

use App\Events\Admin\SecurityCreated;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ResendSecurityInvitationAction
{
    public function execute(User $security, Estate $estate): void
    {
        // 1. Password reset is obsolete, so we no longer do it.

        // 2. Set status to pending for the current estate
        $security->estates()->updateExistingPivot($estate->id, ['status' => 'pending']);

        // 3. Resend invitation email
        event(new SecurityCreated($security, $estate, true));

        activity()
            ->performedOn($security)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('resent invitation for security personnel '.$security->email);
    }
}
