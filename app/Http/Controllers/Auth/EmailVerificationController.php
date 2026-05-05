<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\DetermineUserRedirect;
use App\Http\Controllers\Controller;
use App\Mail\Resident\WelcomeMail;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class EmailVerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Invalid verification link.');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('login')->with('success', 'Email already verified. Please login.');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // Check the user's estate membership status
        $membership = $user->estates()->first();
        $status = $membership?->pivot?->status ?? 'pending';

        if ($status === 'accepted') {
            Auth::login($user);

            // Send Welcome Email only to residents
            if ($user->user_type === 'user') {
                Mail::to($user->email)->send(new WelcomeMail($user));
            }

            $redirectAction = new DetermineUserRedirect;
            $redirectUrl = $redirectAction->execute($user);

            return redirect($redirectUrl)->with('success', 'Email verified successfully! Welcome to the platform.');
        }

        return redirect()->route('login')->with('success', 'Email verified successfully! Your account is pending admin approval. Please contact your estate admin for estate access approval.');
    }
}
