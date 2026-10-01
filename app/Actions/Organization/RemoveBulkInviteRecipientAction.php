<?php

namespace App\Actions\Organization;

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\OrganizationBulkInviteRecipient;
use Illuminate\Support\Facades\DB;

class RemoveBulkInviteRecipientAction
{
    /**
     * Remove a recipient from their group: revoke every pass that can still be used
     * and mark the recipient revoked so future renewal cycles skip them.
     *
     * The recipient row is kept (not deleted) so delivery and renewal history stay auditable.
     */
    public function execute(OrganizationBulkInviteRecipient $recipient): void
    {
        DB::transaction(function () use ($recipient) {
            $recipient = OrganizationBulkInviteRecipient::query()
                ->whereKey($recipient->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($recipient->status === 'revoked') {
                return;
            }

            AccessCode::query()
                ->where('bulk_invite_recipient_id', $recipient->id)
                ->whereIn('status', [AccessCodeStatus::Active, AccessCodeStatus::Scheduled])
                ->get()
                ->each(fn (AccessCode $code) => $code->revoke());

            $recipient->update(['status' => 'revoked']);
        });
    }
}
