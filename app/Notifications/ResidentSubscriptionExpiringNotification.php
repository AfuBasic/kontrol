<?php

namespace App\Notifications;

use App\Models\ResidentSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResidentSubscriptionExpiringNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ResidentSubscription $subscription
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $estateName = $this->subscription->estate->name;
        $daysLeft = now()->diffInDays($this->subscription->current_period_end);

        return (new MailMessage)
            ->subject("Your estate access will expire in {$daysLeft} days")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your access subscription for {$estateName} will expire in {$daysLeft} days.")
            ->line('To maintain full access to all features, please visit the Kontrol web platform to renew your subscription.')
            ->action('Manage Access on Web', config('app.url'))
            ->line('Thank you for using Kontrol!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $daysLeft = now()->diffInDays($this->subscription->current_period_end);
        $message = $daysLeft === 0 ? 'Access expires today' : "Access expires in {$daysLeft} days";

        return [
            'title' => 'Subscription Expiring',
            'message' => $message,
            'type' => 'subscription_expiring',
            'action_url' => '/resident/profile',
        ];
    }
}
