<?php

namespace App\Jobs;

use App\Models\SosEvent;
use App\Models\User;
use App\Services\SMS\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessSOSAlert implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public SosEvent $sosEvent) {}

    public function handle(SmsService $smsService): void
    {
        $this->sosEvent->update(['status' => 'processing']);

        $user = $this->sosEvent->user;
        $estate = $this->sosEvent->estate;
        $address = $user->profile?->address ?? 'N/A';

        // 1. Notify Security
        $securityPersonnel = User::withRole('security', $estate->id)->active()->get();

        $securityMessage = "🚨 EMERGENCY ALERT\n";
        $securityMessage .= "Resident: {$user->name}\n";
        $securityMessage .= "Address: {$address}\n";
        $securityMessage .= "Estate: {$estate->name}\n";
        $securityMessage .= 'Respond immediately.';

        foreach ($securityPersonnel as $security) {
            if ($security->profile?->phone) {
                $smsService->send($security->profile->phone, $securityMessage);
            }
        }

        // 2. Notify Emergency Contacts
        $contacts = $user->emergencyContacts;

        $contactMessage = "🚨 SOS ALERT\n";
        $contactMessage .= "{$user->name} triggered an emergency alert.\n";
        $contactMessage .= "Location: {$estate->name} ({$address})\n";
        $contactMessage .= 'Security has been notified. Please check immediately.';

        foreach ($contacts as $contact) {
            $smsService->send($contact->phone, $contactMessage);
        }

        $this->sosEvent->update(['status' => 'completed']);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SOS Processing Failed', [
            'event_id' => $this->sosEvent->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
