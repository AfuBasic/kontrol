@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0f9ff; color: #075985;">Verification</div>
    <h1>Login verification</h1>
    
    <p>Hello <span class="bold">{{ $userName }}</span>,</p>
    
    <p>Please use the following verification code to complete your login attempt to {{ config('app.name') }}.</p>
    
    <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center; margin: 32px 0;">
        <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; font-weight: 600;">Your Verification Code</div>
        <div style="font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace; color: #4f46e5; margin: 0;">{{ $code }}</div>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #1e40af; border: 1px solid #bfdbfe;">
        <strong>Code Expiry</strong><br>
        This code is valid for 10 minutes. For your security, never share this code with anyone.
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b; font-style: italic;">If you did not request this code, your account might be under threat. Please change your password immediately.</p>
@endsection
