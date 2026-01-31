<x-mail::message>
# You have been invited to join Kontrol

Hello,

You have been invited to manage **{{ $estateName }}** on Kontrol.

To get started, please set up your password by clicking the button below. This will give you access to your estate dashboard.

<x-mail::button :url="$invitationUrl">
Set up your password
</x-mail::button>

<x-slot:subcopy>
This invitation link is valid for 72 hours. If you did not expect this invitation, you can safely ignore this email.
</x-slot:subcopy>

Thanks,<br>
The Kontrol Team
</x-mail::message>
