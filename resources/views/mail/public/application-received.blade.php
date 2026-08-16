@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">Received</div>
    <h1>Application Received</h1>
    
    <p>Hello <span class="bold">{{ $applicantName }}</span>,</p>
    
    <p>Thank you for applying to bring <span class="bold">Kontrol</span> to <span class="bold">{{ $estateName }}</span>. We've received your application and our team will review it shortly.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">What happens next?</h3>
        <ul style="padding-left: 20px; color: #475569; font-size: 14px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">Our team will review your application details.</li>
            <li style="margin-bottom: 8px;">We may reach out to you for additional information.</li>
            <li>You'll receive an email once a decision has been made.</li>
        </ul>
    </div>
    
    <p style="font-size: 14px; color: #64748b;">If you have any questions or need to update your information, please reply to this email.</p>
@endsection
