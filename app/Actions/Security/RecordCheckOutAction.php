<?php

namespace App\Actions\Security;

use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

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

            $log->update([
                'checked_out_at' => $timestamp,
                'checked_out_by' => $verifiedBy->id,
            ]);

            return $log;
        });
    }
}
