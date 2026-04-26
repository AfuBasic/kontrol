<?php

namespace App\Services\SMS;

interface SMSProvider
{
    /**
     * Send an SMS message.
     *
     * @param  string  $to  Recipient phone number (e.g., 234...)
     * @param  string  $message  The message content
     * @return bool True if successfully handed off to provider
     */
    public function send(string $to, string $message): bool;
}
