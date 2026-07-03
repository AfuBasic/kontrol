<?php

namespace App\Services\Ledger;

use App\Models\Estate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionExportService
{
    public function __construct(
        private TransactionOverviewService $overviewService,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function toCsv(Estate $estate, array $filters = []): StreamedResponse
    {
        $filename = 'transactions-'.$estate->id.'-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($estate, $filters) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Reference',
                'Resident',
                'Collection',
                'Type',
                'Direction',
                'Amount (Kobo)',
                'Status',
                'Payment Method',
                'Gateway Reference',
                'Provider',
                'Coupon',
                'Created By',
                'Approved By',
                'Created At',
                'Paid At',
            ]);

            $this->overviewService->query($estate, $filters)
                ->chunk(500, function ($transactions) use ($handle) {
                    foreach ($transactions as $transaction) {
                        fputcsv($handle, [
                            $transaction->reference_number,
                            $transaction->user?->name,
                            $transaction->collection?->name,
                            $transaction->type->label(),
                            $transaction->direction->label(),
                            $transaction->amount,
                            $transaction->status->label(),
                            $transaction->payment_method?->label(),
                            $transaction->gateway_reference,
                            $transaction->provider,
                            $transaction->coupon_code,
                            $transaction->creator?->name,
                            $transaction->approver?->name,
                            $transaction->created_at?->toDateTimeString(),
                            $transaction->paid_at?->toDateTimeString(),
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function toExcel(Estate $estate, array $filters = []): StreamedResponse
    {
        return $this->toCsv($estate, $filters);
    }
}
