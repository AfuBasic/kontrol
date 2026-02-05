<?php

namespace App\Channels;

use App\Services\Telegram\TelegramBotService;
use Illuminate\Notifications\Notification;

class TelegramChannel
{
    public function __construct(
        protected TelegramBotService $telegram
    ) {}

    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $chatId = $notifiable->routeNotificationFor('telegram', $notification);

        if (! $chatId) {
            return;
        }

        if (! method_exists($notification, 'toTelegram')) {
            return;
        }

        $message = $notification->toTelegram($notifiable);

        if (! $message) {
            return;
        }

        $this->telegram->sendMessage(
            chatId: $chatId,
            text: $message['text'],
            keyboard: $message['keyboard'] ?? null
        );
    }
}
