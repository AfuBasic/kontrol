@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fef2f2; color: #b91c1c;">Security</div>
    <h1>Sign-in attempt blocked</h1>

    <p>Hello <span class="bold">{{ $userName }}</span>,</p>

    <p>The new-device request{{ $displayName ? ' from '.$displayName : '' }} was denied and the device was not added to your Kontrol account.</p>

    <p>If this wasn't you, your account remains protected. You can review your trusted devices at any time.</p>

    <div class="button-container">
        <a href="{{ $devicesUrl }}" class="button">Review trusted devices</a>
    </div>
@endsection
