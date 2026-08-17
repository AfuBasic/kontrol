<?php

namespace App\Notifications\Resident;

use App\Channels\TelegramChannel;
use App\Models\CollectionAssignment;
use App\Models\EstateTransaction;
use App\Models\Payment;
use App\Services\Ledger\TransactionOverviewService;
use Exception;
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

class CollectionPaymentSuccessfulNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Payment $payment,
        public CollectionAssignment $assignment
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
        $mailMessage = (new MailMessage)
            ->subject("Receipt for {$this->assignment->collection->name}")
            ->view('mail.resident.collection-paid', [
                'assignment' => $this->assignment,
                'payment' => $this->payment,
            ]);

        try {
            // Find the associated Ledger Transaction using idempotency_key
            $idempotencyKey = 'payment_'.$this->payment->id;
            $transaction = EstateTransaction::where('idempotency_key', $idempotencyKey)->first();

            if ($transaction) {
                $mappedTransaction = app(TransactionOverviewService::class)->mapTransaction($transaction);

                $pdfResult = Pdf::view('pdf.receipt')
                    ->data(['transaction' => $mappedTransaction])
                    ->render();

                $mailMessage->attachData(
                    $pdfResult->content(),
                    "Receipt-{$transaction->reference_number}.pdf",
                    ['mime' => 'application/pdf']
                );
            }
        } catch (Exception $e) {
            Log::error('Failed to generate receipt PDF for collection payment notification', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $mailMessage;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'collection_paid',
            'collection_id' => $this->assignment->collection_id,
            'collection_name' => $this->assignment->collection->name,
            'amount' => $this->payment->amount,
            'formatted_amount' => 'NGN '.number_format($this->payment->amount),
            'title' => 'Payment Successful',
            'message' => "Your payment for the {$this->assignment->collection->name} collection was successful. Thank you!",
            'action_url' => '/resident/billing',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('Payment Successful')
            ->icon('/images/icon-192x192.png')
            ->body("Your payment for the {$this->assignment->collection->name} collection was successful.")
            ->action('View Billing', '/resident/billing');
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return (new FcmMessage(
            notification: new FcmNotification(
                title: 'Payment Successful',
                body: "Your payment for the {$this->assignment->collection->name} collection was successful.",
                image: null
            )
        ))->data(['action_url' => '/resident/billing']);
    }

    public function toTelegram(object $notifiable): string
    {
        $amount = number_format($this->payment->amount);

        return "✅ *Payment Successful*\n\n"
            ."Your payment of NGN {$amount} for the *{$this->assignment->collection->name}* collection has been received.\n\n"
            .'_A receipt copy has been sent to your email._';
    }
}
