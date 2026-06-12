<?php

namespace App\Notifications\PropertyOwner;

use App\Models\CollectionAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class CollectionPaymentReceivedNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public CollectionAssignment $assignment,
        public int $amountPaid
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
        return $this->notificationData($notifiable);
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->notificationData($notifiable));
    }

    /**
     * Get the FCM representation of the notification.
     */
    public function toFcm(object $notifiable): FcmMessage
    {
        $data = $this->notificationData($notifiable);

        return FcmMessage::create()
            ->notification(FcmNotification::create()
                ->title('Payment Received')
                ->body($data['message'])
            )
            ->data([
                'title' => 'Payment Received',
                'body' => $data['message'],
                'type' => 'payment_received',
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
                                'title' => 'Payment Received',
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
    protected function notificationData(object $notifiable): array
    {
        $formattedAmount = '₦'.number_format($this->amountPaid);
        $residentName = $this->assignment->user->name;
        $collectionName = $this->assignment->collection->name;

        $message = "Payment of {$formattedAmount} received from {$residentName} for {$collectionName}.";

        $actionUrl = '#';
        if ($notifiable->hasRole('property_owner')) {
            $actionUrl = route('resident.property-owner.collections.index');
        } elseif ($notifiable->hasRole('admin')) {
            // If there's an admin route, we could resolve it here
            $actionUrl = '/admin/collections/'.$this->assignment->collection_id;
        }

        return [
            'message' => $message,
            'action_url' => $actionUrl,
            'type' => 'success',
        ];
    }
}
