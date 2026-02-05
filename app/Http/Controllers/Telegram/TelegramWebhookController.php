<?php

namespace App\Http\Controllers\Telegram;

use App\Http\Controllers\Controller;
use App\Services\Telegram\TelegramCallbackHandler;
use App\Services\Telegram\TelegramMessageHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use function Sentry\captureException;

class TelegramWebhookController extends Controller
{
    public function __construct(
        protected TelegramMessageHandler $messageHandler,
        protected TelegramCallbackHandler $callbackHandler,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        // Verify webhook secret
        $secret = $request->header('X-Telegram-Bot-Api-Secret-Token');
        if ($secret !== config('services.telegram.webhook_secret')) {
            Log::warning('Telegram webhook: Invalid secret token');

            return response()->json(['ok' => false], 401);
        }

        $update = $request->all();

        try {
            if (isset($update['message'])) {
                $this->messageHandler->handle($update['message']);
            } elseif (isset($update['callback_query'])) {
                $this->callbackHandler->handle($update['callback_query']);
            }
        } catch (\Throwable $e) {
            Log::error('Telegram webhook error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            captureException($e);
        }

        return response()->json(['ok' => true]);
    }
}
