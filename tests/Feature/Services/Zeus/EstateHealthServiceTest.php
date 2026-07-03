<?php

use App\Models\Estate;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\Zeus\EstateHealthService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->service = new EstateHealthService;
    Role::firstOrCreate(['name' => 'resident']);
});

test('it returns 80 for an estate with no residents and no payments', function () {
    $estate = Estate::factory()->create();

    $score = $this->service->calculateHealthScore($estate);

    expect($score)->toBe(80);
});

test('it calculates score with all verified residents', function () {
    $estate = Estate::factory()->create();

    // Create 2 verified residents
    $users = User::factory()->count(2)->create(['email_verified_at' => now(), 'suspended_at' => null]);

    setPermissionsTeamId($estate->id);
    foreach ($users as $user) {
        $estate->users()->attach($user->id, ['status' => 'accepted']);
        $user->assignRole('resident');
    }

    // Ratio = 1.0 -> penalty = 40 - 40 = 0
    // Score = 100

    expect($this->service->calculateHealthScore($estate))->toBe(100);
});

test('it calculates score with half verified residents', function () {
    $estate = Estate::factory()->create();

    setPermissionsTeamId($estate->id);

    $verifiedUser = User::factory()->create(['email_verified_at' => now(), 'suspended_at' => null]);
    $estate->users()->attach($verifiedUser->id, ['status' => 'accepted']);
    $verifiedUser->assignRole('resident');

    $unverifiedUser = User::factory()->create(['email_verified_at' => null, 'suspended_at' => null]);
    $estate->users()->attach($unverifiedUser->id, ['status' => 'accepted']);
    $unverifiedUser->assignRole('resident');

    // Total = 2, Active = 1. Ratio = 0.5
    // Penalty = 40 - (40 * 0.5) = 20
    // Score = 80

    expect($this->service->calculateHealthScore($estate))->toBe(80);
});

test('it calculates score with payment failures', function () {
    $estate = Estate::factory()->create();

    setPermissionsTeamId($estate->id);
    $verifiedUser = User::factory()->create(['email_verified_at' => now(), 'suspended_at' => null]);
    $estate->users()->attach($verifiedUser->id, ['status' => 'accepted']);
    $verifiedUser->assignRole('resident');

    // Total payments: 4. Failed: 1. Ratio: 0.25
    PaymentTransaction::forceCreate([
        'estate_id' => $estate->id,
        'user_id' => $verifiedUser->id,
        'amount' => 100,
        'status' => 'success',
        'paystack_reference' => 'ref_1',
        'idempotency_key' => 'key_1',
    ]);
    PaymentTransaction::forceCreate([
        'estate_id' => $estate->id,
        'user_id' => $verifiedUser->id,
        'amount' => 100,
        'status' => 'success',
        'paystack_reference' => 'ref_2',
        'idempotency_key' => 'key_2',
    ]);
    PaymentTransaction::forceCreate([
        'estate_id' => $estate->id,
        'user_id' => $verifiedUser->id,
        'amount' => 100,
        'status' => 'success',
        'paystack_reference' => 'ref_3',
        'idempotency_key' => 'key_3',
    ]);
    PaymentTransaction::forceCreate([
        'estate_id' => $estate->id,
        'user_id' => $verifiedUser->id,
        'amount' => 100,
        'status' => 'failed',
        'paystack_reference' => 'ref_4',
        'idempotency_key' => 'key_4',
    ]);

    // Ratio = 0.25. Penalty = 60 * 0.25 = 15
    // Score = 100 - 15 = 85

    expect($this->service->calculateHealthScore($estate))->toBe(85);
});
