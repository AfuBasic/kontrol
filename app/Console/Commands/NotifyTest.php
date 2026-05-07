<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\TestNotification;
use Illuminate\Console\Command;

class NotifyTest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:test {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test push notification to a specific user by email';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email [{$email}] not found.");
            return Command::FAILURE;
        }

        if (!$user->fcm_token) {
            $this->warn("User [{$email}] found, but they do not have an active push token (fcm_token is null).");
            $this->info("Ask the user to log into the mobile app to register their device.");
        }

        $this->info("Sending test notification to {$user->name} ({$email})...");

        try {
            $user->notify(new TestNotification(
                'Live Test',
                'This is a test notification from the Kontrol live server!'
            ));
            
            $this->success("Notification dispatched successfully!");
            $this->info("Check the device now. If it doesn't arrive, verify your Firebase .p8 configuration.");
        } catch (\Exception $e) {
            $this->error("Failed to send notification: " . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Helper for colored success messages
     */
    protected function success(string $message): void
    {
        $this->line("<fg=green;options=bold>DONE:</> {$message}");
    }
}
