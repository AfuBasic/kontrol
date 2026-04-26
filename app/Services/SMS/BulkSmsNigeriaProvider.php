<?php

namespace App\Services\SMS;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BulkSmsNigeriaProvider implements SMSProvider
{
    protected string $apiToken;

    protected string $senderId;

    public function __construct()
    {
        $this->apiToken = config('services.bulksms_nigeria.api_token') ?? '';
        $this->senderId = config('services.bulksms_nigeria.sender_id') ?? 'KONTROL';
    }

    public function send(string $to, string $message): bool
    {
        if (empty($this->apiToken)) {
            Log::error('BulkSMS Nigeria API Token is missing.');

            return false;
        }

        try {
            $response = Http::post('https://www.bulksmsnigeria.com/api/v1/sms/create', [
                'api_token' => $this->apiToken,
                'from' => $this->senderId,
                'to' => $to,
                'body' => $message,
                'dnd' => 2, // Corporate route to bypass DND
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('BulkSMS Nigeria Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('BulkSMS Nigeria Exception: '.$e->getMessage());

            return false;
        }
    }
}
