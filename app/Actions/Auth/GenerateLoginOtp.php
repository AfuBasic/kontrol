<?php

namespace App\Actions\Auth;

use App\Mail\Auth\LoginOtpMail;
use App\Models\LoginOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class GenerateLoginOtp
{
    /**
     * Generate a 6-digit OTP, store it hashed, and email the plain code.
     */
    public function execute(User $user, Request $request): void
    {
        // Delete expired OTPs to clean up, but keep valid ones so delayed emails still work
        LoginOtp::where('user_id', $user->id)->where('expires_at', '<=', now())->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        LoginOtp::create([
            'user_id' => $user->id,
            'code' => Hash::make($code),
            'ip_address' => $request->ip(),
            'user_agent_hash' => hash('sha256', $request->userAgent() ?? ''),
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
        ]);

        Mail::to($user->email)->queue(new LoginOtpMail($user, $code));
    }
}
