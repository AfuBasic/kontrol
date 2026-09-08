<?php

namespace App\Actions\Organization;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\OrganizationAccessMember;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class IssueOrganizationCredentialAction
{
    /**
     * Issue an organization access credential for a member.
     */
    public function execute(
        OrganizationAccessMember $member,
        User $issuedBy,
        ?CarbonImmutable $expiresAt = null,
        ?string $notes = null
    ): AccessCode {
        if ($member->status !== 'active') {
            throw ValidationException::withMessages([
                'member' => ['Cannot issue credentials to an inactive or suspended access member.'],
            ]);
        }

        $organization = $member->organization;

        return DB::transaction(function () use ($member, $organization, $issuedBy, $expiresAt, $notes) {
            // Supersede any currently active credentials for this member
            AccessCode::where('organization_member_id', $member->id)
                ->where('status', AccessCodeStatus::Active)
                ->update([
                    'status' => AccessCodeStatus::Superseded,
                    'revoked_at' => now(),
                ]);

            $code = AccessCode::generateCode();

            $expiry = $expiresAt ?? ($member->valid_until ? CarbonImmutable::instance($member->valid_until)->endOfDay() : now()->addMonths(6)->endOfDay());

            return AccessCode::create([
                'estate_id' => $organization->estate_id,
                'organization_id' => $organization->id,
                'organization_member_id' => $member->id,
                'user_id' => $issuedBy->id,
                'code' => $code,
                'type' => 'organization',
                'source' => AccessCodeSource::Web,
                'visitor_name' => $member->name,
                'purpose' => "{$organization->name} - {$member->category} access",
                'status' => AccessCodeStatus::Active,
                'expires_at' => $expiry,
                'starts_at' => now(),
                'notes' => $notes ?? "Issued to {$member->name} ({$member->identifier})",
            ]);
        });
    }
}
