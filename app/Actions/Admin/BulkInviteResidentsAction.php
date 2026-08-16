<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BulkInviteResidentsAction
{
    /**
     * @param  array<string>  $emails
     * @return array{invited: int, skipped: int, duplicates: int}
     */
    public function execute(array $emails, Estate $estate, ?int $zoneId = null, string $source = 'bulk_upload'): array
    {
        // 1. Normalize and deduplicate emails from the input
        $normalizedEmails = array_map(fn ($email) => strtolower(trim($email)), $emails);
        $uniqueEmails = array_unique($normalizedEmails);
        $duplicateCount = count($emails) - count($uniqueEmails);

        $invitedIds = [];
        $alreadyMembers = 0;

        $createResidentAction = app(CreateResidentAction::class);
        $user = Auth::user();

        $importBatch = $source === 'bulk_upload' ? 'Residents — ' . now()->format('F Y') : null;

        // 2. Iterate and create invitations
        foreach ($uniqueEmails as $email) {
            // Check if user is already an accepted member of this estate
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                $isAlreadyAccepted = DB::table('estate_users_membership')
                    ->where('user_id', $existingUser->id)
                    ->where('estate_id', $estate->id)
                    ->whereIn('status', ['accepted', 'active'])
                    ->exists();

                if ($isAlreadyAccepted) {
                    $alreadyMembers++;

                    continue;
                }
            }

            // Create resident (user, pending membership, role assignment, profile, invitation token)
            $createResidentAction->execute([
                'name' => strstr($email, '@', true) ?: $email,
                'email' => $email,
                'zone_id' => $zoneId,
            ], $estate, $source, $importBatch);

            $invitation = Invitation::withoutGlobalScopes()
                ->where('email', $email)
                ->where('estate_id', $estate->id)
                ->first();

            if ($invitation) {
                $invitedIds[] = $invitation->id;
            }
        }

        // 3. Log activity for bulk invite
        if (count($invitedIds) > 0) {
            activity()
                ->causedBy($user)
                ->withProperties([
                    'estate_id' => $estate->id,
                    'bulk_invite' => true,
                    'count' => count($invitedIds),
                ])
                ->log('bulk invited '.count($invitedIds).' residents');

            // The invitation emails are automatically queued by the ResidentCreated event
            // fired within CreateResidentAction, so we don't need a bulk dispatch here.
        }

        return [
            'invited' => count($invitedIds),
            'skipped' => $alreadyMembers,
            'duplicates' => $duplicateCount,
        ];
    }
}
