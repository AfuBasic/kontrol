<?php

namespace App\Services\Platform;

class PlatformAccessResult
{
    public function __construct(
        public readonly bool $allowed,
        public readonly string $reason,
        public readonly ?string $redirectUrl = null,
        public readonly ?PlatformContext $context = null
    ) {}

    public static function allow(PlatformContext $context): self
    {
        return new self(allowed: true, reason: 'Platform access permitted', context: $context);
    }

    public static function deny(string $reason, string $redirectUrl, PlatformContext $context): self
    {
        return new self(allowed: false, reason: $reason, redirectUrl: $redirectUrl, context: $context);
    }
}
