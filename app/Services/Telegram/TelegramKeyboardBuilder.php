<?php

namespace App\Services\Telegram;

use App\Enums\TelegramCallbackAction;
use App\Models\AccessCode;
use Illuminate\Support\Collection;

class TelegramKeyboardBuilder
{
    /**
     * Build the welcome keyboard for unlinked users.
     *
     * @return array<int, array<int, array{text: string, callback_data: string}>>
     */
    public function unlinkMenu(): array
    {
        return [
            [
                ['text' => '🔗 Link My Account', 'callback_data' => TelegramCallbackAction::LinkAccount->value],
            ],
        ];
    }

    /**
     * Build the main menu keyboard for linked users.
     *
     * @return array<int, array<int, array{text: string, callback_data: string}>>
     */
    public function mainMenu(): array
    {
        return [
            [
                ['text' => '🎟️ Generate Access Code', 'callback_data' => TelegramCallbackAction::GenerateCode->value],
            ],
            [
                ['text' => '📋 View Active Codes', 'callback_data' => TelegramCallbackAction::ViewCodes->value],
            ],
            [
                ['text' => '🏠 Estate Info', 'callback_data' => TelegramCallbackAction::EstateInfo->value],
            ],
        ];
    }

    /**
     * Build duration selection keyboard.
     *
     * @param  array<int, array{minutes: int, label: string}>  $options
     * @return array<int, array<int, array{text: string, callback_data: string}>>
     */
    public function durationOptions(array $options): array
    {
        $keyboard = [];
        $row = [];

        foreach ($options as $option) {
            $row[] = [
                'text' => $option['label'],
                'callback_data' => TelegramCallbackAction::SelectDuration->value.':'.$option['minutes'],
            ];

            if (count($row) === 2) {
                $keyboard[] = $row;
                $row = [];
            }
        }

        if (! empty($row)) {
            $keyboard[] = $row;
        }

        $keyboard[] = [
            ['text' => '« Back to Menu', 'callback_data' => TelegramCallbackAction::MainMenu->value],
        ];

        return $keyboard;
    }

    /**
     * Build active codes list keyboard.
     *
     * @param  Collection<int, AccessCode>  $codes
     * @return array<int, array<int, array{text: string, callback_data: string}>>
     */
    public function activeCodesList(Collection $codes): array
    {
        $keyboard = [];

        foreach ($codes->take(10) as $code) {
            $validity = $code->time_remaining;
            $label = $code->visitor_name
                ? "🎫 {$code->code} · {$code->visitor_name} · ⏱{$validity}"
                : "🎫 {$code->code} · ⏱{$validity}";

            $keyboard[] = [
                ['text' => $label, 'callback_data' => TelegramCallbackAction::RevokeCode->value.':'.$code->id],
            ];
        }

        $keyboard[] = [
            ['text' => '« Back to Menu', 'callback_data' => TelegramCallbackAction::MainMenu->value],
        ];

        return $keyboard;
    }

    /**
     * Build revoke confirmation keyboard.
     *
     * @return array<int, array<int, array{text: string, callback_data: string}>>
     */
    public function revokeConfirmation(int $codeId): array
    {
        return [
            [
                ['text' => '✅ Yes, Revoke', 'callback_data' => TelegramCallbackAction::ConfirmRevoke->value.':'.$codeId],
                ['text' => '❌ Cancel', 'callback_data' => TelegramCallbackAction::ViewCodes->value],
            ],
        ];
    }

    /**
     * Build back to menu only keyboard.
     *
     * @return array<int, array<int, array{text: string, callback_data: string}>>
     */
    public function backToMenu(): array
    {
        return [
            [
                ['text' => '« Back to Menu', 'callback_data' => TelegramCallbackAction::MainMenu->value],
            ],
        ];
    }

    /**
     * Build post-action keyboard with options to view codes or create new.
     *
     * @return array<int, array<int, array<string, mixed>>>
     */
    public function afterCodeCreated(string $code): array
    {
        return [
            [
                ['text' => '📋 Copy Code', 'copy_text' => ['text' => $code]],
            ],
            [
                ['text' => '📋 View My Codes', 'callback_data' => TelegramCallbackAction::ViewCodes->value],
                ['text' => '🎟️ New Code', 'callback_data' => TelegramCallbackAction::GenerateCode->value],
            ],
            [
                ['text' => '« Back to Menu', 'callback_data' => TelegramCallbackAction::MainMenu->value],
            ],
        ];
    }
}
