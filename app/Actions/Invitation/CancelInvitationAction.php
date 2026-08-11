<?php

namespace App\Actions\Invitation;

use App\Models\Invitation;
use Carbon\Carbon;

class CancelInvitationAction
{
    /**
     * Cancel a pending invitation.
     */
    public function execute(Invitation $invitation): void
    {
        if (! $invitation->isPending()) {
            throw new \Exception('Only pending invitations can be cancelled.');
        }

        $invitation->update([
            'status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
        ]);
    }
}
