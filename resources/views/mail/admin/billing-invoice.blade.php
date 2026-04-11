@extends('mail.layout')

@section('badge-bg', $invoice->status === 'paid' ? '#ecfdf5' : '#ecfdf5')
@section('badge-color', $invoice->status === 'paid' ? '#065f46' : '#065f46')

@section('content')
    <div class="badge">{{ $invoice->status === 'paid' ? 'Payment Received' : 'Billing Notification' }}</div>
    <h1>{{ $invoice->status === 'paid' ? 'Invoice Paid' : 'Invoice Generated' }}</h1>

    <p>Dear Administrator,</p>

    @if($invoice->status === 'paid')
        <p>Thank you! Payment for your estate subscription invoice has been successfully received and processed.</p>
    @else
        <p>A new invoice has been generated for your estate subscription. Please find the details of the charge below.</p>
    @endif
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Number</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 700; text-align: right;">#{{ $invoice->invoice_number }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Billing Period</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 700; text-align: right;">
                    {{ $invoice->billing_period_start->format('M d, Y') }} – {{ $invoice->billing_period_end->format('M d, Y') }}
                </td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Due Date</td>
                <td style="padding-bottom: 12px; color: #ef4444; font-weight: 700; text-align: right;">{{ $invoice->due_date->format('M d, Y') }}</td>
            </tr>
            <tr>
                <td style="padding-top: 12px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Active Residents</td>
                <td style="padding-top: 12px; border-top: 1px solid #f1f5f9; color: #0f172a; font-weight: 700; text-align: right;">{{ $invoice->resident_count }}</td>
            </tr>
            <tr>
                <td style="padding-top: 12px; color: #0f172a; font-size: 16px; font-weight: 700;">Grand Total</td>
                <td style="padding-top: 12px; color: #4f46e5; font-size: 20px; font-weight: 800; text-align: right;">₦{{ number_format($invoice->amount / 100, 2) }}</td>
            </tr>
        </table>
    </div>

    <div style="background-color: #fefce8; border-radius: 12px; padding: 20px; font-size: 14px; color: #854d0e; border: 1px solid #fef08a; margin-bottom: 32px;">
        <strong>Calculation Detail</strong><br>
        Your plan price (₦{{ number_format($invoice->plan->price / 100, 2) }}) multiplied by {{ $invoice->resident_count }} registered residents.
    </div>
    
    <div class="button-container">
        <a href="{{ route('admin.billing.invoices.show', $invoice) }}" class="button shadow">View Invoice Details</a>
    </div>

    <div class="divider"></div>

    @if($invoice->status === 'paid')
        <p style="font-size: 14px; color: #64748b;">Thank you for your prompt payment. Your invoice has been marked as paid and processed successfully.</p>
    @else
        <p style="font-size: 14px; color: #64748b;">You can settle this invoice directly from your dashboard using Paystack secured payment gateway.</p>
    @endif
@endsection
