@extends('errors.layout')

@section('title', 'Page Expired')
@section('code', '419')
@section('heading', 'Session Expired')

@section('icon')
<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
@endsection

@section('message', "Your session has expired due to inactivity. Please refresh the page and try again.")
