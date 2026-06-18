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
        $otps = LoginOtp::where('user_id', $user->id)
            ->valid()
            ->get();

        $matchedOtp = null;
        foreach ($otps as $otp) {
            if (Hash::check($code, $otp->code)) {
                $matchedOtp = $otp;
                break;
            }
        }

        if (! $matchedOtp) {
            return false;
        }

        // Delete all OTPs for this user upon successful verification
        LoginOtp::where('user_id', $user->id)->delete();

        $userAgentHash = hash('sha256', $request->userAgent() ?? '');

        TrustedDevice::updateOrCreate(
            ['user_id' => $user->id, 'user_agent_hash' => $userAgentHash],
            ['ip_address' => $request->ip(), 'last_used_at' => now(), 'created_at' => now()],
        );

        return true;
    }
}
