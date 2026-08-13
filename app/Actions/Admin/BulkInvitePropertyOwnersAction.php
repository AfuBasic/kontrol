<?php

namespace App\Actions\Admin;

use App\Actions\Invitation\CreateInvitationAction;
use App\Jobs\Admin\SendBulkPropertyOwnerInvitationsJob;
use App\Models\Estate;
use Illuminate\Support\Facades\Auth;

class BulkInvitePropertyOwnersAction
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

        $createAction = app(CreateInvitationAction::class);
        $user = Auth::user();

        // 2. Iterate and create invitations via CreateInvitationAction (V3 architecture compliant)
        foreach ($uniqueEmails as $email) {
            $invitation = $createAction->execute(
                email: $email,
                estate: $estate,
                relationshipType: 'property_owner',
                role: null,
                zoneId: $zoneId,
                scopeType: $zoneId ? 'zone' : 'estate',
                createdBy: $user
            );

            if ($invitation === null) {
                // Already an active/accepted member of this estate
                $alreadyMembers++;
            } else {
                $invitedIds[] = $invitation->id;
            }
        }

        // 3. Log activity and dispatch notification job
        if (count($invitedIds) > 0) {
            activity()
                ->causedBy($user)
                ->withProperties([
                    'estate_id' => $estate->id,
                    'bulk_invite' => true,
                    'count' => count($invitedIds),
                ])
                ->log('bulk invited '.count($invitedIds).' property owners');

            SendBulkPropertyOwnerInvitationsJob::dispatch($invitedIds, $estate->id);
        }

        return [
            'invited' => count($invitedIds),
            'skipped' => $alreadyMembers,
            'duplicates' => $duplicateCount,
        ];
    }
}
