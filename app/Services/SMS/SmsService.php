<?php

namespace App\Services\SMS;

class SmsService
{
    public function __construct(protected SMSProvider $provider) {}

    /**
     * Send an SMS message using the configured provider.
     */
    public function send(string $to, string $message): bool
    {
        // Sanitize phone number (ensure it starts with 234 if it's Nigerian)
        $to = $this->formatPhoneNumber($to);

        return $this->provider->send($to, $message);
    }

    protected function formatPhoneNumber(string $phone): string
    {
        // Remove any non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If it starts with 0, replace with 234
        if (str_starts_with($phone, '0')) {
            $phone = '234'.substr($phone, 1);
        }

        // If it doesn't start with 234 and is 10 digits, assume it needs 234
        if (! str_starts_with($phone, '234') && strlen($phone) === 10) {
            $phone = '234'.$phone;
        }

        return $phone;
    }
}
