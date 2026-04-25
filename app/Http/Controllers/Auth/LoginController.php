<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\CheckTrustedDevice;
use App\Actions\Auth\DetermineUserRedirect;
use App\Actions\Auth\GenerateLoginOtp;
use App\Events\ForceLogout;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('auth/Login');
    }

    public function store(
        LoginRequest $request,
        AuthenticateUser $authenticateUser,
        CheckTrustedDevice $checkTrustedDevice,
        GenerateLoginOtp $generateOtp,
        DetermineUserRedirect $determineRedirect,
    ): RedirectResponse {
        $user = $authenticateUser->validate(
            $request->validated('email'),
            $request->validated('password'),
        );

        // Block unverified residents
        if ($user->hasRole('resident') && ! $user->hasVerifiedEmail()) {
            return back()->withErrors([
                'email' => 'Your email address is not verified. Please check your inbox for the verification link.',
            ]);
        }

        if (! $checkTrustedDevice->execute($user, $request)) {
            $request->session()->put([
                'otp_user_id' => $user->id,
                'otp_remember' => $request->boolean('remember'),
                'otp_password' => Crypt::encryptString($request->validated('password')),
            ]);

            $generateOtp->execute($user, $request);

            return redirect()->route('login.otp.show');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        broadcast(new ForceLogout($user->id));
        Auth::logoutOtherDevices($request->validated('password'));

        $authenticateUser->logActivity($user);

        $redirectUrl = $determineRedirect->execute($user);

        return redirect()->intended($redirectUrl);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
