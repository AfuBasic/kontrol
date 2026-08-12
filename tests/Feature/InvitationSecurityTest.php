<?php

use App\Actions\Admin\BulkInvitePropertyOwnersAction;
use App\Actions\Admin\BulkInviteResidentsAction;
use App\Actions\Admin\CreatePropertyOwnerAction;
use App\Actions\Admin\CreateResidentAction;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup roles
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
});

test('invited resident has pending membership status and cannot log in', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();

    $action = app(CreateResidentAction::class);

    $data = [
        'name' => 'Pending Resident',
        'email' => 'pending.resident@example.com',
        'phone' => '1234567890',
    ];

    $user = $action->execute($data, $estate);

    // 1. Verify membership is pending
    $status = DB::table('estate_users_membership')
        ->where('user_id', $user->id)
        ->where('estate_id', $estate->id)
        ->value('status');

    expect($status)->toBe('pending');
    expect($user->email_verified_at)->toBeNull();

    // 2. Verify login is blocked
    $response = $this->post('/login', [
        'email' => $data['email'],
    ]);

    $response->assertSessionHasErrors('email');
});

test('invited property owner has pending membership status and cannot log in', function () {
    $estate = Estate::factory()->create();

    $action = app(CreatePropertyOwnerAction::class);

    $data = [
        'name' => 'Pending Owner',
        'email' => 'pending.owner@example.com',
        'phone' => '1234567890',
    ];

    $user = $action->execute($data, $estate);

    // 1. Verify membership is pending
    $status = DB::table('estate_users_membership')
        ->where('user_id', $user->id)
        ->where('estate_id', $estate->id)
        ->value('status');

    expect($status)->toBe('pending');
    expect($user->email_verified_at)->toBeNull();

    // 2. Verify login is blocked
    $response = $this->post('/login', [
        'email' => $data['email'],
    ]);

    $response->assertSessionHasErrors('email');
});

test('bulk invited residents have pending invitation status', function () {
    $estate = Estate::factory()->create();

    $action = app(BulkInviteResidentsAction::class);

    $emails = [
        'bulk.res1@example.com',
        'bulk.res2@example.com',
    ];

    $action->execute($emails, $estate);

    foreach ($emails as $email) {
        $invitation = Invitation::where('email', $email)->where('estate_id', $estate->id)->first();
        expect($invitation)->not->toBeNull();
        expect($invitation->status)->toBe('pending');
    }
});

test('bulk invited property owners have pending invitation status', function () {
    $estate = Estate::factory()->create();

    $action = app(BulkInvitePropertyOwnersAction::class);

    $emails = [
        'bulk.owner1@example.com',
        'bulk.owner2@example.com',
    ];

    $action->execute($emails, $estate);

    foreach ($emails as $email) {
        $invitation = Invitation::where('email', $email)->where('estate_id', $estate->id)->first();
        expect($invitation)->not->toBeNull();
        expect($invitation->status)->toBe('pending');
    }
});
