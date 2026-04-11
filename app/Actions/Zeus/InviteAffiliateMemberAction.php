<?php

namespace App\Actions\Zeus;

use App\Mail\Zeus\AffiliateMemberInvitationMail;
use App\Models\Affiliate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class InviteAffiliateMemberAction
{
    public function execute(Affiliate $affiliate, string $email, string $name): User
    {
        return DB::transaction(function () use ($affiliate, $email, $name) {
            // Create user with affiliate type and no password
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'user_type' => 'affiliate',
            ]);

            // Assign affiliate role
            $user->assignRole('affiliate');

            // Send invitation email
            Mail::to($user->email)->send(new AffiliateMemberInvitationMail($user, $affiliate));

            return $user;
        });
    }
}
