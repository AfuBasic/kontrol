@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #eff6ff; color: #1e40af;">New Invoice</div>
    <h1>Invoice #{{ $invoice->invoice_number }}</h1>
    
    <p>Hello <span class="bold">{{ $invoice->user->first_name }}</span>,</p>
    
    <p>A new invoice has been generated for your subscription at <span class="bold">{{ $invoice->estate->name }}</span>. Please find the details below:</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #475569;">Amount Due</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $invoice->formatted_amount }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #475569;">Due Date</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $invoice->due_date->format('M d, Y') }}</td>
            </tr>
        </table>
    </div>

    @if($invoice->user->hasPaymentMethod())
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
        <p style="margin-bottom: 0; color: #166534; font-size: 14px;">
            <span class="bold">Note:</span> You have a payment method on file. We will attempt to charge your card automatically on the due date, so you don't have to worry about manual payment.
        </p>
    </div>
    @endif
    
    <p>If you prefer to pay manually, you can do so by clicking the button below:</p>
    
    <div class="button-container">
        <a href="{{ route('resident.billing.index') }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">View & Pay Invoice</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">An official PDF copy of this invoice is attached to this email for your records.</p>
@endsection
