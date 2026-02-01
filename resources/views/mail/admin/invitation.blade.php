<x-mail::message>
# Hello {{ $userName }},

You have been invited to join **{{ $estateName }}** as an Administrator.

Please click the button below to accept the invitation and set up your account.

<x-mail::button :url="$invitationUrl">
Accept Invitation
</x-mail::button>

This link will expire in 72 hours.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
