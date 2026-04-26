<?php

namespace App\Actions\Billing;

use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Illuminate\Support\Str;

class InitializeCardSetupAction
{
    public function __construct(
        private PaystackService $paystackService,
        private EstateContextService $estateContext,
    ) {}

    /**
     * Initialize a 50 NGN payment to capture and save a user's payment method.
     */
    public function execute(User $user, string $callbackUrl): string
    {
        $estate = $this->estateContext->getEstate();
        $reference = 'SETUP_'.Str::random(10);
        $amount = 5000; // 50 NGN in kobo

        // 1. Create a placeholder transaction
        PaymentTransaction::create([
            'estate_id' => $estate->id,
            'user_id' => $user->id,
            'paystack_reference' => $reference,
            'idempotency_key' => (string) Str::uuid(),
            'amount' => $amount,
            'currency' => 'NGN',
            'status' => 'pending',
            'metadata' => [
                'type' => 'card_setup',
            ],
        ]);

        // 2. Initialize with Paystack
        $payment = $this->paystackService->initializeTransaction(
            $user->email,
            $amount,
            $callbackUrl,
            [
                'type' => 'card_setup',
                'user_id' => $user->id,
                'estate_id' => $estate->id,
            ],
            $reference
        );

        return $payment['authorization_url'];
    }
}
