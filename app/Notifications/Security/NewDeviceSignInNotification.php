<?php

namespace App\Notifications\Security;

use App\Models\DeviceAuthorizationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class NewDeviceSignInNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public bool $deleteWhenMissingModels = true;

    public function __construct(
        public DeviceAuthorizationRequest $authorization,
        public string $approveUrl,
        public string $denyUrl,
    ) {}

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
            ->subject('New device sign-in attempt')
            ->view('mail.security.new-device-sign-in', [
                'userName' => $notifiable->name,
                'displayName' => $this->authorization->display_name,
                'approximateLocation' => $this->authorization->approximate_location,
                'occurredAt' => $this->authorization->created_at?->timezone(config('app.timezone'))->format('j M Y · g:i A'),
                'approveUrl' => $this->approveUrl,
                'denyUrl' => $this->denyUrl,
            ]);
    }
}
