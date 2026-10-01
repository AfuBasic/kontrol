<?php

namespace App\Notifications;

use App\Models\OrganizationBulkInvite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BulkInviteRenewedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public OrganizationBulkInvite $bulkInvite,
        public int $renewedCount,
        public int $blockedCount = 0,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'mail'];

        if (method_exists($notifiable, 'pushSubscriptions') && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        if (isset($notifiable->fcm_token) && $notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";

        return (new MailMessage)
            ->subject("Bulk Visitor Passes Renewed: {$name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("The passes for bulk invite group '{$name}' have been renewed automatically.")
            ->line("{$this->renewedCount} recipient passes have been extended from {$this->bulkInvite->valid_from} to {$this->bulkInvite->valid_until}.")
            ->action('View Invite Group', url("/org/bulk-invites/{$this->bulkInvite->id}"))
            ->line('Thank you for using our estate management system.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";

        return [
            'type' => 'bulk_invite_renewed',
            'bulk_invite_id' => $this->bulkInvite->id,
            'title' => 'Bulk Invite Group Renewed',
            'message' => "Passes for '{$name}' have been extended for {$this->renewedCount} recipients.",
            'valid_from' => $this->bulkInvite->valid_from?->toDateString(),
            'valid_until' => $this->bulkInvite->valid_until?->toDateString(),
            'renewed_count' => $this->renewedCount,
            'blocked_count' => $this->blockedCount,
            'link' => "/org/bulk-invites/{$this->bulkInvite->id}",
        ];
    }

    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";

        return (new WebPushMessage)
            ->title('Bulk Passes Renewed')
            ->body("Passes for '{$name}' renewed for {$this->renewedCount} recipients.")
            ->action('View', 'view_invite')
            ->data(['url' => "/org/bulk-invites/{$this->bulkInvite->id}"]);
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";

        return FcmMessage::create()
            ->setData(['url' => "/org/bulk-invites/{$this->bulkInvite->id}"])
            ->setNotification(
                FcmNotification::create()
                    ->setTitle('Bulk Passes Renewed')
                    ->setBody("Passes for '{$name}' renewed for {$this->renewedCount} recipients.")
            );
    }
}
