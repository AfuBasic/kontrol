<?php

namespace App\Services\Telegram;

use App\Enums\TelegramCallbackAction;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class TelegramCallbackHandler
{
    public function __construct(
        protected TelegramBotService $telegram,
        protected TelegramKeyboardBuilder $keyboard,
        protected TelegramAccessCodeService $accessCodeService,
    ) {}

    /**
     * Handle callback query from inline keyboard.
     *
     * @param  array<string, mixed>  $callback
     */
    public function handle(array $callback): void
    {
        $callbackId = $callback['id'];
        $chatId = (string) $callback['message']['chat']['id'];
        $messageId = (int) $callback['message']['message_id'];
        $data = $callback['data'] ?? '';

        [$action, $param] = array_pad(explode(':', $data, 2), 2, null);

        $this->telegram->answerCallbackQuery($callbackId);

        $user = User::findByTelegramChatId($chatId);

        if (! $user && $action !== TelegramCallbackAction::LinkAccount->value) {
            $this->telegram->editMessage(
                $chatId,
                $messageId,
                "⚠️ Your account is not linked.\n\nPlease link your account first.",
                $this->keyboard->unlinkMenu()
            );

            return;
        }

        match ($action) {
            TelegramCallbackAction::LinkAccount->value => $this->handleLinkAccount($chatId, $messageId),
            TelegramCallbackAction::MainMenu->value => $this->handleMainMenu($chatId, $messageId, $user),
            TelegramCallbackAction::GenerateCode->value => $this->handleGenerateCode($chatId, $messageId, $user),
            TelegramCallbackAction::SelectDuration->value => $this->handleSelectDuration($chatId, $messageId, $user, (int) $param),
            TelegramCallbackAction::ViewCodes->value => $this->handleViewCodes($chatId, $messageId, $user),
            TelegramCallbackAction::RevokeCode->value => $this->handleRevokeCode($chatId, $messageId, $user, (int) $param),
            TelegramCallbackAction::ConfirmRevoke->value => $this->handleConfirmRevoke($chatId, $messageId, $user, (int) $param),
            TelegramCallbackAction::EstateInfo->value => $this->handleEstateInfo($chatId, $messageId, $user),
            default => $this->handleMainMenu($chatId, $messageId, $user),
        };
    }

    /**
     * Handle link account button - show instructions.
     */
    private function handleLinkAccount(string $chatId, int $messageId): void
    {
        $text = "🔗 <b>Link Your Account</b>\n\n";
        $text .= "To link your Kontrol account:\n\n";
        $text .= "1️⃣ Open the Kontrol web app\n";
        $text .= "2️⃣ Go to Profile → Telegram\n";
        $text .= "3️⃣ Click \"Connect\"\n";
        $text .= "4️⃣ Copy the 6-digit code\n";
        $text .= "5️⃣ Paste the code here\n\n";
        $text .= '💡 <i>The code expires in 10 minutes.</i>';

        $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->unlinkMenu());
    }

    /**
     * Handle main menu button.
     */
    private function handleMainMenu(string $chatId, int $messageId, User $user): void
    {
        $estate = $user->resolveHeadlessEstate();

        $text = "🏠 <b>{$estate->name}</b>\n\n";
        $text .= "Hello, <b>{$user->name}</b>! 👋\n\n";
        $text .= 'What would you like to do?';

        $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->mainMenu());
    }

    /**
     * Handle generate code button - show duration options.
     */
    private function handleGenerateCode(string $chatId, int $messageId, User $user): void
    {
        $estate = $user->resolveHeadlessEstate();
        $options = $this->accessCodeService->getDurationOptions($estate);

        $text = "🎟️ <b>Generate Access Code</b>\n\n";
        $text .= 'How long should the code be valid?';

        $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->durationOptions($options));
    }

    /**
     * Handle duration selection - create code.
     */
    private function handleSelectDuration(string $chatId, int $messageId, User $user, int $minutes): void
    {
        $estate = $user->resolveHeadlessEstate();

        try {
            $code = $this->accessCodeService->createCode($user, $estate, [
                'duration_minutes' => $minutes,
            ]);

            $expiresIn = $this->formatTimeRemaining($minutes);

            $text = "✅ <b>Code Created!</b>\n\n";
            $text .= "🔐 Code: <code>{$code->code}</code>\n";
            $text .= "⏱️ Expires: {$expiresIn}\n";
            $text .= "🔒 Single use: Yes\n\n";
            $text .= '💡 <i>Tap "Copy Code" below to copy</i>';

            $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->afterCodeCreated($code->code));
        } catch (ValidationException $e) {
            $errors = collect($e->errors())->flatten()->first();

            $text = "❌ <b>Could Not Create Code</b>\n\n";
            $text .= $errors;

            $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->backToMenu());
        }
    }

    /**
     * Handle view codes button - show active codes.
     */
    private function handleViewCodes(string $chatId, int $messageId, User $user): void
    {
        $estate = $user->resolveHeadlessEstate();
        $codes = $this->accessCodeService->getActiveCodes($user, $estate);

        if ($codes->isEmpty()) {
            $text = "📋 <b>Your Active Codes</b>\n\n";
            $text .= "You don't have any active codes.\n\n";
            $text .= 'Tap the button below to create one!';

            $keyboard = [
                [
                    ['text' => '🎟️ Generate Code', 'callback_data' => TelegramCallbackAction::GenerateCode->value],
                ],
                [
                    ['text' => '« Back to Menu', 'callback_data' => TelegramCallbackAction::MainMenu->value],
                ],
            ];

            $this->telegram->editMessage($chatId, $messageId, $text, $keyboard);

            return;
        }

        $text = "📋 <b>Your Active Codes</b>\n\n";
        $text .= "Tap a code to revoke it:\n";

        $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->activeCodesList($codes));
    }

    /**
     * Handle revoke code button - show confirmation.
     */
    private function handleRevokeCode(string $chatId, int $messageId, User $user, int $codeId): void
    {
        $estate = $user->resolveHeadlessEstate();
        $code = $this->accessCodeService->getCode($user, $estate, $codeId);

        if (! $code) {
            $this->handleViewCodes($chatId, $messageId, $user);

            return;
        }

        $visitorInfo = $code->visitor_name ? " for <b>{$code->visitor_name}</b>" : '';

        $text = "⚠️ <b>Revoke Code?</b>\n\n";
        $text .= "Code: <code>{$code->code}</code>{$visitorInfo}\n\n";
        $text .= 'This visitor will no longer be able to enter.';

        $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->revokeConfirmation($codeId));
    }

    /**
     * Handle confirm revoke button - revoke the code.
     */
    private function handleConfirmRevoke(string $chatId, int $messageId, User $user, int $codeId): void
    {
        $estate = $user->resolveHeadlessEstate();
        $success = $this->accessCodeService->revokeCode($user, $estate, $codeId);

        if ($success) {
            $text = "🚫 <b>Code Revoked</b>\n\n";
            $text .= 'The access code has been revoked successfully.';
        } else {
            $text = "❌ <b>Could Not Revoke</b>\n\n";
            $text .= 'The code may have already been used or expired.';
        }

        $keyboard = [
            [
                ['text' => '📋 View My Codes', 'callback_data' => TelegramCallbackAction::ViewCodes->value],
            ],
            [
                ['text' => '« Back to Menu', 'callback_data' => TelegramCallbackAction::MainMenu->value],
            ],
        ];

        $this->telegram->editMessage($chatId, $messageId, $text, $keyboard);
    }

    /**
     * Handle estate info button - show estate details.
     */
    private function handleEstateInfo(string $chatId, int $messageId, User $user): void
    {
        $estate = $user->resolveHeadlessEstate();
        $profile = $user->profile;

        $text = "🏠 <b>{$estate->name}</b>\n\n";

        if ($estate->address) {
            $text .= "📍 {$estate->address}\n\n";
        }

        $text .= "<b>Your Details:</b>\n";
        $text .= "👤 {$user->name}\n";
        $text .= "📧 {$user->email}\n";

        if ($profile?->unit_number) {
            $text .= "🏢 Unit: {$profile->unit_number}\n";
        }

        if ($profile?->phone) {
            $text .= "📱 {$profile->phone}\n";
        }

        $this->telegram->editMessage($chatId, $messageId, $text, $this->keyboard->backToMenu());
    }

    /**
     * Format time remaining in human-readable form.
     */
    private function formatTimeRemaining(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes} minutes";
        }

        $hours = floor($minutes / 60);
        if ($hours < 24) {
            return $hours === 1 ? '1 hour' : "{$hours} hours";
        }

        $days = floor($hours / 24);

        return $days === 1 ? '1 day' : "{$days} days";
    }
}
