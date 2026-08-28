<?php

namespace App\Services\Security;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class PendingDeviceAuthorizationCookie
{
    public function name(): string
    {
        return (string) config('device-trust.pending_cookie');
    }

    public function read(Request $request): ?string
    {
        $value = $request->cookie($this->name());

        if (! is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }

    public function make(string $ulid): SymfonyCookie
    {
        return Cookie::make(
            name: $this->name(),
            value: $ulid,
            minutes: (int) config('device-trust.authorization_ttl_minutes'),
            path: '/',
            domain: config('session.domain'),
            secure: (bool) config('session.secure', true),
            httpOnly: true,
            raw: false,
            sameSite: config('session.same_site', 'lax'),
        );
    }

    public function queue(string $ulid): void
    {
        Cookie::queue($this->make($ulid));
    }

    public function forget(): SymfonyCookie
    {
        return Cookie::forget($this->name());
    }

    public function clear(): void
    {
        Cookie::queue($this->forget());
    }
}
