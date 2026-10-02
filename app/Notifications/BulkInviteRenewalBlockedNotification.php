<?php

namespace App\Notifications;

use App\Models\OrganizationBulkInvite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BulkInviteRenewalBlockedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public OrganizationBulkInvite $bulkInvite) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'mail'];

        if (method_exists($notifiable, 'pushSubscriptions') && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    private function name(): string
    {
        return $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Auto-renew paused: {$this->name()}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Passes for '{$this->name()}' could not be renewed because a subscription is required.")
            ->line("They expire on {$this->bulkInvite->valid_until?->toFormattedDateString()}. Renewal resumes automatically once a subscription is active.")
            ->action('View Invite Group', url("/org/bulk-invites/{$this->bulkInvite->id}"));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'bulk_invite_renewal_blocked',
            'bulk_invite_id' => $this->bulkInvite->id,
            'title' => 'Auto-renew paused',
            'message' => "'{$this->name()}' can't renew until a subscription is active. Passes expire {$this->bulkInvite->valid_until?->toFormattedDateString()}.",
            'link' => "/org/bulk-invites/{$this->bulkInvite->id}",
        ];
    }

    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Auto-renew paused')
            ->body("'{$this->name()}' needs a subscription to renew.")
            ->data(['url' => "/org/bulk-invites/{$this->bulkInvite->id}"]);
    }
}
