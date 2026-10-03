<?php

namespace App\Notifications;

use App\Models\OrganizationBulkInvite;
use App\Support\BulkInviteDeliveryFailure;
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
        // The Kontrol team gets the technical email; the group creator gets a friendly one plus in-app and push.
        if ($notifiable instanceof AnonymousNotifiable) {
            return ['mail'];
        }

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
        return $notifiable instanceof AnonymousNotifiable
            ? $this->supportMail()
            : $this->creatorMail($notifiable);
    }

    /** Plain-language version for the person who created the group: what happened and what to do. */
    private function creatorMail(object $notifiable): MailMessage
    {
        $name = $this->bulkInvite->name ?: "Batch #{$this->bulkInvite->id}";
        $count = count($this->failedRecipients);
        $first = trim(explode(' ', (string) ($notifiable->name ?? ''))[0]);

        $mail = (new MailMessage)
            ->subject($count === 1 ? "A pass in '{$name}' wasn't delivered" : "{$count} passes in '{$name}' weren't delivered")
            ->greeting($first !== '' ? "Hi {$first}," : 'Hi,')
            ->line($count === 1
                ? "We couldn't deliver 1 pass in your group '{$name}'. Here's what happened:"
                : "We couldn't deliver {$count} passes in your group '{$name}'. Here's what happened:");

        foreach (array_slice($this->failedRecipients, 0, 10) as $recipient) {
            $reason = BulkInviteDeliveryFailure::friendly($recipient['error']) ?? BulkInviteDeliveryFailure::GENERIC;
            $mail->line("• {$recipient['email']}: {$reason}");
        }

        if ($count > 10) {
            $mail->line('...and '.($count - 10).' more.');
        }

        return $mail
            ->line('The passes themselves are ready, so nothing needs to be recreated. You can resend them from your group in one tap.')
            ->action('Review & resend', url("/org/bulk-invites/{$this->bulkInvite->id}"))
            ->line('If this keeps happening, just reply to this email or contact support@usekontrol.com and we will sort it out.');
    }

    /** Technical version for Kontrol support: raw errors and the context needed to investigate. */
    private function supportMail(): MailMessage
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
            'failed_recipients' => array_map(
                fn (array $recipient) => ['email' => $recipient['email'], 'error' => BulkInviteDeliveryFailure::friendly($recipient['error'])],
                array_slice($this->failedRecipients, 0, 5),
            ),
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
