<?php

namespace App\Actions\Security;

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\EstateSettings;
use App\Models\Scopes\ZoneScope;

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
     *     has_vehicle: bool,
     *     action: string
     * }
     */
    public function execute(string $code, int $estateId): array
    {
        // Fetch Settings early to use for feature toggles & grace period
        $settings = EstateSettings::forEstate($estateId);

        if (! $settings->access_codes_enabled) {
            return $this->denied('Visitor pass verification is currently disabled by estate policy', 'disabled');
        }

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

        // If checkout tracking is enabled, check if they are checking out
        if ($settings->visitor_checkout_enabled && $accessCode->type !== 'event') {
            $activeSession = AccessLog::where('access_code_id', $accessCode->id)
                ->whereNull('checked_out_at')
                ->first();
            if ($activeSession) {
                $granted = $this->granted($accessCode, 'checkout_pending');
                $granted['message'] = 'Visitor is currently in the estate';
                $granted['checked_in_at'] = $activeSession->verified_at?->toIso8601String();
                $granted['access_log_id'] = $activeSession->id;
                $granted['entry_point'] = $activeSession->entry_point;
                $granted['entry_point_checkout_enforced'] = (bool) $settings->entry_point_checkout_enforced;

                return $granted;
            }
        }

        if ($accessCode->status === AccessCodeStatus::Used) {
            if ($accessCode->type === 'event' && $accessCode->guest_limit !== null && $accessCode->accessLogs()->withoutGlobalScope(ZoneScope::class)->count() >= $accessCode->guest_limit) {
                return $this->denied('Event pass guest limit reached', 'limit_reached', $accessCode);
            }

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

        if ($accessCode->status !== AccessCodeStatus::Active && $accessCode->status !== AccessCodeStatus::Scheduled) {
            return $this->denied('Code is not active', 'inactive', $accessCode);
        }

        if ($accessCode->isScheduledForFuture()) {
            return $this->denied('Pass is scheduled for a future date/time', 'scheduled', $accessCode);
        }

        if (! $accessCode->matchesRecurringSchedule(now())) {
            return $this->denied('Pass is not valid at this time based on its schedule', 'outside_schedule', $accessCode);
        }

        if ($accessCode->type === 'event' && $accessCode->guest_limit !== null) {
            if ($accessCode->accessLogs()->withoutGlobalScope(ZoneScope::class)->count() >= $accessCode->guest_limit) {
                return $this->denied('Event pass guest limit reached', 'limit_reached', $accessCode);
            }
        }

        return $this->granted($accessCode, 'checkin');
    }

    private function granted(AccessCode $accessCode, string $action = 'checkin'): array
    {
        return [
            'valid' => true,
            'status' => 'granted',
            'action' => $action,
            'message' => $action === 'checkout' ? 'Check-out is valid' : 'Access code is valid',
            'code' => $accessCode->code,
            'pass_uuid' => $accessCode->pass_uuid,
            'visitor_name' => $accessCode->visitor_name,
            'host_name' => $accessCode->user?->name,
            'purpose' => $accessCode->purpose,
            'expires_at' => $accessCode->expires_at?->toIso8601String(),
            'code_type' => $accessCode->type,
            'has_vehicle' => (bool) $accessCode->has_vehicle,
            'guest_limit' => $accessCode->guest_limit,
            'uses_count' => $accessCode->accessLogs()->withoutGlobalScope(ZoneScope::class)->count(),
            'starts_at' => $accessCode->starts_at?->toIso8601String(),
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
            'guest_limit' => $accessCode?->guest_limit,
            'uses_count' => $accessCode ? $accessCode->accessLogs()->withoutGlobalScope(ZoneScope::class)->count() : 0,
            'starts_at' => $accessCode?->starts_at?->toIso8601String(),
        ];
    }
}
