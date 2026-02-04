<?php

namespace App\Actions\Security;

use App\Enums\AccessCodeStatus;
use App\Events\Resident\VisitorArrivedBroadcast;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\EstateSettings;
use App\Models\User;
use App\Notifications\VisitorArrivedNotification;

class ValidateAccessCodeAction
{
    /**
     * Validate an access code and return the result.
     *
     * @return array{
     *     valid: bool,
     *     status: string,
     *     message: string,
     *     visitor_name: string|null,
     *     host_name: string|null,
     *     purpose: string|null,
     *     expires_at: string|null,
     *     code_type: string|null
     * }
     */
    public function execute(string $code, int $estateId, User $verifiedBy): array
    {
        // Fetch Settings early to use for grace period and single-use checks
        $settings = EstateSettings::forEstate($estateId);
        $gracePeriod = $settings->access_code_grace_period_minutes ?? 0;
        $forceSingleUse = $settings->access_code_single_use;

        $accessCode = AccessCode::query()
            ->forEstate($estateId)
            ->where('code', $code)
            ->with('user:id,name,email')
            ->first();

        if (! $accessCode) {
            return $this->denied('Code not found', 'not_found');
        }

        if ($accessCode->status === AccessCodeStatus::Used) {
            return $this->denied('Code already used', 'already_used', $accessCode);
        }

        if ($accessCode->status === AccessCodeStatus::Revoked) {
            return $this->denied('Code has been revoked', 'revoked', $accessCode);
        }

        // Check expiration with grace period
        // If expires_at is present AND currently past (expires_at + grace_period), then it's expired.
        if ($accessCode->status === AccessCodeStatus::Expired) {
            return $this->denied('Code has expired', 'expired', $accessCode);
        }

        if ($accessCode->expires_at && now()->greaterThan($accessCode->expires_at->copy()->addMinutes($gracePeriod))) {
            return $this->denied('Code has expired', 'expired', $accessCode);
        }

        if ($accessCode->status !== AccessCodeStatus::Active) {
            return $this->denied('Code is not active', 'inactive', $accessCode);
        }

        // Mark as used if it's a single-use code OR if settings enforce single-use (unless it's long-lived)
        $shouldMarkUsed = $accessCode->type === 'single_use' || ($forceSingleUse && $accessCode->type !== 'long_lived');

        if ($shouldMarkUsed) {
            $accessCode->markAsUsed($verifiedBy);
        } else {
            // For long-lived codes, just update verification info and last used timestamp
            $accessCode->updateQuietly([
                'verified_by' => $verifiedBy->id,
                'used_at' => now(),
            ]);

            activity()
                ->performedOn($accessCode)
                ->causedBy($verifiedBy)
                ->log('Access code used');
        }

        // Create Access Log
        AccessLog::create([
            'estate_id' => $estateId,
            'access_code_id' => $accessCode->id,
            'verified_by' => $verifiedBy->id,
            'verified_at' => now(),
            'meta' => [
                'visitor_name' => $accessCode->visitor_name,
                'host_id' => $accessCode->user_id,
                'enforced_single_use' => $forceSingleUse,
                'original_type' => $accessCode->type,
            ],
        ]);

        // Notify Resident
        $accessCode->user->notify(new VisitorArrivedNotification($accessCode));

        // Broadcast real-time notification
        VisitorArrivedBroadcast::dispatch($accessCode->user, $accessCode);

        return $this->granted($accessCode);
    }

    /**
     * @return array{
     *     valid: bool,
     *     status: string,
     *     message: string,
     *     visitor_name: string|null,
     *     host_name: string|null,
     *     purpose: string|null,
     *     expires_at: string|null,
     *     code_type: string|null
     * }
     */
    private function granted(AccessCode $accessCode): array
    {
        return [
            'valid' => true,
            'status' => 'granted',
            'message' => 'Access granted',
            'visitor_name' => $accessCode->visitor_name,
            'host_name' => $accessCode->user?->name,
            'purpose' => $accessCode->purpose,
            'expires_at' => $accessCode->expires_at?->toIso8601String(),
            'code_type' => $accessCode->type,
        ];
    }

    /**
     * @return array{
     *     valid: bool,
     *     status: string,
     *     message: string,
     *     visitor_name: string|null,
     *     host_name: string|null,
     *     purpose: string|null,
     *     expires_at: string|null,
     *     code_type: string|null
     * }
     */
    private function denied(string $message, string $status, ?AccessCode $accessCode = null): array
    {
        return [
            'valid' => false,
            'status' => $status,
            'message' => $message,
            'visitor_name' => $accessCode?->visitor_name,
            'host_name' => $accessCode?->user?->name,
            'purpose' => $accessCode?->purpose,
            'expires_at' => $accessCode?->expires_at?->toIso8601String(),
            'code_type' => $accessCode?->type,
        ];
    }
}
