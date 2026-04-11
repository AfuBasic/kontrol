@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">Approved</div>
    <h1>Welcome home!</h1>
    
    <p>Hello <span class="bold">{{ $name }}</span>,</p>
    
    <p>We are delighted to inform you that your application to join <span class="bold">{{ $estateName }}</span> has been approved by the estate administration.</p>
    
    <p>You now have full access to the Kontrol app and all the community features available to your estate.</p>
    
    <div class="button-container">
        <a href="{{ $url }}" class="button shadow" style="background-color: #059669; box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.3);">Log In to Portal</a>
    </div>
    
    <div class="divider"></div>
    
    <p>We look forward to providing you with a seamless and secure living experience.</p>
    
    <p style="font-size: 14px; margin-top: 32px; color: #64748b;">If you have any questions, please reach out to your estate administrator.</p>
@endsection
