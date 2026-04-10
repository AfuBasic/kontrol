<?php

namespace App\Actions\Zeus;

use App\Mail\Zeus\ReferrerMemberInvitationMail;
use App\Models\Referrer;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class InviteReferrerMemberAction
{
    public function execute(Referrer $referrer, string $email, string $name): User
    {
        // Create user with referrer type and no password
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'user_type' => 'referrer',
        ]);

        // Assign referrer role
        $user->assignRole('referrer');

        // Send invitation email
        Mail::to($user->email)->send(new ReferrerMemberInvitationMail($user, $referrer));

        return $user;
    }
}
