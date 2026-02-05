<?php

namespace App\Actions\Telegram;

use App\Events\TelegramAccountLinked;
use App\Models\TelegramLinkToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LinkTelegramAccountAction
{
    /**
     * Link a Telegram account to a user via OTP.
     *
     * @return array{success: bool, user: User, message: string}
     *
     * @throws ValidationException
     */
    public function execute(string $token, string $telegramChatId): array
    {
        $result = DB::transaction(function () use ($token, $telegramChatId) {
            // Check if this Telegram account is already linked
            $existingUser = User::findByTelegramChatId($telegramChatId);
            if ($existingUser) {
                throw ValidationException::withMessages([
                    'telegram' => ['This Telegram account is already linked to another user.'],
                ]);
            }

            // Find valid token
            $linkToken = TelegramLinkToken::query()
                ->valid()
                ->where('token', $token)
                ->with('user')
                ->first();

            if (! $linkToken) {
                throw ValidationException::withMessages([
                    'token' => ['Invalid or expired OTP code.'],
                ]);
            }

            // Check if user already has Telegram linked
            if ($linkToken->user->hasTelegramLinked()) {
                throw ValidationException::withMessages([
                    'telegram' => ['Your account is already linked to a Telegram account.'],
                ]);
            }

            // Link the account
            $linkToken->user->update(['telegram_chat_id' => $telegramChatId]);
            $linkToken->markAsUsed();

            activity()
                ->performedOn($linkToken->user)
                ->causedBy($linkToken->user)
                ->withProperties(['telegram_chat_id' => $telegramChatId])
                ->log('Linked Telegram account');

            return [
                'success' => true,
                'user' => $linkToken->user->fresh(),
                'message' => 'Telegram account linked successfully!',
            ];
        });

        // Broadcast event after transaction commits
        TelegramAccountLinked::dispatch($result['user']);

        return $result;
    }
}
