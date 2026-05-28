<?php

namespace App\Notifications\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class ResidentAcceptedInvitation extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $resident,
        public bool $isPasswordReset = false,
    ) {
        //
    }

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
                ->title($this->isPasswordReset ? 'Security Alert' : 'Invitation Accepted')
                ->body($data['message'])
            )
            ->data([
                'title' => $this->isPasswordReset ? 'Security Alert' : 'Invitation Accepted',
                'body' => $data['message'],
                'type' => 'invitation_accepted',
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
                                'title' => $this->isPasswordReset ? 'Security Alert' : 'Invitation Accepted',
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
        $roleLabel = match (true) {
            $this->resident->hasRole('security') => 'Security',
            $this->resident->hasRole('household_member') => 'Household Member',
            default => 'Resident',
        };

        $message = $this->isPasswordReset
            ? "{$roleLabel} {$this->resident->name} has reset their password."
            : "{$roleLabel} {$this->resident->name} has accepted the invitation.";

        return [
            'message' => $message,
            'action_url' => route('admin.residents.index'),
            'type' => 'success',
        ];
    }
}
