<?php

use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\User;
use App\Notifications\VisitorArrivedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('event code message with event name and max guest count', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    $code = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'type' => 'event',
        'visitor_name' => 'Birthday Party',
        'guest_limit' => 10,
        'code' => 'EVT1',
    ]);

    AccessLog::create([
        'estate_id' => $estate->id,
        'access_code_id' => $code->id,
        'verified_by' => $user->id,
        'verified_at' => now(),
    ]);

    $notification = new VisitorArrivedNotification($code);
    $data = $notification->toArray($user);

    expect($data['message'])->toBe('A guest has arrived for the event Birthday Party. 1 out of 10 expected guests have arrived.');
});

test('event code message with event name but no max guest count', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    $code = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'type' => 'event',
        'visitor_name' => 'Graduation',
        'guest_limit' => null,
        'code' => 'EVT2',
    ]);

    AccessLog::create([
        'estate_id' => $estate->id,
        'access_code_id' => $code->id,
        'verified_by' => $user->id,
        'verified_at' => now(),
    ]);

    $notification = new VisitorArrivedNotification($code);
    $data = $notification->toArray($user);

    expect($data['message'])->toBe('A guest has arrived for the event Graduation. Guest number 1 has arrived.');
});

test('event code message with no event name but max guest count', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    $code = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'type' => 'event',
        'visitor_name' => null,
        'guest_limit' => 5,
        'code' => 'EVT3',
    ]);

    AccessLog::create([
        'estate_id' => $estate->id,
        'access_code_id' => $code->id,
        'verified_by' => $user->id,
        'verified_at' => now(),
    ]);

    $notification = new VisitorArrivedNotification($code);
    $data = $notification->toArray($user);

    expect($data['message'])->toBe('A guest has arrived for your event. 1 out of 5 expected guests have arrived.');
});

test('event code message with no event name and no max guest count', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    $code = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'type' => 'event',
        'visitor_name' => null,
        'guest_limit' => null,
        'code' => 'EVT4',
    ]);

    AccessLog::create([
        'estate_id' => $estate->id,
        'access_code_id' => $code->id,
        'verified_by' => $user->id,
        'verified_at' => now(),
    ]);

    $notification = new VisitorArrivedNotification($code);
    $data = $notification->toArray($user);

    expect($data['message'])->toBe('A guest has arrived for your event. Guest number 1 has arrived.');
});

test('standard visitor code message', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    $code = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'type' => 'single_use',
        'visitor_name' => 'John Doe',
        'code' => 'VIS1',
    ]);

    $notification = new VisitorArrivedNotification($code);
    $data = $notification->toArray($user);

    expect($data['message'])->toBe('John Doe has arrived at the security post.');
});
