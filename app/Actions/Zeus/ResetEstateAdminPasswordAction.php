<?php

namespace App\Actions\Zeus;

use App\Mail\Zeus\EstateInvitationMail;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ResetEstateAdminPasswordAction
{
    public function execute(Estate $estate): void
    {
        // Get the admin user for this estate
        $user = $estate->users()->first();

        if (! $user) {
            throw new \RuntimeException('No admin user found for this estate.');
        }

        DB::transaction(function () use ($estate, $user) {
            // Reset password to null (forces re-setup)
            $user->update(['password' => null]);

            // Reset pivot status to pending
            DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->where('user_id', $user->id)
                ->update(['status' => 'pending']);
        });

        // Send new invitation email (queued)
        Mail::to($user->email)->queue(
            new EstateInvitationMail($estate, $user)
        );
    }
}
