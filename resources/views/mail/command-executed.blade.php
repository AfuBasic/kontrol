@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f1f5f9; color: #475569;">System Report</div>
    <h1>Scheduled Task Completed</h1>
    
    <p>The following scheduled console command has run and finished processing:</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0; text-align: left;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Execution Details</h3>
        
        <div style="margin-top: 16px;">
            <p style="margin-top: 0; font-weight: bold; font-size: 14px; color: #0f172a;">Message / Output:</p>
            <p style="font-size: 14px; color: #334155; white-space: pre-wrap; font-family: monospace; line-height: 1.6; margin-bottom: 0; background-color: #eff6ff; padding: 12px; border-radius: 6px; border: 1px dashed #bfdbfe;">{{ $bodyText }}</p>
        </div>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 12px; color: #64748b;">This notification was sent automatically by the Kontrol scheduler.</p>
@endsection
