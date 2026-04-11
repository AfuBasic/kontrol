<?php

namespace App\Notifications;

use App\Models\Estate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class VerifyResidentEmail extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Delete the job if the models are no longer available.
     */
    public bool $deleteWhenMissingModels = true;

    public function __construct(
        public Estate $estate
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
        );

        return (new MailMessage)
            ->subject("Verify your email - {$this->estate->name}")
            ->view('mail.auth.verify-email', [
                'name' => $notifiable->name,
                'estateName' => $this->estate->name,
                'url' => $verificationUrl,
            ]);
    }
}
