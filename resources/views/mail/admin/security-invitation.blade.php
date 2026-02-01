<x-mail::message>
@if($isPasswordReset ?? false)
# Password Reset Request

Hello {{ $userName }},

A password reset was requested for your security account at **{{ $estateName }}**.

To reset your password and reactivate your account access, please click the button below.
Note: Your account will remain pending until you set a new password using the link below.
@else
# Welcome to {{ $estateName }}

Hello {{ $userName }},

You have been invited to join **{{ $estateName }}** as a security personnel on Kontrol.

To complete your registration, please set up your password by clicking the button below.
@endif

<x-mail::button :url="$invitationUrl">
Set up your password
</x-mail::button>

<x-slot:subcopy>
This invitation link is valid for 72 hours. If you did not expect this invitation, you can safely ignore this email.
</x-slot:subcopy>

Thanks,<br>
The {{ $estateName }} Team
</x-mail::message>
