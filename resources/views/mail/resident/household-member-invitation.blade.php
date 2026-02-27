<x-mail::message>
@if($passwordReset ?? false)
# Password Reset

Hello {{ $userName }},

{{ $primaryResidentName }} has requested a password reset for your household member account at **{{ $estateName }}** on Kontrol.

Click the button below to set a new password.

<x-mail::button :url="$invitationUrl">
Reset Your Password
</x-mail::button>
@else
# Welcome to {{ $estateName }}

Hello {{ $userName }},

{{ $primaryResidentName }} has added you as a household member at **{{ $estateName }}** on Kontrol.

As a household member, you can:
- Generate visitor access codes
- View the estate community board
- Stay updated with estate activity

To get started, please set up your password by clicking the button below.

<x-mail::button :url="$invitationUrl">
Set up your password
</x-mail::button>
@endif

<x-slot:subcopy>
This link is valid for 72 hours. If you did not expect this email, you can safely ignore it.
</x-slot:subcopy>

Thanks,<br>
The {{ $estateName }} Team
</x-mail::message>
