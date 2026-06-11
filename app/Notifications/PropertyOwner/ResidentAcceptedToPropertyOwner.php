<?php

namespace App\Notifications\PropertyOwner;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class ResidentAcceptedToPropertyOwner extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $resident
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
    }

    /**
     * Get the array representation of the notification (for database).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->notificationData();
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->notificationData());
    }

    /**
     * Get the FCM representation of the notification.
     */
    public function toFcm(object $notifiable): FcmMessage
    {
        $data = $this->notificationData();

        return FcmMessage::create()
            ->notification(FcmNotification::create()
                ->title('Invitation Accepted')
                ->body($data['message'])
            )
            ->data([
                'title' => 'Invitation Accepted',
                'body' => $data['message'],
                'type' => 'invitation_accepted',
                'action_url' => $data['action_url'],
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'kontrol_v1_property_owner_alerts',
                        'sound' => 'default',
                        'color' => '#0A3D91',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => 'Invitation Accepted',
                                'body' => $data['message'],
                            ],
                            'sound' => 'default',
                            'badge' => $notifiable->unreadNotifications()->count(),
                        ],
                    ],
                ],
            ]);
    }

    /**
     * Get the notification data payload.
     *
     * @return array<string, mixed>
     */
    protected function notificationData(): array
    {
        return [
            'message' => "Resident {$this->resident->name} has accepted the invitation.",
            'action_url' => route('resident.property-owner.residents.index'),
            'type' => 'success',
        ];
    }
}
