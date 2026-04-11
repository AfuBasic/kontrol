@extends('mail.layout')

@section('content')
    <div class="badge">Registration</div>
    <h1>Verify your email address</h1>
    
    <p>Hello <span class="bold">{{ $name }}</span>,</p>
    
    <p>Welcome to <span class="bold">{{ $estateName }}</span>! We're excited to have you join our community. Before we can finalize your application, we need to verify your email address.</p>
    
    <div class="button-container">
        <a href="{{ $url }}" class="button shadow">Verify Email Address</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px;">If you're having trouble clicking the button, copy and paste the link below into your web browser:</p>
    <p style="font-size: 13px; word-break: break-all; color: #6366f1;">{{ $url }}</p>
    
    <p style="font-size: 14px; margin-top: 32px;">If you did not create an account, no further action is required.</p>
@endsection
