@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef3c7; color: #d97706;">Trial Ending</div>
    <h1>Your free trial is ending soon</h1>
    
    <p>Hello <span class="bold">{{ $name }}</span>,</p>
    
    <p>Your access trial for <span class="bold">{{ $estateName }}</span> is ending soon on <span class="bold">{{ $trialEndsAt }}</span>.</p>
    
    <p>To ensure uninterrupted access to your estate features, visitor management, payments, and notifications, please visit your billing dashboard to subscribe to a plan.</p>
    
    <div class="button-container">
        <a href="{{ $url }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">Manage Subscription</a>
    </div>
    
    <div class="divider"></div>
    
    <p>If you have any questions, please contact your estate administration.</p>
    
    <p style="font-size: 14px; margin-top: 32px; color: #64748b;">Thank you for using Kontrol!</p>
@endsection
