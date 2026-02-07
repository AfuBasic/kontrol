<?php

namespace App\Services\Telegram;

use App\Actions\Telegram\LinkTelegramAccountAction;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

use function Sentry\captureException;

class TelegramMessageHandler
{
    public function __construct(
        protected TelegramBotService $telegram,
        protected TelegramKeyboardBuilder $keyboard,
        protected LinkTelegramAccountAction $linkAction,
    ) {}

    /**
     * Handle incoming message.
     *
     * @param  array<string, mixed>  $message
     */
    public function handle(array $message): void
    {
        $chatId = (string) $message['chat']['id'];
        $text = trim($message['text'] ?? '');
        $firstName = $message['from']['first_name'] ?? 'there';

        $user = User::findByTelegramChatId($chatId);

        if ($user) {
            $this->handleLinkedUser($chatId, $user);
        } else {
            $this->handleUnlinkedUser($chatId, $text, $firstName);
        }
    }

    /**
     * Handle message from a linked user - show main menu.
     */
    private function handleLinkedUser(string $chatId, User $user): void
    {
        $estateName = 'your estate';
        try {
            $estate = $user->getCurrentEstate();
            $estateName = $estate->name;
        } catch (ModelNotFoundException) {
            // User has no accepted estate yet
        }

        $this->sendMainMenu($chatId, $user, $estateName);
    }

    /**
     * Handle message from an unlinked user.
     */
    private function handleUnlinkedUser(string $chatId, string $text, string $firstName): void
    {
        // Check if text is OTP (6 digits)
        if (preg_match('/^\d{6}$/', $text)) {
            $this->attemptLinkAccount($chatId, $text);

            return;
        }

        $this->sendWelcomeMessage($chatId, $firstName);
    }

    /**
     * Attempt to link account using OTP.
     */
    private function attemptLinkAccount(string $chatId, string $otp): void
    {
        try {
            $result = $this->linkAction->execute($otp, $chatId);
            $user = $result['user'];

            // Get estate name safely
            $estateName = 'your estate';
            try {
                $estate = $user->getCurrentEstate();
                $estateName = $estate->name;
            } catch (ModelNotFoundException) {
                // User has no accepted estate yet, use default message
            }

            $text = "✅ <b>Account Linked Successfully!</b>\n\n";
            $text .= "Welcome, <b>{$user->name}</b>!\n";
            $text .= "You're connected to <b>{$estateName}</b>.";

            $this->telegram->sendMessage($chatId, $text, $this->keyboard->mainMenu());
        } catch (ValidationException $e) {
            $errors = collect($e->errors())->flatten()->first();
            $this->telegram->sendMessage(
                $chatId,
                "❌ <b>Link Failed</b>\n\n{$errors}",
                $this->keyboard->unlinkMenu()
            );
        } catch (\Throwable $e) {
            // Log locally and send to Sentry
            Log::error('Telegram link account error', [
                'chat_id' => $chatId,
                'error' => $e->getMessage(),
            ]);
            captureException($e);

            $this->telegram->sendMessage(
                $chatId,
                "❌ <b>Something went wrong</b>\n\nPlease try again or contact support.",
                $this->keyboard->unlinkMenu()
            );
        }
    }

    /**
     * Send welcome message to unlinked user.
     */
    private function sendWelcomeMessage(string $chatId, string $firstName): void
    {
        $text = "👋 <b>Welcome to Kontrol, {$firstName}!</b>\n\n";
        $text .= "To get started, link your account:\n\n";
        $text .= "1️. Open the Kontrol web app\n";
        $text .= "2️. Go to Profile → Telegram\n";
        $text .= "3️. Click \"Connect\"\n";
        $text .= "4️. Copy your 6-digit code\n\n";
        $text .= "tap the button below to start linking.\n\n";
        $text .= 'Paste the 6 digit code to complete linking';

        $this->telegram->sendMessage($chatId, $text, $this->keyboard->unlinkMenu());
    }

    /**
     * Send main menu to linked user.
     */
    private function sendMainMenu(string $chatId, User $user, string $estateName): void
    {
        $text = "🏠 <b>{$estateName}</b>\n\n";
        $text .= "Hello, <b>{$user->name}</b>! 👋\n\n";
        $text .= 'What would you like to do?';

        $this->telegram->sendMessage($chatId, $text, $this->keyboard->mainMenu());
    }
}
