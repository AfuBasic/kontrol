<?php

namespace App\Notifications\Security;

use App\Models\TrustedDevice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class TrustedDeviceRevokedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public bool $deleteWhenMissingModels = true;

    public function __construct(public TrustedDevice $device) {}

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
            ->subject('A device was removed from your Kontrol account')
            ->view('mail.security.device-revoked', [
                'userName' => $notifiable->name,
                'displayName' => $this->device->display_name ?? 'Unknown device',
                'devicesUrl' => route('account.devices.index'),
            ]);
    }
}
