@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #eff6ff; color: #1d4ed8;">Support Inquiry</div>
    <h1>New Support Inquiry</h1>
    
    <p>You have received a new contact inquiry from the Kontrol public website.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0; text-align: left;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Inquiry Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #475569;">
            <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 80px;">From:</td>
                <td style="padding: 6px 0;">{{ $name }} ({{ $email }})</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: bold;">Subject:</td>
                <td style="padding: 6px 0;">{{ $subjectText }}</td>
            </tr>
        </table>
        
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="margin-top: 0; font-weight: bold; font-size: 14px; color: #0f172a;">Message:</p>
            <p style="font-size: 14px; color: #334155; white-space: pre-wrap; line-height: 1.6; margin-bottom: 0;">{{ $messageText }}</p>
        </div>
    </div>
    
    <div class="button-container">
        <a href="mailto:{{ $email }}?subject=Re: {{ rawurlencode($subjectText) }}" class="button shadow">Reply to Submitter</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 12px; color: #64748b;">This email was sent automatically from the public support form on Kontrol.</p>
@endsection
