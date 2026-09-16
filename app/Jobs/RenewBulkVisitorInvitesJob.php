<?php

namespace App\Jobs;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRenewal;
use App\Policies\Organization\OrganizationBulkInviteValidityPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RenewBulkVisitorInvitesJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ?int $bulkInviteId = null,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $query = OrganizationBulkInvite::query()
            ->with(['organization', 'estate.subscriptionRecord', 'recipients' => fn ($q) => $q->where('status', 'active')]);

        if ($this->bulkInviteId) {
            $query->where('id', $this->bulkInviteId);
        } else {
            $query->eligibleForAutoRenewal();
        }

        $bulkInvites = $query->get();

        foreach ($bulkInvites as $bulkInvite) {
            $this->renewSingleInvite($bulkInvite);
        }
    }

    protected function renewSingleInvite(OrganizationBulkInvite $bulkInvite): void
    {
        $organization = $bulkInvite->organization;
        $estate = $bulkInvite->estate;

        if (! $organization || ! $organization->is_active) {
            Log::info("RenewBulkVisitorInvitesJob: Org {$bulkInvite->organization_id} inactive or missing. Skipping bulk invite {$bulkInvite->id}.");

            return;
        }

        // Subscription check
        $sub = $estate?->subscriptionRecord;
        $hasActiveSub = $sub && ($sub->isActive() || $sub->isOnTrial());

        if (! $hasActiveSub) {
            $bulkInvite->update([
                'renewal_blocked_reason' => 'subscription_required',
            ]);

            OrganizationBulkInviteRenewal::create([
                'bulk_invite_id' => $bulkInvite->id,
                'cycle_key' => "{$bulkInvite->id}:blocked:".now()->toDateString(),
                'valid_from' => now()->toDateString(),
                'valid_until' => now()->toDateString(),
                'status' => 'blocked',
                'blocked_reason' => 'subscription_required',
            ]);

            Log::info("RenewBulkVisitorInvitesJob: Estate {$estate?->id} has no active subscription. Blocked renewal for bulk invite {$bulkInvite->id}.");

            return;
        }

        // Determine cycle date window (starts day after current valid_until)
        $currentValidUntil = CarbonImmutable::instance($bulkInvite->valid_until);
        $nextValidFrom = $currentValidUntil->addDay()->startOfDay();
        $nextValidUntil = OrganizationBulkInviteValidityPolicy::defaultValidUntil($nextValidFrom);
        $cycleKey = "{$bulkInvite->id}:{$nextValidFrom->toDateString()}";

        // Idempotency: Attempt to claim this renewal cycle atomically
        $claimed = DB::table('organization_bulk_invite_renewals')->insertOrIgnore([
            'bulk_invite_id' => $bulkInvite->id,
            'cycle_key' => $cycleKey,
            'valid_from' => $nextValidFrom->toDateString(),
            'valid_until' => $nextValidUntil->toDateString(),
            'status' => 'processing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (! $claimed) {
            Log::info("RenewBulkVisitorInvitesJob: Renewal cycle {$cycleKey} already claimed or processed. Skipping.");

            return;
        }

        $activeRecipients = $bulkInvite->recipients;
        $renewedCount = 0;
        $blockedCount = 0;
        $dispatches = [];

        DB::transaction(function () use (
            $bulkInvite,
            $organization,
            $estate,
            $activeRecipients,
            $nextValidFrom,
            $nextValidUntil,
            $cycleKey,
            &$renewedCount,
            &$blockedCount,
            &$dispatches
        ) {
            foreach ($activeRecipients as $recipient) {
                if ($recipient->status !== 'active') {
                    $blockedCount++;

                    continue;
                }

                $pass = AccessCode::create([
                    'estate_id' => $estate->id,
                    'organization_id' => $organization->id,
                    'bulk_invite_recipient_id' => $recipient->id,
                    'user_id' => $bulkInvite->created_by,
                    'code' => AccessCode::generateCode(),
                    'type' => 'bulk_visitor',
                    'source' => AccessCodeSource::BulkInvite,
                    'visitor_name' => strstr($recipient->email, '@', true) ?: $recipient->email,
                    'purpose' => $bulkInvite->purpose ?? "{$organization->name} - Visitor Pass",
                    'status' => AccessCodeStatus::Active,
                    'starts_at' => $nextValidFrom,
                    'expires_at' => $nextValidUntil,
                    'notes' => "Auto-renewed bulk invite pass for {$recipient->email} ({$organization->name})",
                ]);

                $recipient->update([
                    'last_access_code_id' => $pass->id,
                ]);

                $renewedCount++;
                $dispatches[] = [
                    'accessCodeId' => $pass->id,
                    'recipientId' => $recipient->id,
                ];
            }

            // Update bulk invite record to reflect new cycle
            $bulkInvite->update([
                'valid_from' => $nextValidFrom->toDateString(),
                'valid_until' => $nextValidUntil->toDateString(),
                'last_renewed_at' => now(),
                'next_renewal_at' => $nextValidUntil->subDay()->toDateString(),
                'renewal_blocked_reason' => null,
            ]);

            // Mark renewal record as completed
            DB::table('organization_bulk_invite_renewals')
                ->where('bulk_invite_id', $bulkInvite->id)
                ->where('cycle_key', $cycleKey)
                ->update([
                    'status' => 'completed',
                    'processed_at' => now(),
                    'recipients_renewed' => $renewedCount,
                    'recipients_blocked' => $blockedCount,
                    'updated_at' => now(),
                ]);

            DB::afterCommit(function () use ($dispatches) {
                foreach ($dispatches as $item) {
                    DeliverBulkVisitorPassJob::dispatch($item['accessCodeId'], $item['recipientId']);
                }
            });
        });
    }
}
