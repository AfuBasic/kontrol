<?php

namespace App\Actions\Security;

use App\Models\AccessLog;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutQuickEntryAction
{
    /**
     * Checkout a visitor who entered via Quick Entry using their tag.
     */
    public function execute(
        string $tag,
        int $estateId,
        User $verifiedBy,
        ?\DateTimeInterface $checkedOutAt = null
    ): AccessLog {
        $timestamp = $checkedOutAt ? CarbonImmutable::instance($checkedOutAt) : now();
        $normalizedTag = strtoupper(trim($tag));

        return DB::transaction(function () use ($normalizedTag, $estateId, $verifiedBy, $timestamp) {
            // Find the most recent active quick entry log with this tag that is not checked out
            $log = AccessLog::withoutGlobalScopes()
                ->where('estate_id', $estateId)
                ->whereNull('access_code_id')
                ->where('meta->tag', $normalizedTag)
                ->whereNull('checked_out_at')
                ->latest('verified_at')
                ->first();

            if (! $log) {
                throw ValidationException::withMessages([
                    'tag' => ["No active Quick Entry found for tag '{$normalizedTag}'."],
                ]);
            }

            $checkoutGate = app(CheckpointClaimService::class)->getCurrentCheckpoint($estateId, $verifiedBy);

            // Enforce entry point checkout constraint if enabled for estate
            $settings = EstateSettings::forEstate($estateId);
            if ($settings->entry_point_checkout_enforced && $log->entry_point) {
                if (! $checkoutGate || strcasecmp(trim($log->entry_point), trim($checkoutGate)) !== 0) {
                    $activeGateLabel = $checkoutGate ? "You are currently operating at '{$checkoutGate}'." : 'Please select an active checkpoint first.';
                    throw ValidationException::withMessages([
                        'checkout' => "Entry Point Checkout Enforced: Visitor entered at '{$log->entry_point}' and can only check out from '{$log->entry_point}'. {$activeGateLabel}",
                    ]);
                }
            }

            $meta = $log->meta ?? [];
            if ($checkoutGate) {
                $meta['exit_point'] = $checkoutGate;
            }

            $log->update([
                'checked_out_at' => $timestamp,
                'checked_out_by' => $verifiedBy->id,
                'meta' => $meta,
            ]);

            $orgName = $meta['organization_name'] ?? 'Organization';
            $visitorName = $meta['visitor_name'] ?? 'Visitor';

            activity('access')
                ->causedBy($verifiedBy)
                ->withProperties([
                    'visitor_name' => $visitorName,
                    'tag' => $normalizedTag,
                    'organization' => $orgName,
                ])
                ->log("Quick Entry visitor checked out (Tag: {$normalizedTag})");

            return $log;
        });
    }
}
