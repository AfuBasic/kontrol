@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef2f2; color: #991b1b;">Access Inactive</div>
    <h1>Your access is currently inactive</h1>
    
    <p>Hello <span class="bold">{{ $name }}</span>,</p>
    
    <p>Your access subscription for <span class="bold">{{ $estateName }}</span> has expired.</p>
    
    <p>Some features of the Kontrol mobile app are currently restricted. To restore full access to visitor creation, payments, and other community tools, please visit your billing dashboard to renew your subscription.</p>
    
    <div class="button-container">
        <a href="{{ $url }}" class="button shadow" style="background-color: #ef4444; box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.3);">Restore Access</a>
    </div>
    
    <div class="divider"></div>
    
    <p>If you have any questions, please contact your estate administration.</p>
    
    <p style="font-size: 14px; margin-top: 32px; color: #64748b;">Thank you for using Kontrol!</p>
@endsection
