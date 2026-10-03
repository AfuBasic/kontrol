<?php

namespace App\Actions\Organization;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Jobs\NotifyBulkInviteDeliveryReportJob;
use App\Models\AccessCode;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use App\Models\User;
use App\Policies\Organization\OrganizationBulkInviteValidityPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddBulkInviteRecipientsAction
{
    /**
     * Add people to a group that already exists. Each new person gets a pass for the group's current
     * period, delivered the same way as when the group was created.
     *
     * Someone already in the group is skipped, someone who was removed earlier is brought back with a
     * fresh pass, and someone who opted out is left alone.
     *
     * @param  array<int, string>  $emails
     * @return array{added: int, skipped_existing: array<int, string>, skipped_opted_out: array<int, string>}
     */
    public function execute(OrganizationBulkInvite $bulkInvite, User $user, array $emails): array
    {
        $organization = $bulkInvite->organization;
        $estate = $bulkInvite->estate;

        if (! $organization || ! $organization->is_active) {
            throw ValidationException::withMessages(['emails' => ['This organization is not active.']]);
        }

        if ($bulkInvite->status !== 'active') {
            throw ValidationException::withMessages(['emails' => ['This group is no longer active.']]);
        }

        $startDate = CarbonImmutable::parse($bulkInvite->valid_from)->startOfDay();
        $endDate = CarbonImmutable::parse($bulkInvite->valid_until)->endOfDay();

        if ($endDate->isPast()) {
            throw ValidationException::withMessages(['emails' => ["This group's period has ended. Renew it first, or create a new group."]]);
        }

        $uniqueEmails = OrganizationBulkInviteValidityPolicy::normalizeEmails($emails);

        return DB::transaction(function () use ($bulkInvite, $organization, $estate, $user, $uniqueEmails, $startDate, $endDate) {
            // Lock the group so two people adding at once cannot both slip past the size limit.
            $group = OrganizationBulkInvite::query()->whereKey($bulkInvite->id)->lockForUpdate()->firstOrFail();

            $existing = $group->recipients()->get()->keyBy(fn (OrganizationBulkInviteRecipient $r) => strtolower($r->email));

            $toAdd = [];
            $skippedExisting = [];
            $skippedOptedOut = [];

            foreach ($uniqueEmails as $email) {
                $current = $existing->get($email);

                if ($current?->status === 'active') {
                    $skippedExisting[] = $email;
                } elseif ($current?->status === 'opted_out') {
                    $skippedOptedOut[] = $email;
                } else {
                    $toAdd[] = $email;
                }
            }

            $activeNow = $existing->where('status', 'active')->count();
            $room = OrganizationBulkInviteValidityPolicy::MAX_RECIPIENTS - $activeNow;

            if (count($toAdd) > $room) {
                throw ValidationException::withMessages([
                    'emails' => [
                        'A group holds up to '.OrganizationBulkInviteValidityPolicy::MAX_RECIPIENTS." people. This one has {$activeNow}, so you can add ".max(0, $room).' more.',
                    ],
                ]);
            }

            $sendImmediately = (bool) $group->send_immediately;
            $dispatches = [];

            foreach ($toAdd as $email) {
                $recipient = $existing->get($email);

                if ($recipient) {
                    $recipient->update([
                        'status' => 'active',
                        'delivery_status' => $sendImmediately ? 'queued' : 'pending',
                        'delivery_error' => null,
                    ]);
                } else {
                    $recipient = OrganizationBulkInviteRecipient::create([
                        'bulk_invite_id' => $group->id,
                        'email' => $email,
                        'status' => 'active',
                        'delivery_status' => $sendImmediately ? 'queued' : 'pending',
                    ]);
                }

                $pass = AccessCode::create([
                    'estate_id' => $estate->id,
                    'organization_id' => $organization->id,
                    'bulk_invite_recipient_id' => $recipient->id,
                    'user_id' => $user->id,
                    'code' => AccessCode::generateCode(),
                    'type' => 'bulk_visitor',
                    'source' => AccessCodeSource::BulkInvite,
                    'visitor_name' => strstr($email, '@', true) ?: $email,
                    'purpose' => $group->purpose ?? "{$organization->name} - Visitor Pass",
                    'status' => AccessCodeStatus::Active,
                    'starts_at' => $startDate,
                    'expires_at' => $endDate,
                    'notes' => "Added to bulk invite group for {$email} ({$organization->name})",
                ]);

                $recipient->update(['last_access_code_id' => $pass->id]);

                if ($sendImmediately) {
                    $dispatches[] = ['accessCodeId' => $pass->id, 'recipientId' => $recipient->id];
                }
            }

            if ($dispatches !== []) {
                DB::afterCommit(function () use ($dispatches, $group) {
                    foreach ($dispatches as $item) {
                        DeliverBulkVisitorPassJob::dispatch($item['accessCodeId'], $item['recipientId']);
                    }

                    NotifyBulkInviteDeliveryReportJob::dispatch($group->id)->delay(now()->addMinutes(2));
                });
            }

            return [
                'added' => count($toAdd),
                'skipped_existing' => $skippedExisting,
                'skipped_opted_out' => $skippedOptedOut,
            ];
        });
    }
}
