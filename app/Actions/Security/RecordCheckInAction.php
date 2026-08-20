<?php

namespace App\Actions\Security;

use App\Enums\AccessCodeStatus;
use App\Events\Resident\VisitorArrivedBroadcast;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\EstateSettings;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use App\Notifications\VisitorArrivedNotification;
use App\Services\Security\CheckpointClaimService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordCheckInAction
{
    /**
     * Record a visitor check-in.
     */
    public function execute(
        string $code,
        int $estateId,
        User $verifiedBy,
        array $vehicleData = [],
        ?string $verificationMethod = null,
        ?\DateTimeInterface $verifiedAt = null,
        ?string $entryPoint = null
    ): AccessLog {
        $timestamp = $verifiedAt ? CarbonImmutable::instance($verifiedAt) : now();
        $entryPoint = $entryPoint ?? app(CheckpointClaimService::class)->getCurrentCheckpoint($estateId, $verifiedBy);

        return DB::transaction(function () use ($code, $estateId, $verifiedBy, $vehicleData, $verificationMethod, $timestamp, $entryPoint) {
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

            // Enforce vehicle information at security gate check-in if policy is active and visitor has a vehicle
            $visitorHasVehicle = (bool) ($accessCode->has_vehicle || ! empty($vehicleData['has_vehicle']) || ! empty($vehicleData['vehicle_plate']));
            if ($settings->require_vehicle_information && $visitorHasVehicle) {
                $providedPlate = $vehicleData['vehicle_plate'] ?? $accessCode->vehicle_plate;
                if (empty($providedPlate)) {
                    throw ValidationException::withMessages([
                        'vehicle_plate' => ['Vehicle plate details are required by estate policy for vehicle check-in.'],
                    ]);
                }
            }

            $isEventFull = false;
            if ($accessCode->type === 'event' && $accessCode->guest_limit !== null) {
                $currentCount = $accessCode->accessLogs()->withoutGlobalScope(ZoneScope::class)->count();
                if ($currentCount + 1 >= $accessCode->guest_limit) {
                    $isEventFull = true;
                }
            }

            // Mark as used if single-use (and estate enforces it) OR if it's an event pass that just reached its limit
            if (($forceSingleUse && $accessCode->type === 'single_use') || $isEventFull) {
                $accessCode->update([
                    'status' => AccessCodeStatus::Used,
                    'used_at' => $timestamp,
                    'verified_by' => $verifiedBy->id,
                ]);
            } else {
                $accessCode->updateQuietly([
                    'verified_by' => $verifiedBy->id,
                    'used_at' => $timestamp,
                ]);
            }

            // Create Access Log
            $log = AccessLog::create([
                'estate_id' => $estateId,
                'entry_point' => $entryPoint,
                'access_code_id' => $accessCode->id,
                'verified_by' => $verifiedBy->id,
                'verified_at' => $timestamp,
                'vehicle_make' => $vehicleData['vehicle_make'] ?? null,
                'vehicle_model' => $vehicleData['vehicle_model'] ?? null,
                'vehicle_plate_number' => $vehicleData['vehicle_plate_number'] ?? null,
                'meta' => [
                    'visitor_name' => $accessCode->visitor_name,
                    'host_id' => $accessCode->user_id,
                    'enforced_single_use' => $forceSingleUse,
                    'original_type' => $accessCode->type,
                    'verification_method' => $verificationMethod,
                    'entry_point' => $entryPoint,
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
