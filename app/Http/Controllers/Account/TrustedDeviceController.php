<?php

namespace App\Http\Controllers\Account;

use App\Actions\Auth\RevokeTrustedDevice;
use App\Http\Controllers\Controller;
use App\Models\TrustedDevice;
use App\Services\Security\CheckpointClaimService;
use App\Services\Security\DeviceTrustCookie;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TrustedDeviceController extends Controller
{
    public function index(Request $request, DeviceTrustCookie $deviceTrustCookie): Response
    {
        $user = $request->user();
        $currentHash = $deviceTrustCookie->read($request);
        $currentHash = $currentHash ? $deviceTrustCookie->hash($currentHash) : null;

        $devices = $user->trustedDevices()
            ->active()
            ->latest('last_used_at')
            ->get()
            ->map(function (TrustedDevice $device) use ($currentHash): array {
                $isCurrent = $currentHash !== null && $device->isCurrent($currentHash);

                return [
                    'id' => $device->ulid,
                    'display_name' => $device->display_name ?? 'Unknown device',
                    'platform' => $device->platform,
                    'browser' => $device->browser,
                    'approximate_location' => $device->approximate_location,
                    'is_current' => $isCurrent,
                    'first_trusted_at' => $device->trusted_at?->toIso8601String(),
                    'last_used_at' => $device->last_used_at?->toIso8601String(),
                ];
            });

        return Inertia::render('Account/TrustedDevices', [
            'devices' => $devices,
        ]);
    }

    public function destroy(
        Request $request,
        TrustedDevice $device,
        RevokeTrustedDevice $revoke,
        DeviceTrustCookie $deviceTrustCookie,
    ): RedirectResponse {
        $this->authorize('delete', $device);

        $plainTextToken = $deviceTrustCookie->read($request);
        $isCurrent = $plainTextToken !== null
            && $device->isCurrent($deviceTrustCookie->hash($plainTextToken));

        $user = $request->user();
        $revoke->execute($user, $device);

        if ($isCurrent) {
            app(CheckpointClaimService::class)->releaseUserCheckpoints($user);
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('login')
                ->with('success', 'This device was removed. Please sign in again.')
                ->withCookie($deviceTrustCookie->forget());
        }

        return back()->with('success', 'Device access was removed.');
    }
}
