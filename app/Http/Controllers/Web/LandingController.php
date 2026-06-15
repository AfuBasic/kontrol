<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Mail\EstateApplicationAcknowledgmentMail;
use App\Mail\EstateApplicationMail;
use App\Mail\SupportRequestMail;
use App\Models\EstateApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
     * Handle the support form submission.
     */
    public function support(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|min:10|max:5000',
        ]);

        Mail::to('support@usekontrol.com')
            ->send(new SupportRequestMail($validated));

        return back()->with('success', 'Thanks for reaching out! We will get back to you soon.');
    }

    /**
     * Handle the application form submission.
     */
    public function apply(Request $request)
    {
        $validated = $request->validate([
            'estateName' => 'required|string|max:255',
            'estateLocation' => 'required|string|max:255',
            'contactName' => 'required|string|max:255',
            'contactEmail' => 'required|email|max:255|unique:estate_applications,email|unique:estates,email|unique:users,email',
            'contactPhone' => 'nullable|string|max:20|unique:estate_applications,phone',
        ], [
            'contactEmail.unique' => "Application Error. Your application couldn't be processed at this time.",
            'contactPhone.unique' => "Application Error. Your application couldn't be processed at this time.",
        ]);

        $application = EstateApplication::create([
            'estate_name' => $validated['estateName'],
            'address' => $validated['estateLocation'],
            'email' => $validated['contactEmail'],
            'phone' => $validated['contactPhone'] ?? '',
            'notes' => 'Contact Name: ' . $validated['contactName'],
            'status' => 'received',
        ]);

        Mail::to('afutunde@gmail.com')
            ->send(new EstateApplicationMail($application));

        Mail::to($validated['contactEmail'])
            ->send(new EstateApplicationAcknowledgmentMail($application));

        return back()->with('success', 'Application received successfully!');
    }

    /**
     * Render the public app download page or redirect mobile devices to stores.
     */
    public function downloadApp(Request $request)
    {
        $userAgent = $request->header('User-Agent');

        if (stripos($userAgent, 'android') !== false) {
            // Android redirect (Update with real Play Store URL when available)
            $url = 'https://play.google.com/store/apps/details?id=com.usekontrol.app';
            if ($request->header('X-Inertia')) return Inertia::location($url);
            return redirect($url);
        } elseif (stripos($userAgent, 'iphone') !== false || stripos($userAgent, 'ipad') !== false) {
            // iOS redirect
            $url = 'https://apps.apple.com/ng/app/access-kontrol/id6772562083';
            if ($request->header('X-Inertia')) return Inertia::location($url);
            return redirect($url);
        }

        $token = null;
        if (auth()->check()) {
            $token = \Illuminate\Support\Str::random(40);
            \Illuminate\Support\Facades\Cache::put('autologin_'.$token, auth()->id(), now()->addMinutes(5));
        }

        return Inertia::render('Public/DownloadApp', [
            'autologinToken' => $token,
        ]);
    }

    /**
     * Autologin from mobile app deep links.
     */
    public function autologin(Request $request, \App\Actions\Auth\DetermineUserRedirect $determineRedirect)
    {
        $token = $request->query('token');
        if (! $token) {
            return redirect()->route('login');
        }

        $userId = \Illuminate\Support\Facades\Cache::pull('autologin_'.$token);
        if (! $userId) {
            return redirect()->route('login')->with('error', 'Authentication link expired.');
        }

        \Illuminate\Support\Facades\Auth::loginUsingId($userId);
        $request->session()->regenerate();

        $redirect = $request->query('redirect');
        if ($redirect && (str_starts_with($redirect, '/') || parse_url($redirect, PHP_URL_HOST) === parse_url(config('app.url'), PHP_URL_HOST))) {
            $redirectUrl = $redirect;
        } else {
            $redirectUrl = $determineRedirect->execute(\Illuminate\Support\Facades\Auth::user());
        }

        return redirect()->intended($redirectUrl);
    }
}
