<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\MagicLoginToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MagicLoginController extends Controller
{
    /**
     * Handle the magic login request.
     */
    public function show(Request $request, string $token): RedirectResponse
    {
        // 1. Find and validate the token
        $magicToken = MagicLoginToken::where('token', $token)
            ->valid()
            ->first();

        if (! $magicToken) {
            return redirect()->route('login')
                ->with('error', 'The magic login link is invalid, expired, or has already been used.');
        }

        // 2. Mark as used immediately to prevent replay attacks
        $magicToken->markAsUsed();

        // 3. Log the user in
        Auth::login($magicToken->user);

        // 4. Regenerate session for security
        $request->session()->regenerate();

        // 5. Redirect to destination or default dashboard
        $destination = $magicToken->destination_url ?: route('home');

        return redirect()->to($destination)
            ->with('success', 'Successfully logged in via magic link.');
    }
}
