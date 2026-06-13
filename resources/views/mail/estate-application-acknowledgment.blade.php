@extends('mail.layout')

@section('content')
<h1>Thanks for applying to Kontrol!</h1>

<p>Hi there,</p>
<p>We have received your application for <span class="bold">{{ $application->estate_name }}</span> to start using Kontrol.</p>
<p>Our team is currently reviewing your details. We will reach out to you shortly at the email or phone number you provided to discuss the next steps and get your estate set up.</p>
<p>If you have any urgent questions in the meantime, feel free to reply directly to this email or reach us through our support page.</p>

<p style="margin-top: 30px;">Best regards,<br>The Kontrol Team</p>
@endsection
