<?php

namespace App\Actions\Admin;

use App\Actions\Invitation\CreateInvitationAction;
use App\Jobs\Admin\SendBulkResidentInvitationsJob;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class BulkInviteResidentsAction
{
    /**
     * @param  array<string>  $emails
     * @return array{invited: int, skipped: int, duplicates: int}
     */
    public function execute(array $emails, Estate $estate): array
    {
        // 1. Normalize and deduplicate emails from the input
        $normalizedEmails = array_map(fn ($email) => strtolower(trim($email)), $emails);
        $uniqueEmails = array_unique($normalizedEmails);
        $duplicateCount = count($emails) - count($uniqueEmails);

        $invitedIds = [];
        $alreadyMembers = 0;

        $createAction = app(CreateInvitationAction::class);
        $user = Auth::user();

        // 2. Iterate and create invitations
        foreach ($uniqueEmails as $email) {
            $invitation = $createAction->execute(
                email: $email,
                estate: $estate,
                relationshipType: 'resident',
                role: null,
                zoneId: null,
                scopeType: 'estate',
                createdBy: $user
            );

            if ($invitation === null) {
                // The user is already an active member of this estate
                $alreadyMembers++;
            } else {
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

            // Dispatch single job for all invitations
            SendBulkResidentInvitationsJob::dispatch($invitedIds, $estate->id);
        }

        return [
            'invited' => count($invitedIds),
            'skipped' => $alreadyMembers,
            'duplicates' => $duplicateCount,
        ];
    }
}
