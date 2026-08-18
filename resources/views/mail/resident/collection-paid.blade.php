@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">Payment Received</div>
    <h1>Thank you for your payment!</h1>
    
    <p>Hello <span class="bold">{{ $assignment->user->first_name }}</span>,</p>
    
    <p>We've successfully received your payment of <span class="bold">NGN {{ number_format($payment->amount) }}</span> for the <span class="bold">{{ $assignment->collection->name }}</span> collection at <span class="bold">{{ $assignment->estate->name }}</span>.</p>
    
    @php
        $pb = $transaction['payment_breakdown'] ?? null;
    @endphp

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin-bottom: 8px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Collection Details</p>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #475569;">Collection</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $assignment->collection->name }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #475569;">Amount Paid</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">NGN {{ number_format($payment->amount) }}</td>
            </tr>
            @if($assignment->period)
            <tr>
                <td style="padding: 8px 0; color: #475569;">Period</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $assignment->period }}</td>
            </tr>
            @endif
        </table>

        @if($pb)
        <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 16px 0;" />
        <p style="margin-bottom: 8px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Payment Breakdown</p>
        <table style="width: 100%; font-size: 14px;">
            <tr>
                <td style="padding: 6px 0; color: #475569;">Original Bill Amount</td>
                <td style="padding: 6px 0; text-align: right;" class="bold">NGN {{ number_format($pb['original_bill_amount'] / 100, 2) }}</td>
            </tr>
            @if(!empty($pb['previous_payments']))
                <tr>
                    <td colspan="2" style="padding: 6px 0; color: #64748b; font-size: 12px; font-weight: bold;">Previous Payments Made:</td>
                </tr>
                @foreach($pb['previous_payments'] as $prev)
                    <tr>
                        <td style="padding: 2px 0 2px 12px; color: #64748b; font-size: 12px;">Ref: {{ $prev['reference'] }} &bull; {{ $prev['paid_at'] }}</td>
                        <td style="padding: 2px 0; text-align: right; color: #64748b; font-size: 12px;">NGN {{ number_format($prev['amount'] / 100, 2) }}</td>
                    </tr>
                @endforeach
            @endif
            <tr>
                <td style="padding: 6px 0; color: #475569;">Current Payment</td>
                <td style="padding: 6px 0; text-align: right; color: #16a34a;" class="bold">NGN {{ number_format($pb['current_payment_amount'] / 100, 2) }}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0 6px 0; color: #0f172a; border-top: 1px dashed #cbd5e1;" class="bold">Total Cumulative Paid</td>
                <td style="padding: 10px 0 6px 0; text-align: right; color: #0f172a; border-top: 1px dashed #cbd5e1;" class="bold">NGN {{ number_format($pb['total_paid_to_date'] / 100, 2) }}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: {{ $pb['remaining_balance'] > 0 ? '#b45309' : '#16a34a' }};" class="bold">Remaining Balance</td>
                <td style="padding: 6px 0; text-align: right; color: {{ $pb['remaining_balance'] > 0 ? '#b45309' : '#16a34a' }};" class="bold">NGN {{ number_format($pb['remaining_balance'] / 100, 2) }}</td>
            </tr>
        </table>
        @endif
    </div>
    
    <p>Your official receipt is attached to this email as a PDF.</p>
    
    <div class="button-container">
        <a href="{{ route('resident.billing.index') }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">View Billing History</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you have any questions regarding this payment, please contact our support team.</p>
@endsection
