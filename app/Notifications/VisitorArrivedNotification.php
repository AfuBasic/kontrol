<?php

namespace App\Notifications;

use App\Models\AccessCode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

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
        return ['database'];
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
