<x-mail::message>
# Login Verification

Hello {{ $userName }},

We noticed a sign-in attempt from a new device. Please use the verification code below to complete your login.

<x-mail::panel>
<div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
{{ $code }}
</div>
</x-mail::panel>

This code expires in **10 minutes**. If you did not attempt to log in, please change your password immediately.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
