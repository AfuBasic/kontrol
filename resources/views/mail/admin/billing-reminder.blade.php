@extends('mail.layout')

@section('badge-bg', '#fef3c7')
@section('badge-color', '#92400e')

@section('content')
    <div class="badge">Billing Reminder</div>
    <h1>Upcoming Subscription Charge</h1>
    
    <p>Dear Administrator,</p>
    
    <p>This is a friendly reminder that an invoice will be generated in **7 days** for your estate subscription.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estate->name }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Current Plan</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estate->subscription?->plan->name ?? 'Estate Basic' }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Active Residents</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estate->residents()->active()->count() }}</td>
            </tr>
            <tr>
                <td style="padding-top: 12px; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Expected Date</td>
                <td style="padding-top: 12px; border-top: 1px solid #f1f5f9; color: #0f172a; font-weight: 700; text-align: right;">{{ now()->addDays(7)->format('M d, Y') }}</td>
            </tr>
        </table>
    </div>

    <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #1e40af; border: 1px solid #bfdbfe; margin-bottom: 32px;">
        <strong>Important Details</strong>
        <ul style="margin: 10px 0 0; padding-left: 20px;">
            <li>Invoice amount = Plan price × Number of active residents</li>
            <li>Payment will be due 7 days after invoice generation</li>
            <li>A grace period of 5 additional days will apply after the due date</li>
        </ul>
    </div>
    
    <div class="button-container">
        <a href="{{ route('admin.billing.index') }}" class="button shadow">View Billing Dashboard</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">Please ensure you have sufficient funds available to cover the upcoming invoice to maintain uninterrupted service.</p>
@endsection
