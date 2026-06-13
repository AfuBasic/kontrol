@extends('mail.layout')

@section('content')
<h1>New Support Request</h1>
<p>You have received a new support request from the public website.</p>

<table style="width: 100%; margin-top: 20px;">
    <tr>
        <td class="bold" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; width: 100px;">Name:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{{ $data['name'] }}</td>
    </tr>
    <tr>
        <td class="bold" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">Email:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">{{ $data['email'] }}</td>
    </tr>
    <tr>
        <td class="bold" style="padding: 10px 0; vertical-align: top;">Message:</td>
        <td style="padding: 10px 0; white-space: pre-wrap;">{{ $data['message'] }}</td>
    </tr>
</table>
@endsection
