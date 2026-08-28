<?php

namespace App\Http\Controllers\Web;

use App\Actions\Public\StoreEstateApplicationAction;
use App\Events\ForceLogout;
use App\Http\Controllers\Controller;
use App\Mail\SupportRequestMail;
use App\Models\EstateApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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
     * Handle the public estate application form submission.
     */
    public function apply(Request $request, StoreEstateApplicationAction $storeApplication)
    {
        // Accept both legacy camelCase keys and snake_case from the unified form.
        $payload = [
            'source' => EstateApplication::SOURCE_PUBLIC,
            'estate_name' => $request->input('estate_name', $request->input('estateName')),
            'contact_name' => $request->input('contact_name', $request->input('contactName')),
            'email' => $request->input('email', $request->input('contactEmail')),
            'phone' => $request->input('phone', $request->input('contactPhone')),
            'address' => $request->input('address', $request->input('estateLocation')),
            'state' => $request->input('state'),
            'lga' => $request->input('lga'),
            'number_of_houses' => $request->input('number_of_houses'),
            'notes' => $request->input('notes'),
        ];

        $application = $storeApplication->execute($payload);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'status' => 'success',
                'message' => 'Application received successfully!',
                'application' => $application,
            ]);
        }

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
            if ($request->header('X-Inertia')) {
                return Inertia::location($url);
            }

            return redirect($url);
        } elseif (stripos($userAgent, 'iphone') !== false || stripos($userAgent, 'ipad') !== false) {
            // iOS redirect
            $url = 'https://apps.apple.com/ng/app/access-kontrol/id6772562083';
            if ($request->header('X-Inertia')) {
                return Inertia::location($url);
            }

            return redirect($url);
        }

        $token = null;
        if (auth()->check()) {
            $token = Str::random(40);
            Cache::put('autologin_'.$token, auth()->id(), now()->addMinutes(5));
        }

        return Inertia::render('Public/DownloadApp', [
            'autologinToken' => $token,
        ]);
    }

    /**
     * Autologin from mobile app deep links.
     */
    public function autologin(Request $request)
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
        ForceLogout::dispatchSafely($userId);

        $redirect = $request->query('redirect');
        if ($redirect && (str_starts_with($redirect, '/') || parse_url($redirect, PHP_URL_HOST) === parse_url(config('app.url'), PHP_URL_HOST))) {
            $redirectUrl = $redirect;
        } else {
            $redirectUrl = route('context.select');
        }

        return redirect()->intended($redirectUrl);
    }
}
