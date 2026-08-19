@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #eef2ff; color: #4338ca;">Security</div>
    <h1>Device access removed</h1>

    <p>Hello <span class="bold">{{ $userName }}</span>,</p>

    <p><span class="bold">{{ $displayName }}</span> can no longer sign in as a trusted device. The next sign-in from that device will need to be authorized again.</p>

    <div class="button-container">
        <a href="{{ $devicesUrl }}" class="button">Review trusted devices</a>
    </div>
@endsection
