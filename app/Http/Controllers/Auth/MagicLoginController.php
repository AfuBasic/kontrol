<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ActivateContext;
use App\Events\ForceLogout;
use App\Http\Controllers\Controller;
use App\Models\MagicLoginToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // 3. Log the user in
        Auth::login($magicToken->user);

        // 3.5 Accept any pending estate memberships
        // This ensures that newly invited admins can access the admin dashboard
        // without being blocked by authorization checks that require an active membership.
        DB::table('estate_users_membership')
            ->where('user_id', $magicToken->user->id)
            ->where('status', 'pending')
            ->update(['status' => 'accepted']);

        if (is_null($magicToken->user->email_verified_at)) {
            $magicToken->user->markEmailAsVerified();
        }

        // 4. Regenerate session for security
        $request->session()->regenerate();
        ForceLogout::dispatchSafely($magicToken->user->id);

        // 5. Activate context and determine destination
        $defaultDestination = app(ActivateContext::class)->execute($magicToken->user);

        // If a specific destination was requested in the token, we use it only if the context was activated.
        // However, if they need to select a context, we MUST send them to context.select
        $destination = $magicToken->destination_url ?: $defaultDestination;

        if ($defaultDestination === route('context.select')) {
            $destination = $defaultDestination;
        }

        return redirect()->to($destination)
            ->with('success', 'Successfully logged in via magic link.');
    }
}
