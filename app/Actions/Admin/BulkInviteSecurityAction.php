<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BulkInviteSecurityAction
{
    /**
     * @param  array<string>  $emails
     * @return array{invited: int, skipped: int, duplicates: int}
     */
    public function execute(array $emails, Estate $estate, ?int $zoneId = null): array
    {
        // 1. Normalize and deduplicate emails
        $normalizedEmails = array_map(fn ($email) => strtolower(trim($email)), $emails);
        $uniqueEmails = array_unique($normalizedEmails);
        $duplicateCount = count($emails) - count($uniqueEmails);

        $invitedIds = [];
        $alreadyMembers = 0;

        $createSecurityAction = app(CreateSecurityAction::class);
        $user = Auth::user();

        // 2. Iterate and create security records + invitations
        foreach ($uniqueEmails as $email) {
            // Check if user is already an accepted member with security role in this estate
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                $isAlreadyAccepted = DB::table('estate_users_membership')
                    ->where('user_id', $existingUser->id)
                    ->where('estate_id', $estate->id)
                    ->whereIn('status', ['accepted', 'active'])
                    ->where('relationship_type', 'security')
                    ->exists();

                if ($isAlreadyAccepted) {
                    $alreadyMembers++;

                    continue;
                }
            }

            // Create security personnel (user, pending membership, role assignment, profile, invitation token)
            $createSecurityAction->execute([
                'name' => strstr($email, '@', true) ?: $email,
                'email' => $email,
                'zone_id' => $zoneId,
            ], $estate);

            $invitation = Invitation::withoutGlobalScopes()
                ->where('email', $email)
                ->where('estate_id', $estate->id)
                ->first();

            if ($invitation) {
                $invitedIds[] = $invitation->id;
            }
        }

        // 3. Log activity
        if (count($invitedIds) > 0) {
            activity('security')
                ->causedBy($user)
                ->withProperties([
                    'estate_id' => $estate->id,
                    'bulk_invite' => true,
                    'count' => count($invitedIds),
                ])
                ->log('bulk invited '.count($invitedIds).' security personnel');
        }

        return [
            'invited' => count($invitedIds),
            'skipped' => $alreadyMembers,
            'duplicates' => $duplicateCount,
        ];
    }
}
