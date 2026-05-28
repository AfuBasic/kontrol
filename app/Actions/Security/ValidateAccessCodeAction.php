<?php

namespace App\Actions\Security;

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\EstateSettings;

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
     *     code_type: string|null,
     *     has_vehicle: bool
     * }
     */
    public function execute(string $code, int $estateId): array
    {
        // Fetch Settings early to use for grace period
        $settings = EstateSettings::forEstate($estateId);
        $gracePeriod = $settings->access_code_grace_period_minutes ?? 0;

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
                ->with('user:id,name,email')
                ->first();

            if ($accessCode && $accessCode->status === AccessCodeStatus::Active) {
                $accessCode->update(['scanned_at' => now()]);
            }
        } else {
            $accessCode = AccessCode::query()
                ->forEstate($estateId)
                ->where('code', $code)
                ->with('user:id,name,email')
                ->first();
        }

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
        if ($accessCode->status === AccessCodeStatus::Expired) {
            return $this->denied('Code has expired', 'expired', $accessCode);
        }

        if ($accessCode->expires_at && now()->greaterThan($accessCode->expires_at->copy()->addMinutes($gracePeriod))) {
            return $this->denied('Code has expired', 'expired', $accessCode);
        }

        if ($accessCode->status !== AccessCodeStatus::Active) {
            return $this->denied('Code is not active', 'inactive', $accessCode);
        }

        return $this->granted($accessCode);
    }

    private function granted(AccessCode $accessCode): array
    {
        return [
            'valid' => true,
            'status' => 'granted',
            'message' => 'Access code is valid',
            'code' => $accessCode->code,
            'pass_uuid' => $accessCode->pass_uuid,
            'visitor_name' => $accessCode->visitor_name,
            'host_name' => $accessCode->user?->name,
            'purpose' => $accessCode->purpose,
            'expires_at' => $accessCode->expires_at?->toIso8601String(),
            'code_type' => $accessCode->type,
            'has_vehicle' => (bool) $accessCode->has_vehicle,
        ];
    }

    private function denied(string $message, string $status, ?AccessCode $accessCode = null): array
    {
        return [
            'valid' => false,
            'status' => $status,
            'message' => $message,
            'code' => $accessCode?->code,
            'pass_uuid' => $accessCode?->pass_uuid,
            'visitor_name' => $accessCode?->visitor_name,
            'host_name' => $accessCode?->user?->name,
            'purpose' => $accessCode?->purpose,
            'expires_at' => $accessCode?->expires_at?->toIso8601String(),
            'code_type' => $accessCode?->type,
            'has_vehicle' => (bool) $accessCode?->has_vehicle,
        ];
    }
}
