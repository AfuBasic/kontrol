<?php

namespace App\Notifications\Partner;

use App\Models\PartnerEarning;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EarningSettledNotification extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public function __construct(
        public PartnerEarning $earning,
    ) {
        $this->earning->loadMissing('partner');
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $partnerName = $this->earning->partner?->name ?? 'Partner';
        $monthLabel = $this->earning->month->format('F Y');
        $amount = number_format($this->earning->total_amount / 100, 2);

        return (new MailMessage)
            ->subject("Commission settled: {$monthLabel}")
            ->greeting("Hello {$partnerName},")
            ->line("Your commission for {$monthLabel} has been paid.")
            ->line("Amount: ₦{$amount}")
            ->line('Payment reference: '.($this->earning->maskedPaymentReference() ?? '-'))
            ->action('View earnings', url('/partner/earnings'))
            ->line('Thank you for partnering with Kontrol.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $monthLabel = $this->earning->month->format('F Y');
        $amount = number_format($this->earning->total_amount / 100, 2);

        return [
            'title' => 'Commission paid',
            'body' => "Your {$monthLabel} commission of ₦{$amount} has been settled.",
            'url' => '/partner/earnings',
            'partner_earning_id' => $this->earning->id,
            'month' => $this->earning->month->format('Y-m-01'),
            'amount' => $this->earning->total_amount,
            'payment_reference_masked' => $this->earning->maskedPaymentReference(),
            'severity' => 'success',
            'type' => 'success',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return (new BroadcastMessage($this->toArray($notifiable)))
            ->onConnection('sync');
    }
}
