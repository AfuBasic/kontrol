<?php

namespace App\Notifications\Security;

use App\Models\DeviceAuthorizationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class SignInBlockedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public bool $deleteWhenMissingModels = true;

    public function __construct(public DeviceAuthorizationRequest $authorization) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Sign-in attempt blocked')
            ->view('mail.security.sign-in-blocked', [
                'userName' => $notifiable->name,
                'displayName' => $this->authorization->display_name,
                'devicesUrl' => route('account.devices.index'),
            ]);
    }
}
