<?php

namespace App\Notifications\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class PropertyOwnerResidentJoinedAdminNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $resident,
        public User $propertyOwner,
        public string $estateName
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast', 'mail'];

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Resident Joined via Property Owner - {$this->estateName}")
            ->view('mail.admin.property-owner-resident-joined', [
                'estateName' => $this->estateName,
                'residentName' => $this->resident->name,
                'residentEmail' => $this->resident->email,
                'ownerName' => $this->propertyOwner->name,
                'ownerEmail' => $this->propertyOwner->email,
                'url' => route('admin.residents.index'),
            ]);
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
                ->title('New Resident Joined')
                ->body($data['message'])
            )
            ->data([
                'title' => 'New Resident Joined',
                'body' => $data['message'],
                'type' => 'property_owner_resident_joined',
                'action_url' => $data['action_url'],
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'kontrol_v1_admin_alerts',
                        'sound' => 'default',
                        'color' => '#0A3D91',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => 'New Resident Joined',
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
            'message' => 'A property owner just added a new resident. More details have been sent to your email.',
            'action_url' => route('admin.residents.index'),
            'type' => 'info',
        ];
    }
}
