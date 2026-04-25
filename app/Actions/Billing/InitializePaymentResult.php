<?php

namespace App\Actions\Billing;

class InitializePaymentResult
{
    /**
     * @param  'success'|'info'|null  $flashType
     */
    public function __construct(
        public readonly string $redirectUrl,
        public readonly ?string $flashType = null,
        public readonly ?string $flashMessage = null,
    ) {}

    public static function redirect(string $url): self
    {
        return new self($url);
    }

    /**
     * @param  'success'|'info'  $type
     */
    public static function flash(string $url, string $type, string $message): self
    {
        return new self($url, $type, $message);
    }

    public function hasFlash(): bool
    {
        return $this->flashType !== null && $this->flashMessage !== null;
    }

    public function isExternal(): bool
    {
        return str_starts_with($this->redirectUrl, 'http') && ! str_contains($this->redirectUrl, config('app.url'));
    }
}
