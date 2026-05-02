<?php

namespace App\Notifications\Resident;

use App\Models\CollectionAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CollectionReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public CollectionAssignment $assignment
    ) {
        $this->onQueue('mail');
    }

    public function via(object $notifiable): array
    {
        // Check if we should send email based on the Gmail rule
        $via = ['database', 'broadcast'];

        if (str_ends_with(strtolower($notifiable->email), '@gmail.com')) {
            $via[] = 'mail';
        }

        return $via;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Payment Reminder: {$this->assignment->collection->name}")
            ->view('mail.resident.collection-reminder', [
                'assignment' => $this->assignment,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'collection_reminder',
            'collection_id' => $this->assignment->collection_id,
            'assignment_id' => $this->assignment->id,
            'amount' => $this->assignment->amount_due,
            'estate_name' => $this->assignment->estate->name,
            'title' => 'Payment Reminder',
            'message' => "Reminder: Payment for {$this->assignment->collection->name} is due.",
            'action_url' => '/resident/billing',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
