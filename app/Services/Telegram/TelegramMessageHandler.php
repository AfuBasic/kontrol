<?php

namespace App\Services\Telegram;

use App\Actions\Telegram\LinkTelegramAccountAction;
use App\Models\User;
use Illuminate\Validation\ValidationException;

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
        $estate = $user->getCurrentEstate();
        $this->sendMainMenu($chatId, $user, $estate->name);
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
            $estate = $user->getCurrentEstate();

            $text = "✅ <b>Account Linked Successfully!</b>\n\n";
            $text .= "Welcome, <b>{$user->name}</b>!\n";
            $text .= "You're connected to <b>{$estate->name}</b>.";

            $this->telegram->sendMessage($chatId, $text, $this->keyboard->mainMenu());
        } catch (ValidationException $e) {
            $errors = collect($e->errors())->flatten()->first();
            $this->telegram->sendMessage(
                $chatId,
                "❌ <b>Link Failed</b>\n\n{$errors}",
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
        $text .= "1️⃣ Open the Kontrol web app\n";
        $text .= "2️⃣ Go to Profile → Telegram\n";
        $text .= "3️⃣ Click \"Link Telegram\"\n";
        $text .= "4️⃣ Enter the 6-digit code here\n\n";
        $text .= 'Or tap the button below to start linking.';

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
