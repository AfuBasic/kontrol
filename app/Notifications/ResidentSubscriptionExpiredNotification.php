<?php

namespace App\Notifications;

use App\Models\ResidentSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResidentSubscriptionExpiredNotification extends Notification implements ShouldQueue
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

        return (new MailMessage)
            ->subject('Your access is currently inactive')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your access subscription for {$estateName} has expired.")
            ->line('Some features of the Kontrol mobile app are currently restricted. To restore full access, please visit the Kontrol web platform to renew your subscription.')
            ->action('Restore Access on Web', config('app.url'))
            ->line('Thank you for using Kontrol!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Access Restricted',
            'message' => 'Your access is currently limited. Renew to restore.',
            'type' => 'subscription_expired',
            'action_url' => '/resident/profile',
        ];
    }
}
