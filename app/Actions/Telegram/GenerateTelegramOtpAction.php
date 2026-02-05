<?php

namespace App\Actions\Telegram;

use App\Models\TelegramLinkToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GenerateTelegramOtpAction
{
    /**
     * Generate a new OTP for linking Telegram account.
     *
     * @return array{token: string, expires_at: string}
     */
    public function execute(User $user): array
    {
        return DB::transaction(function () use ($user) {
            // Invalidate any existing valid tokens for this user
            TelegramLinkToken::query()
                ->forUser($user->id)
                ->valid()
                ->update(['used_at' => now()]);

            // Create new token
            $token = TelegramLinkToken::create([
                'user_id' => $user->id,
                'token' => TelegramLinkToken::generateToken(),
                'expires_at' => now()->addMinutes(10),
            ]);

            activity()
                ->performedOn($user)
                ->causedBy($user)
                ->log('Generated Telegram link OTP');

            return [
                'token' => $token->token,
                'expires_at' => $token->expires_at->toIso8601String(),
            ];
        });
    }
}
