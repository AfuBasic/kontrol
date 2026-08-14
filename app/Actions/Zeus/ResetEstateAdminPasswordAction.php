<?php

namespace App\Actions\Zeus;

use App\Mail\Zeus\EstateInvitationMail;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

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

            // Refresh or create pending invitation
            Invitation::withoutGlobalScope(ZoneScope::class)->updateOrCreate(
                ['estate_id' => $estate->id, 'email' => strtolower($user->email)],
                [
                    'relationship_type' => null,
                    'token' => Str::random(64),
                    'status' => 'pending',
                    'expires_at' => now()->addDays(7),
                    'accepted_at' => null,
                    'cancelled_at' => null,
                ]
            );
        });

        // Send new invitation email (queued)
        Mail::to($user->email)->queue(
            new EstateInvitationMail($estate, $user)
        );
    }
}
