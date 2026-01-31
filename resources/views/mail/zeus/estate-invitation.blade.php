<x-mail::message>
# Welcome to Kontrol

You've been invited to manage **{{ $estateName }}** on Kontrol.

To get started, please set up your account password by clicking the button below:

<x-mail::button :url="$invitationUrl">
Set Up Your Password
</x-mail::button>

This invitation link will expire in 72 hours.

If you didn't expect this invitation, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
