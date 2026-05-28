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

class NewInvoiceNotification extends Notification implements ShouldQueue
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
            ->subject("New Invoice #{$this->invoice->invoice_number} from {$this->invoice->estate->name}")
            ->view('mail.resident.new-invoice', [
                'invoice' => $this->invoice,
            ]);

        try {
            $pdfResult = Pdf::view('pdf.invoice-pdf')
                ->data(['invoice' => $this->invoice])
                ->render();

            $mailMessage->attachData(
                $pdfResult->content(),
                "Invoice-{$this->invoice->invoice_number}.pdf",
                ['mime' => 'application/pdf']
            );
        } catch (\Exception $e) {
            Log::error('Failed to attach invoice PDF to notification', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $mailMessage;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_invoice',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->amount,
            'formatted_amount' => $this->invoice->formatted_amount,
            'estate_name' => $this->invoice->estate->name,
            'title' => 'New Invoice Generated',
            'message' => "A new invoice #{$this->invoice->invoice_number} has been generated for your subscription.",
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
                'type' => 'new_invoice',
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
                            'category' => 'new_invoice',
                        ],
                    ],
                ],
            ]);
    }

    public function toTelegram(object $notifiable): array
    {
        $estateName = $this->invoice->estate->name;
        $invoiceNumber = $this->invoice->invoice_number;
        $amount = $this->invoice->formatted_amount;

        $text = "🔔 <b>New Invoice Generated</b>\n\n"
            ."Hi <b>{$notifiable->name}</b>,\n"
            ."A new invoice <code>#{$invoiceNumber}</code> has been generated for your subscription at <b>{$estateName}</b>.\n\n"
            ."💰 Amount: <b>{$amount}</b>\n\n"
            .'<i>Please visit the Kontrol billing portal to view and pay.</i>';

        return [
            'text' => $text,
        ];
    }
}
