<?php

namespace App\Actions\Auth;

use App\Models\TrustedDevice;
use App\Models\User;
use App\Services\Security\DeviceTrustCookie;
use Illuminate\Http\Request;

class CheckTrustedDevice
{
    public function __construct(private DeviceTrustCookie $deviceTrustCookie) {}

    /**
     * Resolve an active trusted device for the presented credential.
     */
    public function execute(User $user, Request $request): ?TrustedDevice
    {
        $plainTextToken = $this->deviceTrustCookie->read($request);

        if ($plainTextToken === null) {
            return null;
        }

        $device = $user->trustedDevices()
            ->where('token_hash', $this->deviceTrustCookie->hash($plainTextToken))
            ->first();

        if ($device === null || ! $device->isActive()) {
            return null;
        }

        return $device;
    }

    public function findRevoked(User $user, Request $request): ?TrustedDevice
    {
        $plainTextToken = $this->deviceTrustCookie->read($request);

        if ($plainTextToken === null) {
            return null;
        }

        return $user->trustedDevices()
            ->where('token_hash', $this->deviceTrustCookie->hash($plainTextToken))
            ->whereNotNull('revoked_at')
            ->first();
    }
}
