<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\AuthenticateZeusUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\LoginRequest;
use App\Models\ZeusSetting;
use App\Services\Zeus\TotpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Zeus/Login');
    }

    public function login(LoginRequest $request, AuthenticateZeusUser $authenticateZeusUser): RedirectResponse
    {
        $authenticated = $authenticateZeusUser->execute(
            $request->validated('username'),
            $request->validated('password')
        );

        if (! $authenticated) {
            return back()->withErrors([
                'username' => 'Invalid credentials.',
            ]);
        }

        $secret = ZeusSetting::get('google2fa_secret');
        if (! empty($secret)) {
            $request->session()->put('zeus_pending_login', true);

            return redirect()->route('zeus.login.2fa');
        }

        $request->session()->put(config('zeus.session_key'), true);
        $request->session()->regenerate();

        return redirect()->route('zeus.dashboard');
    }

    public function showLogin2FA(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->get('zeus_pending_login')) {
            return redirect()->route('zeus.login');
        }

        return Inertia::render('Zeus/Login2FA');
    }

    public function login2FASubmit(Request $request, TotpService $totp): RedirectResponse
    {
        if (! $request->session()->get('zeus_pending_login')) {
            return redirect()->route('zeus.login');
        }

        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $secret = ZeusSetting::get('google2fa_secret');
        if (! $secret || ! $totp->verify($secret, $request->code)) {
            return back()->withErrors([
                'code' => 'Invalid authenticator verification code.',
            ]);
        }

        $request->session()->forget('zeus_pending_login');
        $request->session()->put(config('zeus.session_key'), true);
        $request->session()->regenerate();

        return redirect()->route('zeus.dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget(config('zeus.session_key'));
        $request->session()->regenerate();

        return redirect()->route('zeus.login');
    }
}
