<?php

namespace App\Actions\Auth;

use App\Models\LoginOtp;
use App\Models\TrustedDevice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class VerifyLoginOtp
{
    /**
     * Verify the OTP code. On success, adds the device as trusted.
     */
    public function execute(User $user, string $code, Request $request): bool
    {
        $otp = LoginOtp::where('user_id', $user->id)
            ->valid()
            ->latest('created_at')
            ->first();

        if (! $otp || ! Hash::check($code, $otp->code)) {
            return false;
        }

        $otp->delete();

        $userAgentHash = hash('sha256', $request->userAgent() ?? '');

        TrustedDevice::updateOrCreate(
            ['user_id' => $user->id, 'user_agent_hash' => $userAgentHash],
            ['ip_address' => $request->ip(), 'last_used_at' => now(), 'created_at' => now()],
        );

        return true;
    }
}
