<?php

namespace App\Jobs;

use App\Actions\Organization\RenewOrganizationCredentialAction;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RenewExpiringOrganizationCredentials implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     */
    public function handle(RenewOrganizationCredentialAction $renewAction): void
    {
        $threshold = CarbonImmutable::now()->addDays(7);

        // Find active organization credentials expiring within the next 7 days
        $expiringCredentials = AccessCode::query()
            ->where('type', 'organization')
            ->where('status', AccessCodeStatus::Active)
            ->whereNotNull('organization_member_id')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $threshold)
            ->with(['organizationMember.organization', 'user'])
            ->get();

        $renewedCount = 0;

        foreach ($expiringCredentials as $credential) {
            $member = $credential->organizationMember;

            // Only renew if member and organization are active
            if (! $member || $member->status !== 'active' || ! $member->organization || ! $member->organization->is_active) {
                continue;
            }

            // Check if member valid_until has already passed
            if ($member->valid_until && CarbonImmutable::instance($member->valid_until)->isPast()) {
                continue;
            }

            // Fallback user for renewed_by
            $renewedBy = $credential->user ?? $member->organization->memberships()->where('role', 'admin')->first()?->user;

            if (! $renewedBy) {
                continue;
            }

            try {
                $renewAction->execute(
                    credential: $credential,
                    renewedBy: $renewedBy,
                    reason: 'Automated 7-day pre-expiry renewal'
                );
                $renewedCount++;
            } catch (\Throwable $e) {
                Log::warning("Failed to auto-renew organization credential #{$credential->id}: {$e->getMessage()}");
            }
        }

        Log::info("Automated organization credential renewal completed. {$renewedCount} credentials renewed.");
    }
}
