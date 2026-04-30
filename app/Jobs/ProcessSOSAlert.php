<?php

namespace App\Jobs;

use App\Models\SosEvent;
use App\Models\User;
use App\Notifications\Admin\SosIntrusionNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessSOSAlert implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public SosEvent $sosEvent) {}

    public function handle(): void
    {

        $this->sosEvent->update(['status' => 'processing']);

        $user = $this->sosEvent->user;
        $estate = $this->sosEvent->estate;

        // For household members, we use the parent resident's address and profile data
        $subject = $user;
        if ($user->isHouseholdMember() && $user->householdOf) {
            $subject = $user->householdOf->primaryResident;
        }

        $address = $subject->profile->address ?? 'N/A';

        // Set Spatie permissions team ID for this estate to ensure roles are correctly scoped
        setPermissionsTeamId($estate->id);

        // 1. Notify Security (High Priority)
        $securityPersonnel = User::withRole('security', $estate->id)->active()->get();
        Log::error("SOS Alert: Found {$securityPersonnel->count()} security personnel for estate {$estate->id}");

        $securityMessage = "SOS ALERT\n";
        $securityMessage .= "Resident: {$user->name}\n";
        $securityMessage .= "Address: {$address}\n";
        $securityMessage .= "Estate: {$estate->name}\n";
        $securityMessage .= "Phone: {$user->profile?->phone}\n";
        $securityMessage .= 'Respond immediately.';

        foreach ($securityPersonnel as $security) {
            // Queue SMS
            if ($security->profile?->phone) {
                SendSmsAlert::dispatch($security->profile->phone, $securityMessage);
            }

            // Queue Mobile Push/Telegram/WebPush (Queued automatically by Notification class)
            $security->notify(new SosIntrusionNotification($this->sosEvent));
        }

        // 2. Notify Emergency Contacts (Medium Priority)
        $contacts = $subject->emergencyContacts;

        $contactMessage = "🚨 SOS ALERT\n";
        $contactMessage .= "{$user->name} triggered an emergency alert.\n";
        $contactMessage .= "Location: {$estate->name} ({$address})\n";
        $contactMessage .= 'Security has been notified. Please check immediately.';

        foreach ($contacts as $contact) {
            SendSmsAlert::dispatch($contact->phone, $contactMessage);
        }

        // 3. Notify Estate Admins (Information Priority)
        $admins = User::withRole('admin', $estate->id)->active()->get();

        foreach ($admins as $admin) {
            $admin->notify(new SosIntrusionNotification($this->sosEvent));
        }

        // 4. Notify Primary Resident (if triggered by a household member)
        if ($user->isHouseholdMember() && $subject->id !== $user->id) {
            $subject->notify(new SosIntrusionNotification($this->sosEvent));
        }

        // Reset team ID after processing
        setPermissionsTeamId(null);

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
