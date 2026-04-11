@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #fff7ed; color: #9a3412;">Review Required</div>
    <h1>New Resident Request</h1>
    
    <p>Hello Admin,</p>
    
    <p>A new resident has requested access to <span class="bold">{{ $estateName }}</span>. Please review their details and process the application.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Resident Name</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $residentName }}</td>
            </tr>
            <tr>
                <td style="color: #64748b; font-size: 14px;">Email Address</td>
                <td style="color: #0f172a; font-weight: 600; text-align: right;">{{ $residentEmail }}</td>
            </tr>
        </table>
    </div>
    
    <div class="button-container">
        <a href="{{ $url }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">Review Application</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #64748b;">This request was generated automatically through your estate's registration portal.</p>
@endsection
