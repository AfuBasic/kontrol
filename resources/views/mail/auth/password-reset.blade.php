@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fff1f2; color: #9f1239;">Security</div>
    <h1>Reset your password</h1>
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    <p>We received a request to reset the password for your {{ config('app.name') }} account. Click the button below to choose a new password.</p>
    
    <div class="button-container">
        <a href="{{ $resetUrl }}" class="button shadow" style="background-color: #be185d; box-shadow: 0 4px 14px 0 rgba(190, 24, 93, 0.3);">Reset Password</a>
    </div>
    
    <div style="background-color: #fffbeb; border-radius: 12px; padding: 20px; font-size: 14px; color: #92400e; border: 1px solid #fde68a; margin-bottom: 32px;">
        <strong>Link Expiry</strong><br>
        This link will expire in 60 minutes. If you did not request a password reset, please ignore this email.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px;">If you're having trouble, copy and paste this link in your browser:</p>
    <p style="font-size: 13px; word-break: break-all; color: #6366f1;">{{ $resetUrl }}</p>
@endsection
