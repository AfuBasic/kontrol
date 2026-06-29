<?php

namespace App\Notifications\Resident;

use App\Channels\TelegramChannel;
use App\Models\Coupon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class CouponIssuedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Coupon $coupon
    ) {
        $this->onQueue('mail');
    }

    public function via(object $notifiable): array
    {
        if (method_exists($notifiable, 'isHouseholdMember') && $notifiable->isHouseholdMember()) {
            return [];
        }

        $channels = ['mail', 'database', 'broadcast'];

        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        if ($notifiable->fcm_token) {
            $channels[] = FcmChannel::class;
        }

        if ($notifiable->hasTelegramLinked()) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $discountText = $this->coupon->type === 'percentage'
            ? "{$this->coupon->value}%"
            : '₦'.number_format($this->coupon->value / 100, 0);

        $mailMessage = (new MailMessage)
            ->subject("New Promo Code Issued: {$this->coupon->code}")
            ->greeting("Hi {$notifiable->name},")
            ->line("We've generated a new promo code for you: **{$this->coupon->code}**.")
            ->line("Use this code to get {$discountText} off your next payment plan.");

        if ($this->coupon->expires_at) {
            $mailMessage->line('Expires on: '.$this->coupon->expires_at->format('M d, Y'));
        }

        return $mailMessage
            ->action('Go to Billing Portal', url('/resident/billing'))
            ->line('Thank you for using Kontrol!');
    }

    public function toArray(object $notifiable): array
    {
        $discountText = $this->coupon->type === 'percentage'
            ? "{$this->coupon->value}%"
            : '₦'.number_format($this->coupon->value / 100, 0);

        return [
            'type' => 'coupon_issued',
            'coupon_id' => $this->coupon->id,
            'coupon_code' => $this->coupon->code,
            'discount_value' => $this->coupon->value,
            'discount_type' => $this->coupon->type,
            'title' => 'New Coupon Code Received',
            'message' => "A new coupon code {$this->coupon->code} has been issued to you for {$discountText} discount.",
            'action_url' => '/resident/billing',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $data = $this->toArray($notifiable);

        return (new WebPushMessage)
            ->title($data['title'])
            ->body($data['message'])
            ->data(['url' => $data['action_url']])
            ->badge('/assets/images/icon.png')
            ->icon('/assets/images/icon.png');
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $data = $this->toArray($notifiable);

        return FcmMessage::create()
            ->notification(FcmNotification::create()
                ->title($data['title'])
                ->body($data['message'])
            )
            ->data([
                'title' => (string) $data['title'],
                'body' => (string) $data['message'],
                'action_url' => (string) $data['action_url'],
                'coupon_id' => (string) $this->coupon->id,
                'type' => 'coupon_issued',
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'sound' => 'default',
                        'color' => '#0A3D91',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'alert' => [
                                'title' => $data['title'],
                                'body' => $data['message'],
                            ],
                            'sound' => 'default',
                            'badge' => $notifiable->unreadNotifications()->count(),
                            'category' => 'coupon_issued',
                        ],
                    ],
                ],
            ]);
    }

    public function toTelegram(object $notifiable): array
    {
        $discountText = $this->coupon->type === 'percentage'
            ? "{$this->coupon->value}%"
            : '₦'.number_format($this->coupon->value / 100, 0);

        $text = "🔔 <b>New Coupon Issued</b>\n\n"
            ."Hi <b>{$notifiable->name}</b>,\n"
            ."You have received a new promo code: <code>{$this->coupon->code}</code>.\n\n"
            ."💰 Benefit: <b>{$discountText} Discount</b>\n\n"
            .($this->coupon->expires_at ? '📅 Expiry: <b>'.$this->coupon->expires_at->format('M d, Y')."</b>\n\n" : '')
            .'<i>Use this code during checkout at Kontrol billing portal to apply your discount.</i>';

        return [
            'text' => $text,
        ];
    }
}
