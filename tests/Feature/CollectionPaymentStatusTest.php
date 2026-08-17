<?php

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function createCollectionPaymentContext(array $paymentOverrides = [], array $assignmentOverrides = []): array
{
    $estate = Estate::factory()->create();
    setPermissionsTeamId($estate->id);

    EstateSettings::forEstate($estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_ESTATE_123',
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    $resident = User::factory()->create();
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    $collection = Collection::factory()->create([
        'estate_id' => $estate->id,
        'created_by' => $admin->id,
        'name' => 'Security Levy',
        'amount' => 10000,
    ]);

    $assignment = CollectionAssignment::factory()->create(array_merge([
        'collection_id' => $collection->id,
        'estate_id' => $estate->id,
        'user_id' => $resident->id,
        'amount_due' => 10000,
        'amount_paid' => 0,
        'status' => 'pending',
    ], $assignmentOverrides));

    $payment = Payment::factory()->create(array_merge([
        'user_id' => $resident->id,
        'estate_id' => $estate->id,
        'collection_assignment_id' => $assignment->id,
        'amount' => 10000,
        'reference' => 'COLL-'.$assignment->ulid.'-a1-test',
        'status' => 'success',
        'paid_at' => now(),
    ], $paymentOverrides));

    return compact('estate', 'admin', 'resident', 'collection', 'assignment', 'payment');
}

it('shows a paid-in-full receipt for a fully settled assignment', function () {
    ['payment' => $payment, 'assignment' => $assignment] = createCollectionPaymentContext(
        paymentOverrides: ['amount' => 10000, 'status' => 'success'],
        assignmentOverrides: ['amount_due' => 10000, 'amount_paid' => 10000, 'status' => 'paid'],
    );

    Http::fake([
        'api.paystack.co/*' => Http::response(['status' => true, 'data' => ['status' => 'success']], 200),
    ]);

    $this->get(route('web.billing.collection.status', ['reference' => $payment->reference]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Web/Billing/PaymentStatus')
            ->where('status', 'paid_in_full')
            ->where('amountPaid', 10000)
            ->where('remainingBalance', 0)
            ->where('collectionName', 'Security Levy')
            ->where('payAgainUrl', null)
        );
});

it('shows a partial receipt with remaining balance and pay-again url', function () {
    ['payment' => $payment, 'assignment' => $assignment] = createCollectionPaymentContext(
        paymentOverrides: ['amount' => 4000, 'status' => 'success'],
        assignmentOverrides: ['amount_due' => 10000, 'amount_paid' => 4000, 'status' => 'partial'],
    );

    Http::fake([
        'api.paystack.co/*' => Http::response(['status' => true, 'data' => ['status' => 'success']], 200),
    ]);

    $this->get(route('web.billing.collection.status', ['reference' => $payment->reference]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Web/Billing/PaymentStatus')
            ->where('status', 'partial')
            ->where('amountPaid', 4000)
            ->where('remainingBalance', 6000)
            ->where('payAgainUrl', route('web.billing.collection.show', ['assignment' => $assignment->ulid]))
        );
});

it('finalizes a successful paystack payment when status page is opened', function () {
    ['payment' => $payment, 'assignment' => $assignment] = createCollectionPaymentContext(
        paymentOverrides: [
            'amount' => 10000,
            'status' => 'initiated',
            'paid_at' => null,
        ],
        assignmentOverrides: [
            'amount_due' => 10000,
            'amount_paid' => 0,
            'status' => 'pending',
        ],
    );

    Http::fake([
        'api.paystack.co/transaction/verify/*' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'reference' => $payment->reference,
                'amount' => 1000000,
            ],
        ], 200),
    ]);

    $this->get(route('web.billing.collection.status', ['reference' => $payment->reference]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Web/Billing/PaymentStatus')
            ->where('status', 'paid_in_full')
            ->where('remainingBalance', 0)
        );

    expect($payment->fresh()->status)->toBe('success')
        ->and($assignment->fresh()->status)->toBe('paid')
        ->and($assignment->fresh()->amount_paid)->toBe(10000);
});

it('shows pending when paystack has not confirmed the transfer yet', function () {
    ['payment' => $payment] = createCollectionPaymentContext(
        paymentOverrides: [
            'amount' => 5000,
            'status' => 'initiated',
            'paid_at' => null,
        ],
        assignmentOverrides: [
            'amount_due' => 10000,
            'amount_paid' => 0,
            'status' => 'pending',
        ],
    );

    Http::fake([
        'api.paystack.co/transaction/verify/*' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'ongoing',
                'reference' => $payment->reference,
            ],
        ], 200),
    ]);

    $this->get(route('web.billing.collection.status', ['reference' => $payment->reference]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Web/Billing/PaymentStatus')
            ->where('status', 'pending')
            ->where('amountPaid', 5000)
        );

    expect($payment->fresh()->status)->toBe('initiated');
});
