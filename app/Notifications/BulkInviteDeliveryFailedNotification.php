<?php

namespace App\Notifications;

use App\Models\OrganizationBulkInvite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BulkInviteDeliveryFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int, array{email: string, error: ?string}>  $failedRecipients
     */
    public function __construct(
        public OrganizationBulkInvite $bulkInvite,
        public array $failedRecipients,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // The failure email is for the Kontrol team only. The batch creator is told in-app and by push,
        // never by email (the email carries internal error details they cannot act on).
        if ($notifiable instanceof AnonymousNotifiable) {
            return ['mail'];
        }

        $channels = ['database'];

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
        $count = count($this->failedRecipients);
        $organization = $this->bulkInvite->organization?->name ?? 'Unknown organization';
        $estate = $this->bulkInvite->estate?->name ?? 'Unknown estate';
        $creator = $this->bulkInvite->createdBy?->email ?? 'unknown';

        $mail = (new MailMessage)
            ->error()
            ->subject("Delivery Issues: {$count} Bulk Visitor Pass".($count === 1 ? '' : 'es')." Failed ({$organization})")
            ->greeting('Hello Kontrol Support,')
            ->line("{$count} recipient pass".($count === 1 ? '' : 'es')." in group '{$name}' could not be delivered.")
            ->line("Estate: {$estate}")
            ->line("Organization: {$organization}")
            ->line("Created by: {$creator}")
            ->line("Bulk invite ID: {$this->bulkInvite->id}")
            ->line('Failed recipient addresses:');

        foreach (array_slice($this->failedRecipients, 0, 10) as $recipient) {
            $err = $recipient['error'] ? " ({$recipient['error']})" : '';
            $mail->line("• {$recipient['email']}{$err}");
        }

        if ($count > 10) {
            $remaining = $count - 10;
            $mail->line("... and {$remaining} more.");
        }

        return $mail->action('Open bulk invite', url("/org/bulk-invites/{$this->bulkInvite->id}"));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";
        $count = count($this->failedRecipients);

        return [
            'type' => 'bulk_invite_delivery_failed',
            'bulk_invite_id' => $this->bulkInvite->id,
            'title' => 'Pass Delivery Failed',
            'message' => "{$count} passes failed to deliver for '{$name}'.",
            'failed_count' => $count,
            'failed_recipients' => array_slice($this->failedRecipients, 0, 5),
            'link' => "/org/bulk-invites/{$this->bulkInvite->id}",
        ];
    }

    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";
        $count = count($this->failedRecipients);

        return (new WebPushMessage)
            ->title('Pass Delivery Failed')
            ->body("{$count} passes failed to deliver for '{$name}'. Tap to retry.")
            ->action('Retry', 'retry_delivery')
            ->data(['url' => "/org/bulk-invites/{$this->bulkInvite->id}"]);
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";
        $count = count($this->failedRecipients);

        return FcmMessage::create()
            ->setData(['url' => "/org/bulk-invites/{$this->bulkInvite->id}"])
            ->setNotification(
                FcmNotification::create()
                    ->setTitle('Pass Delivery Failed')
                    ->setBody("{$count} passes failed to deliver for '{$name}'.")
            );
    }
}
