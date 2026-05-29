<?php

namespace App\Actions\Security;

use App\Events\Resident\VisitorArrivedBroadcast;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\EstateSettings;
use App\Models\User;
use App\Notifications\VisitorArrivedNotification;
use Illuminate\Support\Facades\DB;

class RecordCheckInAction
{
    /**
     * Record a visitor check-in.
     */
    public function execute(string $code, int $estateId, User $verifiedBy, array $vehicleData = [], ?string $verificationMethod = null): AccessLog
    {
        return DB::transaction(function () use ($code, $estateId, $verifiedBy, $vehicleData, $verificationMethod) {
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
                    ->with('user:id,name,email,fcm_token')
                    ->lockForUpdate()
                    ->firstOrFail();
            } else {
                $accessCode = AccessCode::query()
                    ->forEstate($estateId)
                    ->where('code', $code)
                    ->with('user:id,name,email,fcm_token')
                    ->lockForUpdate()
                    ->firstOrFail();
            }

            $settings = EstateSettings::forEstate($estateId);
            $forceSingleUse = $settings->access_code_single_use;

            // Mark as used only if estate setting enforces single-use AND it's a single-use code
            if ($forceSingleUse && $accessCode->type === 'single_use') {
                $accessCode->markAsUsed($verifiedBy);
            } else {
                $accessCode->updateQuietly([
                    'verified_by' => $verifiedBy->id,
                    'used_at' => now(),
                ]);
            }

            // Create Access Log
            $log = AccessLog::create([
                'estate_id' => $estateId,
                'access_code_id' => $accessCode->id,
                'verified_by' => $verifiedBy->id,
                'verified_at' => now(),
                'vehicle_make' => $vehicleData['vehicle_make'] ?? null,
                'vehicle_model' => $vehicleData['vehicle_model'] ?? null,
                'vehicle_plate_number' => $vehicleData['vehicle_plate_number'] ?? null,
                'meta' => [
                    'visitor_name' => $accessCode->visitor_name,
                    'host_id' => $accessCode->user_id,
                    'enforced_single_use' => $forceSingleUse,
                    'original_type' => $accessCode->type,
                    'verification_method' => $verificationMethod,
                ],
            ]);

            // Notify Resident
            $accessCode->user->notify(new VisitorArrivedNotification($accessCode));

            // Broadcast real-time notification
            VisitorArrivedBroadcast::dispatch($accessCode->user, $accessCode);

            return $log;
        });
    }
}
