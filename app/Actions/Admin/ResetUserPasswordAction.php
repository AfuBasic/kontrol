<?php

namespace App\Actions\Admin;

use App\Events\Admin\UserCreated;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ResetUserPasswordAction
{
    public function execute(User $user, Estate $estate): void
    {
        // 1. Reset password
        $user->update(['password' => null]);

        // 2. Set status to pending for the current estate
        $user->estates()->updateExistingPivot($estate->id, ['status' => 'pending']);

        // 3. Resend invitation email
        event(new UserCreated($user, $estate));

        activity()
            ->performedOn($user)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('reset password for admin ' . $user->email);
    }
}
