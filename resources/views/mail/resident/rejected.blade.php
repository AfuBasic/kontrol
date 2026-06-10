@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef2f2; color: #991b1b;">Application Rejected</div>
    <h1>Update on your application</h1>
    
    <p>Hello <span class="bold">{{ $name }}</span>,</p>
    
    <p>Thank you for your interest in joining <span class="bold">{{ $estateName }}</span>.</p>
    
    <p>Unfortunately, your application has not been approved at this time.</p>
    
    <p>If you believe this is a mistake, please contact the estate administration directly.</p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">Thank you.</p>
@endsection
