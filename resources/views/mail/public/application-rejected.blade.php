@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef2f2; color: #991b1b;">Update</div>
    <h1>Application update</h1>
    
    <p>Hello <span class="bold">{{ $applicantName }}</span>,</p>
    
    <p>We're writing to provide an update regarding your application to join <span class="bold">{{ $estateName }}</span>.</p>
    
    <p>After a thorough review by the estate administration, we regret to inform you that your application has been declined at this time.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0; font-size: 14px; color: #475569;">
        <strong>Note from Administration:</strong><br>
        <p style="margin: 8px 0 0;">{{ $rejectionReason ?? 'No additional details provided.' }}</p>
    </div>
    
    <p>While we cannot proceed with your application currently, we appreciate your interest in our community.</p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">If you believe there has been an error or have additional information to provide, you may contact the estate management office directly.</p>
@endsection
