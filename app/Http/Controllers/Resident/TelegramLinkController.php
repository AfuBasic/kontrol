<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Telegram\GenerateTelegramOtpAction;
use App\Actions\Telegram\UnlinkTelegramAccountAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class TelegramLinkController extends Controller
{
    /**
     * Generate an OTP for linking Telegram account.
     */
    public function generateOtp(GenerateTelegramOtpAction $action): JsonResponse
    {
        $user = Auth::user();

        if ($user->hasTelegramLinked()) {
            return response()->json([
                'error' => 'Telegram account is already linked.',
            ], 422);
        }

        $result = $action->execute($user);

        return response()->json([
            'otp' => $result['token'],
            'expires_at' => $result['expires_at'],
            'bot_username' => config('services.telegram.bot_username'),
        ]);
    }

    /**
     * Unlink the current Telegram account.
     */
    public function unlink(UnlinkTelegramAccountAction $action): RedirectResponse
    {
        $user = Auth::user();

        if (! $user->hasTelegramLinked()) {
            return back()->with('error', 'No Telegram account is linked.');
        }

        $action->execute($user);

        return back()->with('success', 'Telegram account unlinked successfully.');
    }

    /**
     * Get the current Telegram link status.
     */
    public function status(): JsonResponse
    {
        $user = Auth::user();

        return response()->json([
            'linked' => $user->hasTelegramLinked(),
            'bot_username' => config('services.telegram.bot_username'),
        ]);
    }
}
