<?php

namespace App\Actions\Security;

use App\Events\Resident\VisitorCheckedOutBroadcast;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\User;
use App\Notifications\VisitorCheckedOutNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

use App\Models\EstateSettings;
use App\Services\Security\CheckpointClaimService;
use Illuminate\Validation\ValidationException;

class RecordCheckOutAction
{
    /**
     * Record a visitor check-out.
     */
    public function execute(
        string $code,
        int $estateId,
        User $verifiedBy,
        ?\DateTimeInterface $checkedOutAt = null
    ): AccessLog {
        $timestamp = $checkedOutAt ? CarbonImmutable::instance($checkedOutAt) : now();

        return DB::transaction(function () use ($code, $estateId, $verifiedBy, $timestamp) {
            $passUuid = null;
            $qrToken = null;

            if (str_starts_with($code, 'kontrol://pass/')) {
                $parsed = parse_url($code);
                if ($parsed && isset($parsed['path'])) {
                    $pathParts = explode('/', trim($parsed['path'], '/'));
                    $passUuid = end($pathParts);
                }
                if (isset($parsed['query'])) {
                    parse_str($parsed['query'], $queryParams);
                    $qrToken = $queryParams['token'] ?? null;
                }
            }

            if ($passUuid && $qrToken) {
                $accessCode = AccessCode::query()
                    ->forEstate($estateId)
                    ->where('pass_uuid', $passUuid)
                    ->where('qr_token', $qrToken)
                    ->firstOrFail();
            } else {
                $accessCode = AccessCode::query()
                    ->forEstate($estateId)
                    ->where('code', $code)
                    ->firstOrFail();
            }

            // Find the most recent active log that is not checked out
            $log = AccessLog::query()
                ->where('estate_id', $estateId)
                ->where('access_code_id', $accessCode->id)
                ->whereNull('checked_out_at')
                ->latest('verified_at')
                ->firstOrFail();

            $checkoutGate = app(CheckpointClaimService::class)->getCurrentCheckpoint($estateId, $verifiedBy);

            // Enforce entry point checkout constraint if enabled for estate
            $settings = EstateSettings::forEstate($estateId);
            if ($settings->entry_point_checkout_enforced && $log->entry_point) {
                if ($checkoutGate && strcasecmp(trim($log->entry_point), trim($checkoutGate)) !== 0) {
                    throw ValidationException::withMessages([
                        'checkout' => "Entry Point Checkout Enforced: Visitor entered at '{$log->entry_point}' and can only check out from '{$log->entry_point}'. You are currently operating at '{$checkoutGate}'.",
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

            // Log to the activity feed so the resident sees the checkout
            activity()
                ->causedBy($verifiedBy)
                ->performedOn($accessCode)
                ->withProperties([
                    'visitor_name' => $accessCode->visitor_name,
                    'code' => $accessCode->code,
                ])
                ->log('Visitor checked out');

            // Broadcast and notify the host resident
            $host = $accessCode->user;
            if ($host) {
                event(new VisitorCheckedOutBroadcast($host, $accessCode));
                $host->notify(new VisitorCheckedOutNotification($accessCode));
            }

            return $log;
        });
    }
}
