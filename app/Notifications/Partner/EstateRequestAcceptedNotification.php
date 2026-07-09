<?php

namespace App\Notifications\Partner;

use App\Models\Estate;
use App\Models\EstateApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EstateRequestAcceptedNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public EstateApplication $application,
        public Estate $estate,
    ) {
        $this->application->loadMissing('partner');
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $partnerName = $this->application->partner?->name ?? 'Partner';
        $estateName = $this->estate->name ?: $this->application->estate_name;

        return (new MailMessage)
            ->subject("Estate Onboarding Accepted: {$estateName}")
            ->view('mail.partner.estate-request-accepted', [
                'partnerName' => $partnerName,
                'estateName' => $estateName,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $estateName = $this->estate->name ?: $this->application->estate_name;

        return [
            'title' => 'Estate request accepted',
            'body' => "Great news! “{$estateName}” has been approved and is now live on Kontrol.",
            'url' => '/partner/partner-requests',
            'estate_application_id' => $this->application->id,
            'estate_id' => $this->estate->id,
            // Laravel overwrites broadcast "type" with the notification class name.
            'severity' => 'success',
            'type' => 'success',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return (new BroadcastMessage($this->toArray($notifiable)))
            ->onConnection('sync');
    }
}
