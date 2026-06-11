@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f0fdf4; color: #166534;">New Resident</div>
    <h1>Resident Joined</h1>
    
    <p>Hello Admin,</p>
    
    <p>A new resident has joined <span class="bold">{{ $estateName }}</span> via a property owner's delegation.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Resident Name</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $residentName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Email Address</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $residentEmail }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Property Owner</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $ownerName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 14px;">Owner Email</td>
                <td style="color: #0f172a; font-weight: 600; text-align: right;">{{ $ownerEmail }}</td>
            </tr>
        </table>
    </div>
    
    <div class="button-container">
        <a href="{{ $url }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">View Residents</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">This notification was generated automatically because the resident accepted the invitation sent by their property owner.</p>
@endsection
