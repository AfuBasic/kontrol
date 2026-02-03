<?php

namespace App\Console\Commands;

use App\Models\AccessCode;
use Illuminate\Console\Command;

class PruneExpiredAccessCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:prune-expired-codes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove expired and unused access codes from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Pruning expired unused access codes...');

        $count = AccessCode::whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->whereNull('used_at')
            ->delete();

        $this->info("Deleted {$count} expired unused access codes.");
    }
}
