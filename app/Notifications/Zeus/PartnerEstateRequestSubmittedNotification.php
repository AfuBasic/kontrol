<?php

namespace App\Notifications\Zeus;

use App\Models\PartnerRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PartnerEstateRequestSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PartnerRequest $partnerRequest,
    ) {
        $this->partnerRequest->loadMissing('partner');
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $partnerName = $this->partnerRequest->partner?->name ?? 'A partner';
        $estateName = $this->partnerRequest->estate_name;
        $url = route('zeus.partner-requests.index');

        return (new MailMessage)
            ->subject("New partner estate request: {$estateName}")
            ->view('mail.zeus.partner-estate-request-submitted', [
                'partnerName' => $partnerName,
                'estateName' => $estateName,
                'contactName' => $this->partnerRequest->chairman_name,
                'contactEmail' => $this->partnerRequest->chairman_email,
                'contactPhone' => $this->partnerRequest->chairman_phone,
                'state' => $this->partnerRequest->state,
                'lga' => $this->partnerRequest->lga,
                'numberOfHouses' => $this->partnerRequest->number_of_houses,
                'url' => $url,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New partner estate request',
            'message' => ($this->partnerRequest->partner?->name ?? 'A partner')
                .' submitted '.$this->partnerRequest->estate_name.'.',
            'action_url' => route('zeus.partner-requests.index'),
            'partner_request_id' => $this->partnerRequest->id,
            'type' => 'info',
        ];
    }
}
