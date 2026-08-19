<?php

namespace App\Services\Security;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class DeviceTrustCookie
{
    public function name(): string
    {
        return (string) config('device-trust.cookie');
    }

    public function read(Request $request): ?string
    {
        $value = $request->cookie($this->name());

        if (! is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }

    public function hash(string $plainTextToken): string
    {
        return hash('sha256', $plainTextToken);
    }

    public function generatePlainTextToken(): string
    {
        return Str::random(64);
    }

    public function make(string $plainTextToken): SymfonyCookie
    {
        return Cookie::make(
            name: $this->name(),
            value: $plainTextToken,
            minutes: (int) config('device-trust.cookie_lifetime_minutes'),
            path: '/',
            domain: config('session.domain'),
            secure: (bool) config('session.secure', true),
            httpOnly: true,
            raw: false,
            sameSite: config('session.same_site', 'lax'),
        );
    }

    public function queue(string $plainTextToken): void
    {
        Cookie::queue($this->make($plainTextToken));
    }

    public function forget(): SymfonyCookie
    {
        return Cookie::forget($this->name());
    }
}
