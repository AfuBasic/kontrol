<x-mail::message>
# Reset Your Password

Hello {{ $userName }},

We received a request to reset your password. Click the button below to set a new password.

<x-mail::button :url="$resetUrl">
Reset Password
</x-mail::button>

This link will expire in **60 minutes**. If you did not request a password reset, no action is needed — your account is safe.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
