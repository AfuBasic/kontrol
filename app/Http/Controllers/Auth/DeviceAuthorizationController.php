<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ApproveDeviceAuthorization;
use App\Actions\Auth\ConsumeDeviceAuthorization;
use App\Actions\Auth\DenyDeviceAuthorization;
use App\Actions\Auth\StartDeviceAuthorization;
use App\Http\Controllers\Controller;
use App\Models\DeviceAuthorizationRequest;
use App\Services\Security\PendingDeviceAuthorizationCookie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class DeviceAuthorizationController extends Controller
{
    public function __construct(
        private PendingDeviceAuthorizationCookie $pendingCookie,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $authorization = $this->pendingAuthorization($request);

        if (! $authorization) {
            return redirect()->route('login');
        }

        if ($authorization->isApproved()) {
            return Inertia::render('Auth/VerifyDevice', [
                'email' => $this->maskEmail($authorization->user->email),
                'status' => 'approved',
                'displayName' => $authorization->display_name,
            ]);
        }

        if ($authorization->isDenied()) {
            return Inertia::render('Auth/DeviceDenied');
        }

        if ($authorization->isExpired()) {
            return Inertia::render('Auth/DeviceExpired');
        }

        return Inertia::render('Auth/VerifyDevice', [
            'email' => $this->maskEmail($authorization->user->email),
            'status' => $authorization->status->value,
            'displayName' => $authorization->display_name,
        ]);
    }

    public function status(Request $request): JsonResponse|RedirectResponse
    {
        $authorization = $this->pendingAuthorization($request);

        if (! $authorization) {
            return response()->json(['status' => 'missing']);
        }

        $status = $authorization->isExpired() ? 'expired' : $authorization->status->value;

        return response()->json(['status' => $status]);
    }

    public function continue(Request $request, ConsumeDeviceAuthorization $consume): RedirectResponse
    {
        $authorization = $this->pendingAuthorization($request);

        if (! $authorization) {
            return redirect()->route('login');
        }

        try {
            return $consume->execute($request, $authorization);
        } catch (RuntimeException $e) {
            return $this->mapContinuationFailure($e->getMessage());
        }
    }

    public function resend(Request $request, StartDeviceAuthorization $start): RedirectResponse
    {
        $authorization = $this->pendingAuthorization($request);

        if (! $authorization) {
            return redirect()->route('login');
        }

        if (! $authorization->isPending()) {
            return back();
        }

        $key = 'device-authorization-resend:'.$authorization->user_id;
        $maxAttempts = (int) config('device-trust.resend_per_hour');

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return back()->withErrors([
                'email' => 'Please wait before requesting another verification email.',
            ]);
        }

        RateLimiter::hit($key, 3600);
        $start->resend($authorization);

        return back()->with('status', 'A new verification email has been sent.');
    }

    public function abort(Request $request): RedirectResponse
    {
        $request->session()->forget('device_authorization_id');
        $this->pendingCookie->clear();

        return redirect()->route('login');
    }

    public function approve(
        Request $request,
        DeviceAuthorizationRequest $authorization,
        ApproveDeviceAuthorization $approve,
        ConsumeDeviceAuthorization $consume,
    ): Response|RedirectResponse {
        try {
            $authorization = $approve->execute($authorization);
        } catch (RuntimeException $e) {
            return $this->renderLinkOutcome($e->getMessage());
        }

        if ((int) $request->session()->get('device_authorization_id') === $authorization->id) {
            try {
                return $consume->execute($request, $authorization);
            } catch (RuntimeException $e) {
                return $this->mapContinuationFailure($e->getMessage());
            }
        }

        return Inertia::render('Auth/DeviceApproved', [
            'displayName' => $authorization->display_name,
            'canContinue' => false,
        ]);
    }

    public function deny(
        DeviceAuthorizationRequest $authorization,
        DenyDeviceAuthorization $deny,
    ): Response {
        try {
            $authorization = $deny->execute($authorization);
        } catch (RuntimeException $e) {
            return $this->renderLinkOutcome($e->getMessage());
        }

        return Inertia::render('Auth/DeviceDenied', [
            'displayName' => $authorization->display_name,
        ]);
    }

    private function pendingAuthorization(Request $request): ?DeviceAuthorizationRequest
    {
        $id = $request->session()->get('device_authorization_id');

        if ($id) {
            $authorization = DeviceAuthorizationRequest::query()
                ->with('user')
                ->find($id);

            if ($authorization) {
                if ($authorization->isDenied() || $authorization->isExpired() || $authorization->isConsumed()) {
                    $this->pendingCookie->clear();
                }

                return $authorization;
            }
        }

        $ulid = $this->pendingCookie->read($request);

        if (! $ulid) {
            return null;
        }

        $authorization = DeviceAuthorizationRequest::query()
            ->with('user')
            ->where('ulid', $ulid)
            ->first();

        if (! $authorization) {
            $this->pendingCookie->clear();

            return null;
        }

        if ($authorization->isConsumed()) {
            $this->pendingCookie->clear();

            return null;
        }

        if ($authorization->isDenied() || $authorization->isExpired()) {
            $this->pendingCookie->clear();

            return $authorization;
        }

        $request->session()->put('device_authorization_id', $authorization->id);

        return $authorization;
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email);
        $visible = Str::substr($local, 0, 2);
        $masked = $visible.str_repeat('•', max(mb_strlen($local) - 2, 2));

        return $masked.'@'.$domain;
    }

    private function renderLinkOutcome(string $code): Response
    {
        return match ($code) {
            'expired' => Inertia::render('Auth/DeviceLinkInvalid', ['reason' => 'expired']),
            'denied' => Inertia::render('Auth/DeviceDenied'),
            'completed' => Inertia::render('Auth/DeviceLinkInvalid', ['reason' => 'completed']),
            default => Inertia::render('Auth/DeviceLinkInvalid', ['reason' => 'invalid']),
        };
    }

    private function mapContinuationFailure(string $code): RedirectResponse|Response
    {
        return match ($code) {
            'denied' => Inertia::render('Auth/DeviceDenied'),
            'expired' => Inertia::render('Auth/DeviceExpired'),
            'completed' => redirect()->route('login'),
            'pending' => redirect()->route('login.device.show'),
            default => redirect()->route('login.device.show')->with('error', 'Please approve this device from the email we sent, then continue on this screen.'),
        };
    }
}
