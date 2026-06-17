<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class LogoutAllUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auth:logout-all';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Invalidate all user sessions and clear remember tokens globally';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting global logout process...');

        // 1. Clear all remember tokens
        $updated = User::query()->update(['remember_token' => null]);
        $this->info("Cleared remember tokens for {$updated} users.");

        // 2. Truncate sessions table (if using database driver)
        if (config('session.driver') === 'database') {
            DB::table('sessions')->truncate();
            $this->info('Truncated sessions table.');
        } else {
            $this->warn('Session driver is not set to database. Skipping session table truncation.');
        }

        // 3. Clear application cache (which may store file-based or redis sessions)
        Artisan::call('cache:clear');
        $this->info('Cleared application cache.');

        $this->info('All users have been successfully logged out globally!');
    }
}
