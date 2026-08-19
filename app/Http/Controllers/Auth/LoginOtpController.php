<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\EstablishDeviceTrust;
use App\Actions\Auth\GenerateLoginOtp;
use App\Actions\Auth\VerifyLoginOtp;
use App\Actions\Security\RecordSecurityEvent;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\VerifyLoginOtpRequest;
use App\Models\User;
use App\Support\DeviceMetadata;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class LoginOtpController extends Controller
{
    /**
     * Show the OTP verification page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $userId = $request->session()->get('otp_user_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->forget(['otp_user_id', 'otp_remember', 'otp_via_social']);

            return redirect()->route('login');
        }

        return Inertia::render('Auth/VerifyOtp', [
            'email' => $this->maskEmail($user->email),
        ]);
    }

    /**
     * Verify the OTP code and complete login.
     */
    public function verify(
        VerifyLoginOtpRequest $request,
        VerifyLoginOtp $verifyOtp,
        AuthenticateUser $authenticateUser,
        EstablishDeviceTrust $establishDeviceTrust,
        RecordSecurityEvent $recordSecurityEvent,
    ): RedirectResponse {
        $userId = $request->session()->get('otp_user_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->forget(['otp_user_id', 'otp_remember', 'otp_via_social']);

            return redirect()->route('login');
        }

        if (! $verifyOtp->execute($user, $request->validated('code'), $request)) {
            $this->recordFailedAttempt($user, $request, $recordSecurityEvent);

            return back()->withErrors(['code' => 'The verification code is invalid or has expired.']);
        }

        $authenticateUser->ensureCanLogin($user->fresh() ?? $user);

        $remember = (bool) $request->session()->get('otp_remember', false);

        $request->session()->forget(['otp_user_id', 'otp_remember', 'otp_via_social']);

        return $establishDeviceTrust->execute($user, $request, $remember);
    }

    /**
     * Resend the OTP code.
     */
    public function resend(Request $request, GenerateLoginOtp $generateOtp): RedirectResponse
    {
        $userId = $request->session()->get('otp_user_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->forget(['otp_user_id', 'otp_remember', 'otp_via_social']);

            return redirect()->route('login');
        }

        $generateOtp->execute($user, $request);

        return back()->with('status', 'A new verification code has been sent to your email.');
    }

    /*
     * Mask an email address for display (e.g. "a***@gmail.com").
     */
    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email);

        $masked = $local[0].str_repeat('*', max(strlen($local) - 1, 2));

        return $masked.'@'.$domain;
    }

    private function recordFailedAttempt(User $user, Request $request, RecordSecurityEvent $recordSecurityEvent): void
    {
        $key = 'login-otp-failures:'.$user->id;
        $window = (int) config('device-trust.failed_attempt_window_minutes') * 60;
        $threshold = (int) config('device-trust.failed_attempt_threshold');

        RateLimiter::hit($key, $window);

        if (RateLimiter::attempts($key) !== $threshold) {
            return;
        }

        $recordSecurityEvent->open(
            user: $user,
            type: SecurityEventType::RepeatedFailedAuthentication,
            severity: SecurityEventSeverity::Elevated,
            status: SecurityEventStatus::Blocked,
            label: 'Repeated sign-in failures were detected.',
            metadata: DeviceMetadata::fromRequest($request),
        );
    }
}
