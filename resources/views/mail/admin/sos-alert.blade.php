@extends('mail.layout')

@section('content')
    <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 12px; background-color: #fee2e2; border-radius: 50%; margin-bottom: 16px;">
            <img src="https://img.icons8.com/ios-filled/100/dc2626/shield-alert.png" width="48" height="48" alt="Alert">
        </div>
        <h1 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">INTRUSION ALERT</h1>
        <p style="color: #64748b; margin-top: 8px; font-weight: 600;">Emergency SOS Triggered in {{ $estateName }}</p>
    </div>

    <div style="background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Incident Details</h2>
        
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Resident</p>
                    <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 800;">{{ $residentName }}</p>
                </td>
                <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Phone</p>
                    <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 800;">{{ $residentPhone }}</p>
                </td>
            </tr>
            <tr>
                <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Location</p>
                    <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 800;">{{ $address }}</p>
                </td>
                <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Time</p>
                    <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 800;">{{ $triggeredAt }}</p>
                </td>
            </tr>
        </table>
    </div>

    @if($emergencyContacts->isNotEmpty())
        <div style="margin-bottom: 24px;">
            <h2 style="font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Emergency Contacts</h2>
            @foreach($emergencyContacts as $contact)
                <div style="background-color: #ffffff; border-radius: 16px; border: 1px solid #f1f5f9; padding: 16px; margin-bottom: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td>
                                <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 700;">{{ $contact->name }}</p>
                                <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">{{ $contact->phone }}</p>
                            </td>
                            <td align="right">
                                <a href="tel:{{ $contact->phone }}" style="display: inline-block; padding: 8px 12px; background-color: #f1f5f9; color: #475569; text-decoration: none; border-radius: 10px; font-size: 12px; font-weight: 700;">CALL</a>
                            </td>
                        </tr>
                    </table>
                </div>
            @endforeach
        </div>
    @endif

    <div style="text-align: center; margin-top: 32px;">
        <a href="{{ config('app.url') }}/admin/sos" style="display: inline-block; padding: 16px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 16px; font-size: 16px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">View in Dashboard</a>
    </div>

    <div class="divider" style="margin: 32px 0; border-top: 1px solid #f1f5f9;"></div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 18px; text-align: center; margin-bottom: 0;">
        This is an automated emergency alert. Security personnel have been notified and are responding. Please follow estate protocols for emergency management.
    </p>
@endsection
