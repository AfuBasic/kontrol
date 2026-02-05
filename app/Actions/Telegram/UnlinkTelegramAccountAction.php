<?php

namespace App\Actions\Telegram;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UnlinkTelegramAccountAction
{
    /**
     * Unlink Telegram account from user.
     */
    public function execute(User $user): void
    {
        $oldChatId = $user->telegram_chat_id;

        $user->update(['telegram_chat_id' => null]);

        activity()
            ->performedOn($user)
            ->causedBy(Auth::user() ?? $user)
            ->withProperties(['old_telegram_chat_id' => $oldChatId])
            ->log('Unlinked Telegram account');
    }
}
