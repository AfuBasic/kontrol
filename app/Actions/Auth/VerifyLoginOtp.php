<?php

namespace App\Actions\Auth;

use App\Models\LoginOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class VerifyLoginOtp
{
    /**
     * Verify the OTP code. Identity only — device trust is a separate control.
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

        LoginOtp::where('user_id', $user->id)->delete();

        return true;
    }
}
