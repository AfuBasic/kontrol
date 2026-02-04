<?php

namespace App\Actions\Security;

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\User;

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

        if ($accessCode->status === AccessCodeStatus::Expired || $accessCode->isExpired()) {
            return $this->denied('Code has expired', 'expired', $accessCode);
        }

        if ($accessCode->status !== AccessCodeStatus::Active) {
            return $this->denied('Code is not active', 'inactive', $accessCode);
        }

        // For single-use codes, mark as used
        if ($accessCode->type === 'single_use') {
            $accessCode->markAsUsed($verifiedBy);
        } else {
            // For long-lived codes, just record verification without changing status
            $accessCode->update(['verified_by' => $verifiedBy->id]);
        }

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
