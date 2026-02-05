<?php

namespace App\Notifications;

use App\Models\AccessCode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class VisitorArrivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public AccessCode $accessCode
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Add WebPush channel if user has push subscriptions
        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    /**
     * Get the web push notification representation.
     */
    public function toWebPush(object $notifiable, mixed $notification): WebPushMessage
    {
        $visitorName = $this->accessCode->visitor_name ?? 'A visitor';

        return (new WebPushMessage)
            ->title('Visitor Arrived')
            ->body("{$visitorName} has arrived at the gate.")
            ->icon('/assets/images/app-icon.png')
            ->badge('/assets/images/app-icon.png')
            ->tag('visitor-arrived-'.$this->accessCode->id)
            ->data([
                'url' => '/resident',
                'access_code_id' => $this->accessCode->id,
                'visitor_name' => $this->accessCode->visitor_name,
            ])
            ->options([
                'TTL' => 300, // Time to live in seconds (5 minutes)
                'urgency' => 'high',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $visitorName = $this->accessCode->visitor_name ?? 'A visitor';

        return [
            'title' => 'Visitor Arrived',
            'message' => "{$visitorName} has arrived at the gate.",
            'access_code_id' => $this->accessCode->id,
            'visitor_name' => $this->accessCode->visitor_name,
            'code' => $this->accessCode->code,
        ];
    }
}
