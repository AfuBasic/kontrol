<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\GenerateLoginOtp;
use App\Actions\Auth\VerifyLoginOtp;
use App\Events\ForceLogout;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\VerifyLoginOtpRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        AuthenticateUser $authenticateUser
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
            return back()->withErrors(['code' => 'The verification code is invalid or has expired.']);
        }

        // Re-check suspension / activation in case status changed after OTP was issued.
        $authenticateUser->ensureCanLogin($user->fresh() ?? $user);

        $remember = $request->session()->get('otp_remember', false);
        $viaSocial = $request->session()->get('otp_via_social', false);

        $request->session()->forget(['otp_user_id', 'otp_remember', 'otp_via_social']);

        Auth::login($user, $remember);
        $request->session()->regenerate();

        ForceLogout::dispatchSafely($user->id);

        $this->storePasswordHashInSession($user);

        $authenticateUser->logActivity($user);

        $action = app(\App\Actions\Auth\ActivateContext::class);
        return redirect()->intended($action->execute($user));
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

    /**
     * Store password hash in session for AuthenticateSession middleware (social login).
     */
    private function storePasswordHashInSession(User $user): void
    {
        session(['password_hash_web' => $user->getAuthPassword()]);
    }
}
