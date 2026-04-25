<?php

namespace App\Notifications;

use App\Models\ResidentSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResidentTrialEndingNotification extends Notification implements ShouldQueue
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
            ->subject('Your Kontrol access trial is ending soon')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your access trial for {$estateName} is ending soon.")
            ->line('To ensure uninterrupted access to your estate features, please visit the Kontrol web platform to manage your subscription.')
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
        $daysLeft = now()->diffInDays($this->subscription->trial_ends_at);

        return [
            'title' => 'Trial Ending Soon',
            'message' => "Your access trial ends in {$daysLeft} days.",
            'type' => 'subscription_trial_ending',
            'action_url' => '/resident/profile',
        ];
    }
}
