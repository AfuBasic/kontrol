<?php

namespace App\Actions\Billing;

class PaymentInitializationException extends \Exception
{
    private const USER_MESSAGES = [
        'invalid_reference' => 'Invalid invoice reference. Please try again.',
        'invalid_amount' => 'Invalid invoice amount. Please contact support.',
        'authentication_failed' => 'Payment gateway authentication failed. Please try again.',
        'rate_limit' => 'Too many payment attempts. Please wait a moment and try again.',
        'network_error' => 'Network connection error. Please check your internet and try again.',
        'timeout' => 'Payment service timeout. Please try again.',
        'already_paid' => 'This invoice is already paid.',
        'max_retries_exceeded' => 'Too many payment attempts for this invoice. Please contact support.',
    ];

    public function __construct(
        string $message,
        public readonly string $code_key = 'unknown',
    ) {
        parent::__construct($message);
    }

    public static function fromPaystackException(\Throwable $e): self
    {
        $errorData = json_decode($e->getMessage(), true);
        $codeKey = $errorData['code'] ?? 'unknown';
        $rawMessage = $errorData['message'] ?? 'Payment initialization failed';

        return new self($rawMessage, $codeKey);
    }

    public function getUserMessage(): string
    {
        return self::USER_MESSAGES[$this->code_key]
            ?? 'Failed to initialize payment. Please try again or contact support.';
    }
}
