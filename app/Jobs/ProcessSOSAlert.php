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
use Illuminate\Support\Facades\Mail;

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

        // 1. Notify Security (High Priority - SMS)
        $securityPersonnel = User::withRole('security', $estate->id)->active()->get();

        $securityMessage = "🚨 INTRUSION ALERT\n";
        $securityMessage .= "Resident: {$user->name}\n";
        $securityMessage .= "Address: {$address}\n";
        $securityMessage .= "Estate: {$estate->name}\n";
        $securityMessage .= "Phone: {$user->phone}\n";
        $securityMessage .= 'Respond immediately.';

        foreach ($securityPersonnel as $security) {
            // Send SMS
            if ($security->profile?->phone) {
                try {
                    $smsService->send($security->profile->phone, $securityMessage);
                } catch (\Exception $e) {
                    Log::error("Failed to send SOS SMS to security {$security->id}: " . $e->getMessage());
                }
            }

            // Send Mobile Push/Telegram/WebPush
            try {
                $security->notify(new \App\Notifications\Admin\SosIntrusionNotification($this->sosEvent));
            } catch (\Exception $e) {
                Log::error("Failed to send SOS notification to security {$security->id}: " . $e->getMessage());
            }
        }

        // 2. Notify Emergency Contacts (Medium Priority - SMS)
        $contacts = $user->emergencyContacts;

        $contactMessage = "🚨 SOS ALERT\n";
        $contactMessage .= "{$user->name} triggered an emergency alert.\n";
        $contactMessage .= "Location: {$estate->name} ({$address})\n";
        $contactMessage .= 'Security has been notified. Please check immediately.';

        foreach ($contacts as $contact) {
            try {
                $smsService->send($contact->phone, $contactMessage);
            } catch (\Exception $e) {
                Log::error("Failed to send SOS SMS to contact {$contact->id}: " . $e->getMessage());
            }
        }

        // 3. Notify Estate Admins (Information Priority - Email & Push)
        $admins = User::withRole('admin', $estate->id)->active()->get();
        
        foreach ($admins as $admin) {
            // Send Email
            try {
                Mail::to($admin->email)->send(new \App\Mail\Admin\SosAlertMail($this->sosEvent));
            } catch (\Exception $e) {
                Log::error("Failed to send SOS Email to admin {$admin->id}: " . $e->getMessage());
            }

            // Send Mobile Push/Telegram/WebPush
            try {
                $admin->notify(new \App\Notifications\Admin\SosIntrusionNotification($this->sosEvent));
            } catch (\Exception $e) {
                Log::error("Failed to send SOS notification to admin {$admin->id}: " . $e->getMessage());
            }
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
