@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef3c7; color: #d97706;">Subscription Expiring</div>
    <h1>Your subscription will expire soon</h1>
    
    <p>Hello <span class="bold">{{ $name }}</span>,</p>
    
    <p>Your access subscription for <span class="bold">{{ $estateName }}</span> will expire in <span class="bold">{{ $daysLeft }} days</span>.</p>
    
    <p>To maintain full access to all estate features, visitor management, dues/payments, and notifications, please visit your billing dashboard to renew your subscription.</p>
    
    <div class="button-container">
        <a href="{{ $url }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">Renew Subscription</a>
    </div>
    
    <div class="divider"></div>
    
    <p>If you have any questions, please contact your estate administration.</p>
    
    <p style="font-size: 14px; margin-top: 32px; color: #64748b;">Thank you for using Kontrol!</p>
@endsection
