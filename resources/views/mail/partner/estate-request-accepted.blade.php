@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #ecfdf5; color: #065f46;">Partner Update</div>
    <h1>Estate Onboarding Request Accepted</h1>

    <p>Hello <span class="bold">{{ $partnerName }}</span>,</p>

    <p>Great news! your estate onboarding request for <span class="bold">{{ $estateName }}</span> has been approved by our
        team.</p>

    <p>We've created the estate workspace and sent an invitation to the estate contact so they can finish setup. You'll
        start earning commission once residents are active on Kontrol, per your partner agreement.</p>

    <div
        style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0; font-size: 14px; color: #475569;">
        <strong>What happens next</strong>
        <ul style="margin: 12px 0 0; padding-left: 18px;">
            <li style="margin-bottom: 6px;">Estate admins complete onboarding from their invite email</li>
            <li style="margin-bottom: 6px;">Track status and earnings in your Partner Portal</li>
            <li>Settlements follow your commission plan schedule</li>
        </ul>
    </div>

    <div class="divider"></div>

    <p style="font-size: 14px; color: #64748b;">View this estate in your <a href="{{ url('/partner/partner-requests') }}">My
            Estates</a> pipeline or check <a href="{{ url('/partner/earnings') }}">Earnings</a> as activity starts.</p>
@endsection