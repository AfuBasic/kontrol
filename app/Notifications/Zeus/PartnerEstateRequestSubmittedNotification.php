<?php

namespace App\Notifications\Zeus;

use App\Models\EstateApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PartnerEstateRequestSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public EstateApplication $application,
    ) {
        $this->application->loadMissing('partner');
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
        $partnerName = $this->application->partner?->name ?? 'A partner';
        $estateName = $this->application->estate_name;
        $url = route('zeus.applications.index');

        return (new MailMessage)
            ->subject("New partner estate request: {$estateName}")
            ->view('mail.zeus.partner-estate-request-submitted', [
                'partnerName' => $partnerName,
                'estateName' => $estateName,
                'contactName' => $this->application->contact_name,
                'contactEmail' => $this->application->email,
                'contactPhone' => $this->application->phone,
                'state' => $this->application->state,
                'lga' => $this->application->lga,
                'numberOfHouses' => $this->application->number_of_houses,
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
            'message' => ($this->application->partner?->name ?? 'A partner')
                .' submitted '.$this->application->estate_name.'.',
            'action_url' => route('zeus.applications.index'),
            'estate_application_id' => $this->application->id,
            'type' => 'info',
        ];
    }
}
