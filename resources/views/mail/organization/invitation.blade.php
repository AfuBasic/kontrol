@extends('mail.layout')

@section('content')
    @if($isExistingUser ?? false)
        <div class="badge" style="background-color: #fefcf1; color: #92400e; border: 1px solid #fde68a;">Role Added</div>
        <h1>New Role Added</h1>

        <p>Hello <span class="bold">{{ $userName }}</span>,</p>

        <p>You have been assigned the <span class="bold">{{ $roleTitle }}</span> role for <span class="bold">{{ $organizationName }}</span> at <span class="bold">{{ $estateName }}</span> on your existing Kontrol account.</p>
    @else
        <div class="badge" style="background-color: #f0fdf4; color: #166534;">Invitation</div>
        <h1>Join {{ $organizationName }} on Kontrol</h1>

        <p>Hello <span class="bold">{{ $userName }}</span>,</p>

        <p>You've been invited to join <span class="bold">{{ $organizationName }}</span> at <span class="bold">{{ $estateName }}</span> as an <span class="bold">{{ $roleTitle }}</span> on Kontrol.</p>
    @endif

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Organization</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $organizationName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Estate</td>
                <td style="padding-bottom: 8px; color: #0f172a; font-weight: 700; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Role</td>
                <td style="color: #0f172a; font-weight: 700; text-align: right;">{{ $roleTitle }}</td>
            </tr>
        </table>
    </div>

    @if($isExistingUser ?? false)
        <p>You can access your organization management dashboard immediately using your existing Kontrol credentials.</p>

        <div class="button-container">
            <a href="{{ $actionUrl }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">Go to Dashboard</a>
        </div>

        <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; font-size: 14px; color: #166534; border: 1px solid #bbf7d0;">
            <strong>Already logged in?</strong><br>
            If you are currently signed in, simply switch to <strong>{{ $organizationName }}</strong> from your account menu.
        </div>
    @else
        <p>As {{ $roleTitle === 'Administrator' ? 'an Administrator' : 'a Staff Member' }}, you'll be able to manage visitors, view entry records, and coordinate organization operations inside the estate.</p>

        <div class="button-container">
            <a href="{{ $actionUrl }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">Access Organization Panel</a>
        </div>

        <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; font-size: 14px; color: #0369a1; border: 1px solid #bae6fd;">
            <strong>Magic Link</strong><br>
            This secure login link will expire in 72 hours. Please use it within this timeframe to set up your account and get started.
        </div>
    @endif

    <div class="divider"></div>

    <p style="font-size: 14px; color: #64748b;">If you have any questions, please reach out to your estate administrator or contact Kontrol support.</p>
@endsection
