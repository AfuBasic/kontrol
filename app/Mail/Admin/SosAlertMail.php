<?php

namespace App\Mail\Admin;

use App\Models\SosEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SosAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public SosEvent $sosEvent
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "🚨 SOS ALERT: Triggered in {$this->sosEvent->estate->name}",
        );
    }

    public function content(): Content
    {
        $user = $this->sosEvent->user;
        $subject = $user;

        if ($user->isHouseholdMember() && $user->householdOf) {
            $subject = $user->householdOf->primaryResident;
        }

        return new Content(
            view: 'mail.admin.sos-alert',
            with: [
                'residentName' => $user->name,
                'residentPhone' => $user->profile?->phone ?? 'N/A',
                'address' => $subject->profile?->address ?? 'N/A',
                'estateName' => $this->sosEvent->estate->name,
                'triggeredAt' => $this->sosEvent->triggered_at->format('H:i • M d, Y'),
                'emergencyContacts' => $subject->emergencyContacts,
            ],
        );
    }
}
