@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">Payment Received</div>
    <h1>Thank you for your payment!</h1>
    
    <p>Hello <span class="bold">{{ $invoice->user->first_name }}</span>,</p>
    
    <p>We've successfully received your payment of <span class="bold">{{ $invoice->formatted_amount }}</span> for your subscription at <span class="bold">{{ $invoice->estate->name }}</span>.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin-bottom: 8px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Details</p>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #475569;">Invoice Number</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">#{{ $invoice->invoice_number }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #475569;">Amount Paid</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $invoice->formatted_amount }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #475569;">Period</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $invoice->billing_period_start->format('M d') }} - {{ $invoice->billing_period_end->format('M d, Y') }}</td>
            </tr>
        </table>
    </div>
    
    <p>Your account is now active and up-to-date. You can find your official receipt attached to this email as a PDF.</p>
    
    <div class="button-container">
        <a href="{{ route('resident.billing.index') }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">View Billing History</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you have any questions regarding this payment, please contact our support team.</p>
@endsection
