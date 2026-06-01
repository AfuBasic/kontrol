<?php

namespace App\Notifications\Resident;

use App\Channels\TelegramChannel;
use App\Models\CollectionAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Number;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class CollectionReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public CollectionAssignment $assignment
    ) {
        $this->onQueue('mail');
    }

    public function via(object $notifiable): array
    {
        if (method_exists($notifiable, 'isHouseholdMember') && $notifiable->isHouseholdMember()) {
            return [];
        }

        // Check if we should send email based on the Gmail rule
        $via = ['database', 'broadcast'];

        if (str_ends_with(strtolower($notifiable->email), '@gmail.com')) {
            $via[] = 'mail';
        }

        if ($notifiable->pushSubscriptions()->exists()) {
            $via[] = WebPushChannel::class;
        }

        if ($notifiable->fcm_token) {
            $via[] = FcmChannel::class;
        }

        if ($notifiable->hasTelegramLinked()) {
            $via[] = TelegramChannel::class;
        }

        return $via;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Payment Reminder: {$this->assignment->collection->name}")
            ->view('mail.resident.collection-reminder', [
                'assignment' => $this->assignment,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $remaining = $this->assignment->amount_due - $this->assignment->amount_paid;

        return [
            'type' => 'collection_reminder',
            'collection_id' => $this->assignment->collection_id,
            'assignment_id' => $this->assignment->id,
            'amount' => $remaining,
            'formatted_amount' => number_format($remaining, 2).' NGN',
            'estate_name' => $this->assignment->estate->name,
            'title' => 'Payment Reminder',
            'message' => $this->assignment->amount_paid > 0
                ? "Reminder: Outstanding balance for {$this->assignment->collection->name} is due."
                : "Reminder: Payment for {$this->assignment->collection->name} is due.",
            'action_url' => route('resident.collections.show', $this->assignment, false),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $data = $this->toArray($notifiable);

        return (new WebPushMessage)
            ->title($data['title'])
            ->body($data['message'])
            ->data(['url' => $data['action_url']])
            ->badge('/assets/images/icon.png')
            ->icon('/assets/images/icon.png');
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $data = $this->toArray($notifiable);

        return FcmMessage::create()
            ->notification(FcmNotification::create()
                ->title($data['title'])
                ->body($data['message'])
            )
            ->data([
                'title' => (string) $data['title'],
                'body' => (string) $data['message'],
                'action_url' => (string) $data['action_url'],
                'assignment_id' => (string) $this->assignment->id,
                'type' => 'collection_reminder',
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'kontrol_v1_alerts',
                        'sound' => 'default',
                        'color' => '#0A3D91',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $data['title'],
                                'body' => $data['message'],
                            ],
                            'sound' => 'default',
                            'badge' => $notifiable->unreadNotifications()->count(),
                            'category' => 'collection_reminder',
                        ],
                    ],
                ],
            ]);
    }

    public function toTelegram(object $notifiable): array
    {
        $data = $this->toArray($notifiable);
        $remaining = $this->assignment->amount_due - $this->assignment->amount_paid;

        $amountLabel = $this->assignment->amount_paid > 0
            ? '💰 Outstanding Balance: <b>'.Number::currency($remaining, 'NGN').'</b> (Paid: '.Number::currency($this->assignment->amount_paid, 'NGN').' of '.Number::currency($this->assignment->amount_due, 'NGN').')'
            : '💰 Amount Due: <b>'.Number::currency($remaining, 'NGN').'</b>';

        $text = "🔔 <b>{$data['title']}</b>\n\n"
            ."Hi <b>{$notifiable->name}</b>,\n"
            ."{$data['message']}\n"
            .$amountLabel."\n\n"
            .'<i>Please visit the Kontrol billing portal to settle this payment.</i>';

        return [
            'text' => $text,
        ];
    }
}
