<?php

namespace App\Notifications\Partner;

use App\Models\EstateApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EstateRequestRejectedNotification extends Notification implements ShouldQueue
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
        return ['mail', 'database'];
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
        return [
            'title' => 'Estate Onboarding Rejected',
            'body' => "Your onboarding request for '{$this->application->estate_name}' was declined. Reason: {$this->reason}",
            'url' => '/partner/partner-requests',
            'estate_application_id' => $this->application->id,
            'type' => 'danger',
        ];
    }
}
