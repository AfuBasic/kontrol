<?php

namespace App\Notifications\Resident;

use App\Channels\TelegramChannel;
use App\Models\CollectionAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewCollectionNotification extends Notification implements ShouldQueue
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

        $via = ['database', 'broadcast', 'mail'];

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
            ->subject("New Payment Collection: {$this->assignment->collection->name}")
            ->view('mail.resident.new-collection', [
                'assignment' => $this->assignment,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_collection',
            'collection_id' => $this->assignment->collection_id,
            'assignment_id' => $this->assignment->id,
            'amount' => $this->assignment->amount_due,
            'formatted_amount' => number_format($this->assignment->amount_due, 2).' NGN',
            'estate_name' => $this->assignment->estate->name,
            'title' => 'New Payment Collection Assigned',
            'message' => "A new payment collection '{$this->assignment->collection->name}' of ".number_format($this->assignment->amount_due, 2).' NGN has been assigned to you.',
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
                'type' => 'new_collection',
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
                            'category' => 'new_collection',
                        ],
                    ],
                ],
            ]);
    }

    public function toTelegram(object $notifiable): array
    {
        $data = $this->toArray($notifiable);

        $text = "🔔 <b>{$data['title']}</b>\n\n"
            ."Hi <b>{$notifiable->name}</b>,\n"
            ."{$data['message']}\n"
            .'💰 Amount Due: <b>'.number_format($this->assignment->amount_due, 2)." NGN</b>\n\n"
            .'<i>Please visit the Kontrol billing portal to view and pay.</i>';

        return [
            'text' => $text,
        ];
    }
}
