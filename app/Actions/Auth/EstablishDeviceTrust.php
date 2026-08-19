<?php

namespace App\Actions\Auth;

use App\Actions\Security\RecordSecurityEvent;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Services\Security\DeviceTrustCookie;
use App\Support\DeviceMetadata;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EstablishDeviceTrust
{
    public function __construct(
        private CheckTrustedDevice $checkTrustedDevice,
        private CompleteAuthenticatedLogin $completeAuthenticatedLogin,
        private StartDeviceAuthorization $startDeviceAuthorization,
        private DeviceTrustCookie $deviceTrustCookie,
        private RecordSecurityEvent $recordSecurityEvent,
    ) {}

    public function execute(User $user, Request $request, bool $remember = false): RedirectResponse
    {
        $metadata = DeviceMetadata::fromRequest($request);
        $trusted = $this->checkTrustedDevice->execute($user, $request);

        if ($trusted) {
            $plainTextToken = $this->deviceTrustCookie->read($request);

            return $this->completeAuthenticatedLogin->execute(
                $user,
                $request,
                $remember,
                $trusted,
                $plainTextToken,
            );
        }

        $revoked = $this->checkTrustedDevice->findRevoked($user, $request);

        if ($revoked !== null) {
            $this->startDeviceAuthorization->execute(
                $user,
                $request,
                $metadata,
                $remember,
                revokedAttempt: true,
            );

            return redirect()->route('login.device.show');
        }

        if (! $user->hasActiveTrustedDevice()) {
            return $this->bootstrap($user, $request, $metadata, $remember);
        }

        $this->startDeviceAuthorization->execute($user, $request, $metadata, $remember);

        return redirect()->route('login.device.show');
    }

    private function bootstrap(User $user, Request $request, DeviceMetadata $metadata, bool $remember): RedirectResponse
    {
        $plainTextToken = $this->deviceTrustCookie->generatePlainTextToken();
        $now = now();

        $device = TrustedDevice::query()->create([
            'user_id' => $user->id,
            'token_hash' => $this->deviceTrustCookie->hash($plainTextToken),
            'display_name' => $metadata->displayName,
            'device_type' => $metadata->deviceType,
            'platform' => $metadata->platform,
            'browser' => $metadata->browser,
            'ip_address' => $metadata->ipAddress,
            'approximate_location' => $metadata->approximateLocation,
            'first_seen_at' => $now,
            'last_used_at' => $now,
            'trusted_at' => $now,
            'expires_at' => $now->addDays((int) config('device-trust.inactivity_days')),
        ]);

        $this->recordSecurityEvent->open(
            user: $user,
            type: SecurityEventType::DeviceAuthorized,
            severity: SecurityEventSeverity::Info,
            status: SecurityEventStatus::Resolved,
            label: 'This device was added as a trusted device.',
            metadata: $metadata,
            device: $device,
            extra: ['bootstrap' => true],
        );

        return $this->completeAuthenticatedLogin->execute(
            $user,
            $request,
            $remember,
            $device,
            $plainTextToken,
        );
    }
}
