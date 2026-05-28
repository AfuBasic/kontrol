<?php

namespace App\Notifications\Resident;

use App\Channels\TelegramChannel;
use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;
use PdfStudio\Laravel\Facades\Pdf;

class InvoicePaidNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Invoice $invoice
    ) {
        $this->onQueue('mail');
    }

    public function via(object $notifiable): array
    {
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
        $mailMessage = (new MailMessage)
            ->subject("Receipt for Invoice #{$this->invoice->invoice_number}")
            ->view('mail.resident.invoice-paid', [
                'invoice' => $this->invoice,
            ]);

        try {
            $pdfResult = Pdf::view('pdf.invoice-pdf')
                ->data(['invoice' => $this->invoice])
                ->render();

            $mailMessage->attachData(
                $pdfResult->content(),
                "Receipt-{$this->invoice->invoice_number}.pdf",
                ['mime' => 'application/pdf']
            );
        } catch (\Exception $e) {
            Log::error('Failed to generate receipt PDF for notification', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $mailMessage;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'invoice_paid',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->amount,
            'formatted_amount' => $this->invoice->formatted_amount,
            'title' => 'Payment Successful',
            'message' => "Your payment for invoice #{$this->invoice->invoice_number} was successful. Thank you!",
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
                'invoice_id' => (string) $this->invoice->id,
                'type' => 'invoice_paid',
            ])
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'kontrol_v1_alerts',
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
                            'badge' => 1,
                            'category' => 'invoice_paid',
                        ],
                    ],
                ],
            ]);
    }

    public function toTelegram(object $notifiable): array
    {
        $invoiceNumber = $this->invoice->invoice_number;
        $amount = $this->invoice->formatted_amount;

        $text = "✅ <b>Payment Successful</b>\n\n"
            ."Hi <b>{$notifiable->name}</b>,\n"
            ."Your payment of <b>{$amount}</b> for invoice <code>#{$invoiceNumber}</code> was successful. Thank you!\n\n"
            .'<i>A receipt copy has been sent to your email.</i>';

        return [
            'text' => $text,
        ];
    }
}
