@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef2f2; color: #991b1b;">Partner Update</div>
    <h1>Estate Onboarding Request Rejected</h1>
    
    <p>Hello <span class="bold">{{ $partnerName }}</span>,</p>
    
    <p>We're writing to provide an update regarding the estate onboarding request you submitted for <span class="bold">{{ $estateName }}</span>.</p>
    
    <p>After review by our team, we regret to inform you that this estate onboarding request has been declined at this time.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0; font-size: 14px; color: #475569;">
    	<strong>Reason for Rejection:</strong><br>
    	<p style="margin: 8px 0 0;">{{ $rejectionReason ?? 'No additional details provided.' }}</p>
    </div>
    
    <p>If you have any supporting documentation or further context that could help us re-evaluate this request, please feel free to update the request details via the Partner Portal or contact our support team.</p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">You can track and manage all your estate onboarding requests from your <a href="{{ url('/partner/partner-requests') }}">Partner requests dashboard</a>.</p>
@endsection
