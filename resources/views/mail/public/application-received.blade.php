@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">Received</div>
    <h1>Application received</h1>
    
    <p>Hello <span class="bold">{{ $applicantName }}</span>,</p>
    
    <p>Thank you for your interest in joining <span class="bold">{{ $estateName }}</span>. We've successfully received your application and it has been sent to the estate administration for review.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">What's next?</h3>
        <ul style="padding-left: 20px; color: #475569; font-size: 14px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">The estate administrator will review your details.</li>
            <li style="margin-bottom: 8px;">They may contact you if additional information is needed.</li>
            <li>You'll receive an email as soon as a decision is made.</li>
        </ul>
    </div>
    
    <p>You can track the status of your application by visiting our portal at any time.</p>
    
    <div class="button-container">
        <a href="{{ $statusUrl }}" class="button shadow">Check Application Status</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you need to update any information in your application, please reply to this email or contact support.</p>
@endsection
