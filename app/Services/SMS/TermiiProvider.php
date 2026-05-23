<?php

namespace App\Services\SMS;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TermiiProvider implements SMSProvider
{
    protected string $apiKey;

    protected string $senderId;

    protected string $baseUrl = 'https://api.ng.termii.com/api/sms/send';

    public function __construct()
    {
        $this->apiKey = config('services.termii.api_key');
        $this->senderId = config('services.termii.sender_id', 'KONTROL');
    }

    /**
     * Send an SMS message using Termii.
     */
    public function send(string $to, string $message): bool
    {
        Log::info('Termii SMS Dispatch', ['to' => $to, 'message' => $message]);

        if (empty($this->apiKey)) {
            Log::error('Termii API Key is missing. SMS not sent.');

            return false;
        }

        try {
            $response = Http::post($this->baseUrl, [
                'to' => $to,
                'from' => $this->senderId,
                'sms' => $message,
                'type' => 'plain',
                'channel' => 'generic',
                'api_key' => $this->apiKey,
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('Termii SMS failed', [
                'status' => $response->status(),
                'response' => $response->json(),
                'to' => $to,
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Termii SMS Exception: '.$e->getMessage());

            return false;
        }
    }
}
