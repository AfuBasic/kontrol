<?php

namespace App\Actions\Auth;

use App\Enums\DeviceAuthorizationStatus;
use App\Models\DeviceAuthorizationRequest;
use App\Models\TrustedDevice;
use App\Services\Security\DeviceTrustCookie;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ConsumeDeviceAuthorization
{
    public function __construct(
        private CompleteAuthenticatedLogin $completeAuthenticatedLogin,
        private DeviceTrustCookie $deviceTrustCookie,
    ) {}

    public function execute(Request $request, DeviceAuthorizationRequest $authorization): RedirectResponse
    {
        $sessionAuthorizationId = $request->session()->get('device_authorization_id');

        if ((int) $sessionAuthorizationId !== $authorization->id) {
            throw new RuntimeException('mismatch');
        }

        $plainTextToken = $this->deviceTrustCookie->read($request);
        $expectedHash = $authorization->token_hash;

        if ($plainTextToken === null || ! hash_equals($expectedHash, $this->deviceTrustCookie->hash($plainTextToken))) {
            throw new RuntimeException('credential');
        }

        [$device, $user] = DB::transaction(function () use ($authorization): array {
            $locked = DeviceAuthorizationRequest::query()
                ->whereKey($authorization->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->isConsumed()) {
                throw new RuntimeException('completed');
            }

            if ($locked->isDenied()) {
                throw new RuntimeException('denied');
            }

            if ($locked->isExpired()) {
                throw new RuntimeException('expired');
            }

            if (! $locked->isApproved()) {
                throw new RuntimeException('pending');
            }

            $now = now();

            $device = TrustedDevice::query()->create([
                'user_id' => $locked->user_id,
                'token_hash' => $locked->token_hash,
                'display_name' => $locked->display_name,
                'device_type' => $locked->device_type,
                'platform' => $locked->platform,
                'browser' => $locked->browser,
                'ip_address' => $locked->request_ip,
                'approximate_location' => $locked->approximate_location,
                'first_seen_at' => $locked->created_at ?? $now,
                'last_used_at' => $now,
                'trusted_at' => $now,
                'expires_at' => $now->addDays((int) config('device-trust.inactivity_days')),
            ]);

            $locked->forceFill([
                'status' => DeviceAuthorizationStatus::Consumed,
                'consumed_at' => $now,
            ])->save();

            $event = $locked->securityEvent;

            if ($event) {
                $event->forceFill(['trusted_device_id' => $device->id])->save();
                $event->appendTimeline(
                    'device_trusted',
                    'Device added to trusted devices.',
                );
            }

            return [$device, $locked->user];
        });

        $request->session()->forget('device_authorization_id');

        return $this->completeAuthenticatedLogin->execute(
            $user,
            $request,
            $authorization->remember,
            $device,
            $plainTextToken,
        );
    }
}
