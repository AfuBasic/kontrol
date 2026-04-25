<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\SendPasswordResetLink;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ForgotPasswordController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('auth/ForgotPassword');
    }

    public function store(ForgotPasswordRequest $request, SendPasswordResetLink $sendResetLink): RedirectResponse
    {
        $sendResetLink->execute($request->validated('email'));

        return back()->with('success', 'If an account exists with that email, we\'ve sent a password reset link.');
    }
}
