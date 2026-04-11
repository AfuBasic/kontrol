<?php

namespace App\Console\Commands;

use App\Services\Billing\InitializeTrialService;
use Illuminate\Console\Command;

class InitializeSubscriptionTrials extends Command
{
    protected $signature = 'app:initialize-subscription-trials {--fix : Actually fix the subscriptions}';

    protected $description = 'Initialize or correct trial periods for subscriptions based on estate creation date';

    public function handle(InitializeTrialService $service): int
    {
        $isFix = $this->option('fix');

        if (! $isFix) {
            $this->info('Running in check mode. Use --fix flag to actually update subscriptions.');
            $this->line('This will:');
            $this->line('  1. Check each subscription\'s estate creation date');
            $this->line('  2. Set trial_ends_at based on estate settings (free_trial_enabled and free_trial_days)');
            $this->line('  3. If trial expired or disabled, generate first invoice retroactively');
            $this->newLine();
            $this->warn('Run with --fix flag to execute.');

            return Command::SUCCESS;
        }

        $this->info('Initializing subscription trials based on estate creation dates...');

        $count = $service->initializeAllMissing();

        $this->info("✓ Initialized trials for {$count} subscription(s)");

        return Command::SUCCESS;
    }
}
