<?php

namespace App\Actions\Organization;

use App\Models\AccessCode;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class RenewOrganizationCredentialAction
{
    public function __construct(
        private IssueOrganizationCredentialAction $issueAction,
    ) {}

    /**
     * Renew an organization access credential.
     */
    public function execute(
        AccessCode $credential,
        User $renewedBy,
        ?CarbonImmutable $newExpiresAt = null,
        ?string $reason = null
    ): AccessCode {
        if ($credential->type !== 'organization' || ! $credential->organization_member_id) {
            throw ValidationException::withMessages([
                'credential' => ['Only organization credentials can be renewed via this action.'],
            ]);
        }

        $member = $credential->organizationMember;

        if (! $member || $member->status !== 'active') {
            throw ValidationException::withMessages([
                'credential' => ['The associated access member is no longer active.'],
            ]);
        }

        // Calculate default renewal: 6 months or until member valid_until
        $expiry = $newExpiresAt ?? ($member->valid_until ? CarbonImmutable::instance($member->valid_until)->endOfDay() : now()->addMonths(6)->endOfDay());

        $notes = $reason ? "Renewed: {$reason}" : "Renewed credential for {$member->name}";

        return $this->issueAction->execute(
            member: $member,
            issuedBy: $renewedBy,
            expiresAt: $expiry,
            notes: $notes
        );
    }
}
