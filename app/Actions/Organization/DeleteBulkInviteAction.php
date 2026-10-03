<?php

namespace App\Actions\Organization;

use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use Illuminate\Support\Facades\DB;

class DeleteBulkInviteAction
{
    public function __construct(private RemoveBulkInviteRecipientAction $removeRecipient) {}

    /**
     * Delete a group: every pass that can still be used stops working now, renewals stop, and the group
     * disappears from the organization. The rows stay (soft deleted) so history remains auditable.
     *
     * @return int how many people lost access
     */
    public function execute(OrganizationBulkInvite $bulkInvite): int
    {
        return DB::transaction(function () use ($bulkInvite) {
            $locked = OrganizationBulkInvite::query()->whereKey($bulkInvite->id)->lockForUpdate()->firstOrFail();

            $revoked = 0;

            $locked->recipients()
                ->where('status', '!=', 'revoked')
                ->get()
                ->each(function (OrganizationBulkInviteRecipient $recipient) use (&$revoked) {
                    $this->removeRecipient->execute($recipient);
                    $revoked++;
                });

            $locked->update(['auto_renew' => false, 'next_renewal_at' => null]);
            $locked->delete();

            return $revoked;
        });
    }
}
