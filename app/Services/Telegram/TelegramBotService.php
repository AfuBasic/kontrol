<?php

namespace App\Services\Telegram;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramBotService
{
    private string $baseUrl;

    private string $token;

    public function __construct()
    {
        $this->token = config('services.telegram.bot_token');
        $this->baseUrl = "https://api.telegram.org/bot{$this->token}";
    }

    /**
     * Send a message with optional inline keyboard.
     *
     * @param  array<int, array<int, array{text: string, callback_data?: string, url?: string}>>|null  $keyboard
     */
    public function sendMessage(
        string $chatId,
        string $text,
        ?array $keyboard = null,
        string $parseMode = 'HTML'
    ): bool {
        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => $parseMode,
        ];

        if ($keyboard !== null) {
            $payload['reply_markup'] = [
                'inline_keyboard' => $keyboard,
            ];
        }

        return $this->request('sendMessage', $payload);
    }

    /**
     * Edit an existing message.
     *
     * @param  array<int, array<int, array{text: string, callback_data?: string, url?: string}>>|null  $keyboard
     */
    public function editMessage(
        string $chatId,
        int $messageId,
        string $text,
        ?array $keyboard = null,
        string $parseMode = 'HTML'
    ): bool {
        $payload = [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $text,
            'parse_mode' => $parseMode,
        ];

        if ($keyboard !== null) {
            $payload['reply_markup'] = [
                'inline_keyboard' => $keyboard,
            ];
        }

        return $this->request('editMessageText', $payload);
    }

    /**
     * Answer a callback query.
     */
    public function answerCallbackQuery(string $callbackQueryId, ?string $text = null, bool $showAlert = false): bool
    {
        $payload = [
            'callback_query_id' => $callbackQueryId,
            'show_alert' => $showAlert,
        ];

        if ($text !== null) {
            $payload['text'] = $text;
        }

        return $this->request('answerCallbackQuery', $payload);
    }

    /**
     * Set webhook URL.
     */
    public function setWebhook(string $url): bool
    {
        $payload = ['url' => $url];

        $secretToken = config('services.telegram.webhook_secret');
        if ($secretToken) {
            $payload['secret_token'] = $secretToken;
        }

        return $this->request('setWebhook', $payload);
    }

    /**
     * Delete the current webhook.
     */
    public function deleteWebhook(): bool
    {
        return $this->request('deleteWebhook', []);
    }

    /**
     * Get current webhook info.
     *
     * @return array<string, mixed>|null
     */
    public function getWebhookInfo(): ?array
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/getWebhookInfo");

            if ($response->successful() && $response->json('ok')) {
                return $response->json('result');
            }

            return null;
        } catch (\Throwable $e) {
            Log::error('Telegram API exception: getWebhookInfo', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Get bot information.
     *
     * @return array<string, mixed>|null
     */
    public function getMe(): ?array
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/getMe");

            if ($response->successful() && $response->json('ok')) {
                return $response->json('result');
            }

            return null;
        } catch (\Throwable $e) {
            Log::error('Telegram API exception: getMe', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Make a request to the Telegram API.
     *
     * @param  array<string, mixed>  $payload
     */
    private function request(string $method, array $payload): bool
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/{$method}", $payload);

            if (! $response->successful() || ! $response->json('ok')) {
                Log::error("Telegram API error: {$method}", [
                    'payload' => $payload,
                    'response' => $response->json(),
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error("Telegram API exception: {$method}", [
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function client(): PendingRequest
    {
        return Http::timeout(30)->retry(2, 100);
    }
}
