<x-mail::message>
# Welcome to {{ $estateName }}

Hello {{ $userName }},

You have been invited to join **{{ $estateName }}** as a resident on Kontrol.

To complete your registration, please set up your password by clicking the button below.

<x-mail::button :url="$invitationUrl">
Set up your password
</x-mail::button>

<x-slot:subcopy>
This invitation link is valid for 72 hours. If you did not expect this invitation, you can safely ignore this email.
</x-slot:subcopy>

Thanks,<br>
The {{ $estateName }} Team
</x-mail::message>
