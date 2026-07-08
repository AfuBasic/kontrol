<?php

namespace App\Actions\Zeus;

use App\Mail\Zeus\PartnerMemberInvitationMail;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class InvitePartnerMemberAction
{
    public function execute(Partner $partner, string $email, string $name): User
    {
        return DB::transaction(function () use ($partner, $email, $name) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'user_type' => 'affiliate',
                'partner_id' => $partner->id,
            ]);

            setPermissionsTeamId(0);
            $user->assignRole('affiliate');

            Mail::to($user->email)->send(new PartnerMemberInvitationMail($user, $partner));

            return $user;
        });
    }
}
