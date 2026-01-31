<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\DetermineUserRedirect;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('auth/login');
    }

    public function store(
        LoginRequest $request,
        AuthenticateUser $authenticateUser,
        DetermineUserRedirect $determineRedirect
    ): RedirectResponse {
        $user = $authenticateUser->execute(
            $request->validated('email'),
            $request->validated('password'),
            $request->boolean('remember')
        );

        $request->session()->regenerate();

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
