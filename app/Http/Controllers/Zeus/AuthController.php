<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\AuthenticateZeusUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('zeus/login');
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
