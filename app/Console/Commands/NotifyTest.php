<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\TestNotification;
use Illuminate\Console\Command;

class NotifyTest extends Command
{
    protected $signature = 'notify:test {email} {--sync : Send synchronously without queuing}';

    protected $description = 'Send a test push notification to a specific user by email';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("❌ User with email [{$email}] not found.");
            return Command::FAILURE;
        }

        // Check user prerequisites
        $this->info("📱 User: {$user->name} ({$email})");
        $this->info("User ID: {$user->id}");
        $this->info("Type: {$user->user_type}");

        // Check FCM token
        if (!$user->fcm_token) {
            $this->warn("⚠️  WARNING: User has NO FCM token (fcm_token is null)");
            $this->line("This means the user hasn't logged into the mobile app yet, or didn't grant notification permissions.");
            $this->line("");
            $this->info("To fix this:");
            $this->line("1. User must open the Kontrol mobile app");
            $this->line("2. Grant notification permissions when prompted");
            $this->line("3. Then you can send them notifications");
            return Command::FAILURE;
        }

        $this->info("✅ FCM Token: {$this->truncateToken($user->fcm_token)}");

        // Show queue status
        $sync = $this->option('sync');
        if (!$sync) {
            $this->info("");
            $this->info("📤 Mode: QUEUED (notification goes to job queue)");
            $this->info("Make sure queue worker is running:");
            $this->line("   <fg=cyan>php artisan queue:work --queue=default,mail,payments</>");
            $this->info("");

            if (!$this->isQueueWorkerRunning()) {
                $this->warn("⚠️  No queue worker detected running!");
                $this->line("The notification will be queued but won't send until queue worker starts.");
                $this->line("");

                if ($this->confirm("Would you like to send synchronously instead? (--sync flag)", false)) {
                    $sync = true;
                    $this->info("Switching to synchronous mode...");
                    $this->line("");
                }
            }
        } else {
            $this->info("📤 Mode: SYNCHRONOUS (sends immediately, may fail loudly)");
        }

        // Prepare notification
        $notification = new TestNotification(
            'Live Test Notification',
            'This is a test notification from Kontrol. If you see this, push notifications are working! 🎉'
        );

        try {
            if ($sync) {
                // Send synchronously - shows errors immediately
                $user->notifyNow($notification);
                $this->success("✅ Notification sent synchronously!");
            } else {
                // Queue the notification
                $user->notify($notification);
                $this->success("✅ Notification queued for delivery!");
                $this->info("The notification will be delivered via:");
                $this->line("  • FCM (Firebase Cloud Messaging) → Device");
                $this->line("  • WebPush (if browser registered)");
                $this->line("  • Database (notification center)");
                $this->line("");
                $this->info("📱 Check your device now for the notification (may take a few seconds)");
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("❌ Failed to send notification:");
            $this->error("   {$e->getMessage()}");
            $this->line("");
            $this->error("Stack trace:");
            $this->line($e->getTraceAsString());

            return Command::FAILURE;
        }
    }

    private function isQueueWorkerRunning(): bool
    {
        // Check if queue worker is running
        $output = shell_exec('ps aux 2>/dev/null | grep -i "queue:work" | grep -v grep');

        return !empty($output);
    }

    private function truncateToken(string $token, int $length = 20): string
    {
        return substr($token, 0, $length) . '...';
    }

    protected function success(string $message): void
    {
        $this->line("<fg=green;options=bold>{$message}</>");
    }
}
