<?php

namespace App\Actions\Auth;

use App\Actions\Security\RecordSecurityEvent;
use App\Enums\DeviceAuthorizationStatus;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\DeviceAuthorizationRequest;
use App\Models\SecurityEvent;
use App\Models\User;
use App\Notifications\Security\NewDeviceSignInNotification;
use App\Services\Security\DeviceTrustCookie;
use App\Services\Security\PendingDeviceAuthorizationCookie;
use App\Support\DeviceMetadata;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Throwable;

class StartDeviceAuthorization
{
    public function __construct(
        private DeviceTrustCookie $deviceTrustCookie,
        private PendingDeviceAuthorizationCookie $pendingDeviceAuthorizationCookie,
        private RecordSecurityEvent $recordSecurityEvent,
    ) {}

    /**
     * @return array{authorization: DeviceAuthorizationRequest, event: SecurityEvent, plain_text_token: string}
     */
    public function execute(
        User $user,
        Request $request,
        DeviceMetadata $metadata,
        bool $remember = false,
        bool $revokedAttempt = false,
    ): array {
        $plainTextToken = $this->deviceTrustCookie->generatePlainTextToken();

        $authorization = DeviceAuthorizationRequest::query()->create([
            'user_id' => $user->id,
            'token_hash' => $this->deviceTrustCookie->hash($plainTextToken),
            'display_name' => $metadata->displayName,
            'device_type' => $metadata->deviceType,
            'platform' => $metadata->platform,
            'browser' => $metadata->browser,
            'approximate_location' => $metadata->approximateLocation,
            'request_ip' => $metadata->ipAddress,
            'status' => DeviceAuthorizationStatus::Pending,
            'remember' => $remember,
            'expires_at' => now()->addMinutes((int) config('device-trust.authorization_ttl_minutes')),
            'last_notified_at' => now(),
        ]);

        $event = $this->recordSecurityEvent->open(
            user: $user,
            type: $revokedAttempt ? SecurityEventType::RevokedDeviceAttempt : SecurityEventType::NewDeviceAttempt,
            severity: $revokedAttempt ? SecurityEventSeverity::High : SecurityEventSeverity::Elevated,
            status: SecurityEventStatus::Pending,
            label: $revokedAttempt
                ? 'A previously removed device attempted to sign in.'
                : 'Unknown device attempted sign-in.',
            metadata: $metadata,
            authorization: $authorization,
        );

        $this->recordSecurityEvent->append(
            $event,
            SecurityEventType::DeviceVerificationSent->value,
            'Verification email sent.',
        );

        $this->sendNotification($user, $authorization);

        $request->session()->put([
            'device_authorization_id' => $authorization->id,
            'otp_user_id' => null,
            'otp_remember' => null,
            'otp_via_social' => null,
        ]);
        $request->session()->forget(['otp_user_id', 'otp_remember', 'otp_via_social']);

        $this->deviceTrustCookie->queue($plainTextToken);
        $this->pendingDeviceAuthorizationCookie->queue($authorization->ulid);

        return [
            'authorization' => $authorization,
            'event' => $event,
            'plain_text_token' => $plainTextToken,
        ];
    }

    public function resend(DeviceAuthorizationRequest $authorization): void
    {
        $authorization->forceFill(['last_notified_at' => now()])->save();

        $this->sendNotification($authorization->user, $authorization);
    }

    private function sendNotification(User $user, DeviceAuthorizationRequest $authorization): void
    {
        $approveUrl = URL::temporarySignedRoute(
            'device-authorization.approve',
            $authorization->expires_at,
            ['authorization' => $authorization->ulid],
        );

        $denyUrl = URL::temporarySignedRoute(
            'device-authorization.deny',
            $authorization->expires_at,
            ['authorization' => $authorization->ulid],
        );

        try {
            $user->notify(new NewDeviceSignInNotification($authorization, $approveUrl, $denyUrl));
        } catch (Throwable $e) {
            Log::error('Failed to send new device verification email.', [
                'user_id' => $user->id,
                'authorization_ulid' => $authorization->ulid,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
