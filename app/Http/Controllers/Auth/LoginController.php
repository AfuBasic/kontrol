<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\GenerateLoginOtp;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Security\CheckpointClaimService;
use App\Services\Security\PendingDeviceAuthorizationCookie;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function show(Request $request, PendingDeviceAuthorizationCookie $pendingCookie): Response|RedirectResponse
    {
        if ($request->session()->has('device_authorization_id') || $pendingCookie->read($request) !== null) {
            return redirect()->route('login.device.show');
        }

        return Inertia::render('Auth/Login');
    }

    public function store(
        LoginRequest $request,
        AuthenticateUser $authenticateUser,
        GenerateLoginOtp $generateOtp,
    ): RedirectResponse {
        $user = $authenticateUser->validate(
            $request->validated('email')
        );

        $request->session()->put([
            'otp_user_id' => $user->id,
            'otp_remember' => $request->boolean('remember'),
        ]);

        $generateOtp->execute($user, $request);

        return redirect()->route('login.otp.show');
    }

    public function destroy(Request $request): RedirectResponse
    {
        if ($user = Auth::user()) {
            app(CheckpointClaimService::class)->releaseUserCheckpoints($user);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
