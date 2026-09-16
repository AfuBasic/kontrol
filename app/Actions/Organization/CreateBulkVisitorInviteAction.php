<?php

namespace App\Actions\Organization;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Models\AccessCode;
use App\Models\EstateOrganization;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use App\Models\User;
use App\Policies\Organization\OrganizationBulkInviteValidityPolicy;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateBulkVisitorInviteAction
{
    /**
     * @param  array<int, string>  $emails
     */
    public function execute(
        EstateOrganization $organization,
        User $user,
        array $emails,
        ?string $name = null,
        ?string $purpose = null,
        ?CarbonInterface $validFrom = null,
        ?CarbonInterface $validUntil = null,
        bool $autoRenew = false,
    ): OrganizationBulkInvite {
        if (! $organization->is_active) {
            throw ValidationException::withMessages([
                'organization' => ['Cannot create visitor invites for an inactive organization.'],
            ]);
        }

        $estate = $organization->estate;

        // Verify estate subscription is active or on trial if auto-renew requested
        if ($autoRenew) {
            $sub = $estate->subscriptionRecord;
            $hasActiveSub = $sub && ($sub->isActive() || $sub->isOnTrial());

            if (! $hasActiveSub) {
                throw ValidationException::withMessages([
                    'auto_renew' => ['An active estate subscription is required to enable auto-renewal.'],
                ]);
            }
        }

        // Validate and normalize emails
        $uniqueEmails = OrganizationBulkInviteValidityPolicy::normalizeEmails($emails);

        $startDate = $validFrom ? CarbonImmutable::instance($validFrom)->startOfDay() : now()->startOfDay();
        $endDate = $validUntil ? CarbonImmutable::instance($validUntil)->endOfDay() : OrganizationBulkInviteValidityPolicy::defaultValidUntil($startDate);

        OrganizationBulkInviteValidityPolicy::validateDates($startDate, $endDate);

        $nextRenewalAt = $autoRenew ? $endDate->subDay()->toDateString() : null;

        return DB::transaction(function () use ($organization, $estate, $user, $uniqueEmails, $name, $purpose, $startDate, $endDate, $autoRenew, $nextRenewalAt) {
            $bulkInvite = OrganizationBulkInvite::create([
                'organization_id' => $organization->id,
                'estate_id' => $estate->id,
                'created_by' => $user->id,
                'name' => $name,
                'purpose' => $purpose ?? "{$organization->name} - Visitor Pass",
                'valid_from' => $startDate->toDateString(),
                'valid_until' => $endDate->toDateString(),
                'auto_renew' => $autoRenew,
                'status' => 'active',
                'next_renewal_at' => $nextRenewalAt,
            ]);

            $dispatches = [];

            foreach ($uniqueEmails as $email) {
                $recipient = OrganizationBulkInviteRecipient::create([
                    'bulk_invite_id' => $bulkInvite->id,
                    'email' => $email,
                    'status' => 'active',
                ]);

                $pass = AccessCode::create([
                    'estate_id' => $estate->id,
                    'organization_id' => $organization->id,
                    'bulk_invite_recipient_id' => $recipient->id,
                    'user_id' => $user->id,
                    'code' => AccessCode::generateCode(),
                    'type' => 'bulk_visitor',
                    'source' => AccessCodeSource::BulkInvite,
                    'visitor_name' => strstr($email, '@', true) ?: $email,
                    'purpose' => $purpose ?? "{$organization->name} - Visitor Pass",
                    'status' => AccessCodeStatus::Active,
                    'starts_at' => $startDate,
                    'expires_at' => $endDate,
                    'notes' => "Bulk invite pass for {$email} ({$organization->name})",
                ]);

                $recipient->update([
                    'last_access_code_id' => $pass->id,
                ]);

                $dispatches[] = [
                    'accessCodeId' => $pass->id,
                    'recipientId' => $recipient->id,
                ];
            }

            DB::afterCommit(function () use ($dispatches) {
                foreach ($dispatches as $item) {
                    DeliverBulkVisitorPassJob::dispatch($item['accessCodeId'], $item['recipientId']);
                }
            });

            return $bulkInvite->load('recipients.lastAccessCode');
        });
    }
}
