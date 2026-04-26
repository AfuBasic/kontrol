@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef2f2; color: #991b1b;">Action Required</div>
    <h1>Payment could not be processed</h1>
    
    <p>Hello <span class="bold">{{ $invoice->user->first_name }}</span>,</p>
    
    <p>We attempted to process your subscription payment for <span class="bold">{{ $invoice->estate->name }}</span>, but unfortunately, the transaction could not be completed.</p>
    
    <div style="background-color: #fff1f2; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #fecdd3;">
        <p style="margin-bottom: 8px; font-size: 14px; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em;">Failure Reason</p>
        <p style="margin-bottom: 0; color: #be123c;" class="bold">{{ $reason }}</p>
    </div>

    @if($attempts < $maxAttempts)
        <p>To keep your access active and avoid service interruptions, please update your payment method or ensure your card has sufficient funds. We will attempt to charge your card again automatically in 24 hours.</p>
    @else
        <p>This was our <span class="bold">final attempt</span> to charge your card automatically. To keep your access active and avoid service interruptions, you must now <span class="bold">manually</span> pay this invoice from your dashboard.</p>
    @endif
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin-bottom: 8px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Details</p>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #475569;">Invoice Number</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">#{{ $invoice->invoice_number }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #475569;">Amount Due</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $invoice->formatted_amount }}</td>
            </tr>
        </table>
    </div>
    
    <div class="button-container">
        <a href="{{ route('resident.billing.index') }}" class="button shadow" style="background-color: #dc2626; box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.3);">Update Payment Method</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you've already resolved this issue, you can safely ignore this message.</p>
@endsection
