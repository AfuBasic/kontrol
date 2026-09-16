<?php

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('access code can be persisted with superseded status in database', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    $code = AccessCode::create([
        'code' => AccessCode::generateCode(),
        'qr_token' => str()->random(32),
        'pass_uuid' => (string) str()->uuid(),
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
        'starts_at' => now(),
        'expires_at' => now()->addHours(2),
    ]);

    expect($code->status)->toBe(AccessCodeStatus::Active);

    $code->update(['status' => AccessCodeStatus::Superseded]);
    $code->refresh();

    expect($code->status)->toBe(AccessCodeStatus::Superseded);
});

test('access code can be created with BulkInvite source', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    $code = AccessCode::create([
        'code' => AccessCode::generateCode(),
        'qr_token' => str()->random(32),
        'pass_uuid' => (string) str()->uuid(),
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'type' => 'bulk_visitor',
        'source' => AccessCodeSource::BulkInvite,
        'status' => AccessCodeStatus::Active,
        'starts_at' => now(),
        'expires_at' => now()->addDays(30),
    ]);

    $code->refresh();

    expect($code->source)->toBe(AccessCodeSource::BulkInvite);
});
