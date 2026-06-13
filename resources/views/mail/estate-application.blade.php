@extends('mail.layout')

@section('content')
<h1>New Estate Application</h1>
<p>A new estate has applied for a Kontrol trial.</p>

<table style="width: 100%; margin-top: 20px; margin-bottom: 30px;">
    <tr>
        <td class="bold" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 140px;">Estate Name:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{{ $application->estate_name }}</td>
    </tr>
    <tr>
        <td class="bold" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">Location:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{{ $application->address }}</td>
    </tr>
    <tr>
        <td class="bold" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">Contact Email:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{{ $application->email }}</td>
    </tr>
    <tr>
        <td class="bold" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">Contact Phone:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{{ $application->phone ?: 'Not provided' }}</td>
    </tr>
    <tr>
        <td class="bold" style="padding: 10px 0; vertical-align: top;">Notes/Name:</td>
        <td style="padding: 10px 0; white-space: pre-wrap;">{{ $application->notes }}</td>
    </tr>
</table>

<div class="button-container">
    <a href="{{ config('app.url') }}/login" class="button">Review in Dashboard</a>
</div>
@endsection
