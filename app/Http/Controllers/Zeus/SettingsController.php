<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\ZeusSetting;
use App\Services\Zeus\TotpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(Request $request, TotpService $totp): Response
    {
        $secret = ZeusSetting::get('google2fa_secret');
        $isEnabled = ! empty($secret);

        $tempSecret = null;
        $qrCodeUrl = null;

        if (! $isEnabled) {
            $tempSecret = $request->session()->get('zeus_temp_2fa_secret');
            if (! $tempSecret) {
                $tempSecret = $totp->generateSecret();
                $request->session()->put('zeus_temp_2fa_secret', $tempSecret);
            }
            $username = config('zeus.username', 'zeus-admin');
            $qrCodeUrl = $totp->getQrCodeUrl($username, $tempSecret, 'Kontrol Zeus');
        }

        return Inertia::render('Zeus/Settings/Index', [
            'isEnabled' => $isEnabled,
            'qrCodeUrl' => $qrCodeUrl,
            'secret' => $tempSecret ?? $secret,
        ]);
    }

    public function enable(Request $request, TotpService $totp): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $tempSecret = $request->session()->get('zeus_temp_2fa_secret');

        if (! $tempSecret) {
            return back()->withErrors(['code' => 'Session expired. Please reload the settings page and try again.']);
        }

        if (! $totp->verify($tempSecret, $request->code)) {
            return back()->withErrors(['code' => 'Invalid authenticator code.']);
        }

        ZeusSetting::set('google2fa_secret', $tempSecret);
        $request->session()->forget('zeus_temp_2fa_secret');

        return redirect()
            ->route('zeus.settings.index')
            ->with('success', 'Two-factor authentication enabled successfully.');
    }

    public function disable(Request $request, TotpService $totp): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $secret = ZeusSetting::get('google2fa_secret');

        if (! $secret) {
            return back()->withErrors(['code' => 'Two-factor authentication is not enabled.']);
        }

        if (! $totp->verify($secret, $request->code)) {
            return back()->withErrors(['code' => 'Invalid authenticator code.']);
        }

        ZeusSetting::set('google2fa_secret', null);

        return redirect()
            ->route('zeus.settings.index')
            ->with('success', 'Two-factor authentication disabled successfully.');
    }
}
