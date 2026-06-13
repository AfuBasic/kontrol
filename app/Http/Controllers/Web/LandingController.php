<?php

namespace App\Http\Controllers\Web;

use App\Actions\Auth\DetermineUserRedirect;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * Render the public landing/home page.
     */
    public function index(): Response
    {
        return Inertia::render('Public/Home');
    }

    /**
     * Autologin from mobile app deep links.
     */
    public function autologin(Request $request, DetermineUserRedirect $determineRedirect): RedirectResponse
    {
        $token = $request->query('token');
        if (! $token) {
            return redirect()->route('login');
        }

        $userId = Cache::pull('autologin_'.$token);
        if (! $userId) {
            return redirect()->route('login')->with('error', 'Authentication link expired.');
        }

        Auth::loginUsingId($userId);
        $request->session()->regenerate();

        $redirect = $request->query('redirect');
        if ($redirect && (str_starts_with($redirect, '/') || parse_url($redirect, PHP_URL_HOST) === parse_url(config('app.url'), PHP_URL_HOST))) {
            $redirectUrl = $redirect;
        } else {
            $redirectUrl = $determineRedirect->execute(Auth::user());
        }

        return redirect()->intended($redirectUrl);
    }
}
