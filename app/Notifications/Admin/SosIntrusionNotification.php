<?php

namespace App\Notifications\Admin;

use App\Channels\TelegramChannel;
use App\Mail\Admin\SosAlertMail;
use App\Models\SosEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class SosIntrusionNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public SosEvent $sosEvent
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if ($notifiable->hasRole('admin')) {
            $channels[] = 'mail';
        }

        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        if ($notifiable->telegram_chat_id) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): SosAlertMail
    {
        return (new SosAlertMail($this->sosEvent))->to($notifiable->email);
    }

    /**
     * Get the web push notification representation.
     */
    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('🚨 SOS ALERT')
            ->body("SOS triggered by {$this->sosEvent->user->name} in {$this->sosEvent->estate->name}")
            ->icon('/assets/images/app-icon.png')
            ->badge('/assets/images/app-icon.png')
            ->tag('sos-alert-'.$this->sosEvent->id)
            ->data([
                'url' => $notifiable->hasRole('admin') ? '/admin' : '/security',
                'sos_event_id' => $this->sosEvent->id,
            ])
            ->options([
                'TTL' => 600,
                'urgency' => 'high',
            ]);
    }

    /**
     * Get the FCM notification representation.
     */
    public function toFcm(object $notifiable): FcmMessage
    {
        $title = '🚨 SOS ALERT';
        $body = "SOS triggered by {$this->sosEvent->user->name} in {$this->sosEvent->estate->name}";
        $url = $notifiable->hasRole('admin') ? '/admin' : '/security';

        return FcmMessage::create()
            ->notification(FcmNotification::create()
                ->title($title)
                ->body($body)
            )
            ->data([
                'title' => $title,
                'body' => $body,
                'action_url' => $url,
                'sos_event_id' => (string) $this->sosEvent->id,
                'type' => 'sos_intrusion',
                'priority' => 'high',
            ])
            ->custom([
                'android' => [
                    'priority' => 'high', // Root of android config, critical for sound/display
                    'notification' => [
                        'color' => '#dc2626',
                        'sound' => 'default',
                        'channel_id' => 'sos_alerts',
                        'sticky' => true,
                        'visibility' => 'public',
                        'ticker' => $title,
                    ],
                ],
                'apns' => [
                    'headers' => [
                        'apns-priority' => '10',
                        'apns-push-type' => 'alert',
                    ],
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $title,
                                'body' => $body,
                            ],
                            'sound' => 'default',
                            'badge' => 1,
                            'critical-alert' => [
                                'name' => 'default',
                                'volume' => 1.0,
                                'critical' => 1,
                            ],
                        ],
                    ],
                ],
            ]);
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * Get the Telegram notification representation.
     */
    public function toTelegram(object $notifiable): array
    {
        $user = $this->sosEvent->user;
        $subject = $user;

        if ($user->isHouseholdMember() && $user->householdOf) {
            $subject = $user->householdOf->primaryResident;
        }

        $address = $subject->profile?->address ?? 'N/A';
        $phone = $user->profile?->phone ?? 'N/A';

        $text = "<b>🚨 SOS ALERT</b>\n\n";
        $text .= "<b>Resident:</b> {$user->name}\n";
        $text .= "<b>Phone:</b> {$phone}\n";
        $text .= "<b>Location:</b> {$this->sosEvent->estate->name} ({$address})\n\n";
        $text .= 'Respond immediately.';

        return [
            'text' => $text,
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'SOS ALERT',
            'message' => "SOS triggered by {$this->sosEvent->user->name} in {$this->sosEvent->estate->name}",
            'sos_event_id' => $this->sosEvent->id,
            'type' => 'sos_intrusion',
            'action_url' => $notifiable->hasRole('admin') ? '/admin' : '/security',
        ];
    }
}
