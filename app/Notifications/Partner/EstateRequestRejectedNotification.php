<?php

namespace App\Notifications\Partner;

use App\Models\EstateApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EstateRequestRejectedNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public EstateApplication $application,
        public string $reason
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
        $estateName = $this->application->estate_name;

        return (new MailMessage)
            ->subject("Estate Onboarding Rejected: {$estateName}")
            ->view('mail.partner.estate-request-rejected', [
                'partnerName' => $partnerName,
                'estateName' => $estateName,
                'rejectionReason' => $this->reason,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $estateName = $this->application->estate_name;

        return [
            'title' => 'Estate request rejected',
            // Toast / in-app list: inform only — full reason lives on the estate request + email.
            'body' => "Your onboarding request for “{$estateName}” was rejected.",
            'url' => '/partner/partner-requests',
            'estate_application_id' => $this->application->id,
            // Laravel overwrites broadcast "type" with the notification class name.
            // Keep severity for UI (toast color / badge).
            'severity' => 'danger',
            'type' => 'danger',
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        // Sync so the partner UI updates as soon as the queued notification job runs.
        return (new BroadcastMessage($this->toArray($notifiable)))
            ->onConnection('sync');
    }
}
