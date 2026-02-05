<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramBotService;
use Illuminate\Console\Command;

class SetupTelegramWebhook extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:webhook
                            {--remove : Remove the webhook instead of setting it}
                            {--info : Show current webhook info}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up the Telegram bot webhook for receiving updates';

    public function __construct(
        protected TelegramBotService $telegram
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('info')) {
            return $this->showWebhookInfo();
        }

        if ($this->option('remove')) {
            return $this->removeWebhook();
        }

        return $this->setWebhook();
    }

    /**
     * Set up the webhook.
     */
    private function setWebhook(): int
    {
        $webhookUrl = route('telegram.webhook');

        $this->info('Setting up Telegram webhook...');
        $this->newLine();
        $this->line("  URL: <comment>{$webhookUrl}</comment>");

        $result = $this->telegram->setWebhook($webhookUrl);

        if ($result) {
            $this->newLine();
            $this->info('Webhook set successfully!');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->error('Failed to set webhook. Check your TELEGRAM_BOT_TOKEN and ensure the URL is accessible via HTTPS.');

        return self::FAILURE;
    }

    /**
     * Remove the webhook.
     */
    private function removeWebhook(): int
    {
        $this->info('Removing Telegram webhook...');

        $result = $this->telegram->deleteWebhook();

        if ($result) {
            $this->newLine();
            $this->info('Webhook removed successfully!');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->error('Failed to remove webhook.');

        return self::FAILURE;
    }

    /**
     * Show current webhook info.
     */
    private function showWebhookInfo(): int
    {
        $this->info('Fetching current webhook info...');
        $this->newLine();

        $info = $this->telegram->getWebhookInfo();

        if (! $info) {
            $this->error('Failed to fetch webhook info.');

            return self::FAILURE;
        }

        $this->table(
            ['Property', 'Value'],
            [
                ['URL', $info['url'] ?: '<not set>'],
                ['Has Custom Certificate', $info['has_custom_certificate'] ? 'Yes' : 'No'],
                ['Pending Update Count', $info['pending_update_count'] ?? 0],
                ['Last Error Date', isset($info['last_error_date']) ? date('Y-m-d H:i:s', $info['last_error_date']) : '-'],
                ['Last Error Message', $info['last_error_message'] ?? '-'],
                ['Max Connections', $info['max_connections'] ?? 40],
            ]
        );

        return self::SUCCESS;
    }
}
