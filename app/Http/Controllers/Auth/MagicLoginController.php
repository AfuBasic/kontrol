<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\EstablishDeviceTrust;
use App\Http\Controllers\Controller;
use App\Models\MagicLoginToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        DB::table('estate_users_membership')
            ->where('user_id', $magicToken->user->id)
            ->where('status', 'pending')
            ->update(['status' => 'accepted']);

        if (is_null($magicToken->user->email_verified_at)) {
            $magicToken->user->markEmailAsVerified();
        }

        if ($magicToken->assignment_id) {
            $request->session()->put('active_context_assignment_id', $magicToken->assignment_id);
        }

        if ($magicToken->destination_url) {
            $request->session()->put('url.intended', $magicToken->destination_url);
        }

        return app(EstablishDeviceTrust::class)->execute(
            user: $magicToken->user,
            request: $request,
            trustExplicitly: true,
            forceLogout: false,
        )->with('success', 'Successfully logged in via magic link.');
    }
}
