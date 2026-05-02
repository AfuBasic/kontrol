<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class PaystackService
{
    private PendingRequest $client;

    public function __construct()
    {
        $baseUrl = config('paystack.base_url');
        $secretKey = config('paystack.secret_key');

        \Log::info('PaystackService instantiated', [
            'base_url' => $baseUrl,
            'has_secret_key' => ! empty($secretKey),
        ]);

        $this->client = Http::baseUrl($baseUrl)
            ->withHeader('Authorization', "Bearer {$secretKey}")
            ->asJson();
    }

    /**
     * Initialize a payment with Paystack.
     *
     * @throws \Exception
     */
    public function initializePayment(Invoice $invoice, string $callbackUrl, ?string $reference = null): array
    {
        \Log::info('initializePayment called', [
            'invoice_id' => $invoice->id,
            'callback_url' => $callbackUrl,
            'reference' => $reference ?? $invoice->invoice_number,
        ]);

        $response = $this->client->post('/transaction/initialize', [
            'email' => $invoice->estate->email ?? $invoice->estate->users()->first()?->email,
            'amount' => $invoice->amount,
            'reference' => $reference ?? $invoice->invoice_number,
            'callback_url' => $callbackUrl,
            'metadata' => [
                'invoice_id' => $invoice->id,
                'estate_id' => $invoice->estate_id,
                'invoice_number' => $invoice->invoice_number,
            ],
        ]);

        if (! $response->successful()) {
            $status = $response->status();
            $body = $response->body();

            \Log::error('========== PAYSTACK API ERROR ==========');
            \Log::error("HTTP Status: {$status}");
            \Log::error("Raw Body: {$body}");

            try {
                $data = $response->json();
                \Log::error('Parsed JSON:', $data);
            } catch (\Exception $e) {
                \Log::error("JSON Parse Error: {$e->getMessage()}");
                $data = ['message' => $body];
            }

            $errorMessage = $data['message'] ?? $body ?? 'Payment initialization failed';
            $errorCode = $data['code'] ?? 'unknown_error';

            \Log::error('Paystack initialization error', [
                'status' => $status,
                'code' => $errorCode,
                'message' => $errorMessage,
            ]);
            \Log::error('========== END PAYSTACK ERROR ==========');

            throw new \Exception(json_encode([
                'code' => $errorCode,
                'message' => $errorMessage,
            ]));
        }

        $data = $response->json();

        return [
            'authorization_url' => $data['data']['authorization_url'] ?? null,
            'access_code' => $data['data']['access_code'] ?? null,
            'reference' => $data['data']['reference'] ?? null,
        ];
    }

    /**
     * Verify a payment with Paystack.
     *
     *
     * @throws \Exception
     */
    public function verifyPayment(string $reference): array
    {
        $response = $this->client->get("/transaction/verify/{$reference}");

        if (! $response->successful()) {
            throw new \Exception('Failed to verify Paystack payment: '.$response->body());
        }

        $data = $response->json();

        return [
            'status' => $data['data']['status'] ?? null,
            'reference' => $data['data']['reference'] ?? null,
            'amount' => $data['data']['amount'] ?? null,
            'customer_email' => $data['data']['customer']['email'] ?? null,
            'paid_at' => $data['data']['paid_at'] ?? null,
            'authorization' => $data['data']['authorization'] ?? null,
            'customer' => $data['data']['customer'] ?? null,
            'message' => $data['message'] ?? null,
        ];
    }

    /**
     * Charge a saved authorization.
     *
     * @throws \Exception
     */
    public function chargeAuthorization(string $authorizationCode, string $email, int $amount, ?string $reference = null, array $metadata = []): array
    {
        $response = $this->client->post('/transaction/charge_authorization', [
            'authorization_code' => $authorizationCode,
            'email' => $email,
            'amount' => $amount,
            'reference' => $reference,
            'metadata' => $metadata,
        ]);

        if (! $response->successful()) {
            throw new \Exception('Paystack charge authorization failed: '.$response->body());
        }

        return $response->json('data');
    }

    /**
     * Initialize a generic payment transaction.
     */
    public function initializeTransaction(string $email, int $amount, string $callbackUrl, array $metadata = [], ?string $reference = null): array
    {
        $response = $this->client->post('/transaction/initialize', [
            'email' => $email,
            'amount' => $amount,
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            'metadata' => $metadata,
        ]);

        if (! $response->successful()) {
            throw new \Exception('Paystack initialization failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'authorization_url' => $data['data']['authorization_url'] ?? null,
            'access_code' => $data['data']['access_code'] ?? null,
            'reference' => $data['data']['reference'] ?? null,
        ];
    }

    /**
     * Process a refund via Paystack.
     *
     * @throws \Exception
     */
    public function refund(string $transactionIdOrReference, ?int $amount = null, ?string $customerNote = null): array
    {
        $payload = [
            'transaction' => $transactionIdOrReference,
        ];

        if ($amount !== null) {
            $payload['amount'] = $amount;
        }

        if ($customerNote !== null) {
            $payload['customer_note'] = $customerNote;
        }

        $response = $this->client->post('/refund', $payload);

        if (! $response->successful()) {
            throw new \Exception('Paystack refund failed: '.$response->body());
        }

        return $response->json('data');
    }

    /**
     * Get list of banks from Paystack.
     */
    public function getBanks(): array
    {
        $response = $this->client->get('/bank', ['country' => 'nigeria']);

        return $response->successful() ? $response->json('data') : [];
    }

    /**
     * Create a subaccount on Paystack.
     */
    public function createSubaccount(array $data): array
    {
        $response = $this->client->post('/subaccount', [
            'business_name' => $data['business_name'],
            'settlement_bank' => $data['settlement_bank'],
            'account_number' => $data['account_number'],
            'percentage_charge' => $data['percentage_charge'] ?? 1.0, // Platform fee
        ]);

        if (! $response->successful()) {
            throw new \Exception('Failed to create Paystack subaccount: '.$response->body());
        }

        return $response->json('data');
    }

    /**
     * Update a subaccount on Paystack.
     */
    public function updateSubaccount(string $subaccountCode, array $data): array
    {
        $response = $this->client->put("/subaccount/{$subaccountCode}", $data);

        if (! $response->successful()) {
            throw new \Exception('Failed to update Paystack subaccount: '.$response->body());
        }

        return $response->json('data');
    }

    /**
     * Validate a Paystack webhook signature using HMAC-SHA512.
     */
    public function validateWebhookSignature(string $payload, string $signature): bool
    {
        $hash = hash_hmac('sha512', $payload, config('paystack.secret_key'));

        return hash_equals($hash, $signature);
    }
}
