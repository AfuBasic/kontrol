<?php

use App\Actions\Invitation\AcceptInvitationAction;
use App\Actions\Zeus\CreateEstateAction;
use App\Enums\PartnerStatus;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('estate is created with inactive status and becomes active when admin accepts invitation', function () {
    $createAction = app(CreateEstateAction::class);
    $acceptAction = app(AcceptInvitationAction::class);

    $estate = $createAction->execute([
        'name' => 'Sunset Hills Estate',
        'email' => 'admin@sunsethills.test',
        'address' => '123 Sunset Boulevard',
    ]);

    expect($estate->status)->toBe('inactive');
    expect($estate->activation_date)->toBeNull();

    $invitation = Invitation::withoutGlobalScopes()->where('estate_id', $estate->id)->first();
    expect($invitation)->not->toBeNull();
    expect($invitation->status)->toBe('pending');

    $adminUser = User::where('email', 'admin@sunsethills.test')->first();
    expect($adminUser)->not->toBeNull();

    // Accept invitation
    $acceptAction->execute($invitation, $adminUser);

    $estate->refresh();
    expect($estate->status)->toBe('active');
    expect($estate->activation_date)->not->toBeNull();
    expect($estate->isActive())->toBeTrue();
});

test('estate with partner transitions partner status to activated when admin accepts invitation', function () {
    $partner = Partner::factory()->create();

    $estate = Estate::factory()->create([
        'status' => 'inactive',
        'partner_id' => $partner->id,
        'partner_status' => PartnerStatus::Approved,
        'activation_date' => null,
    ]);

    $adminUser = User::factory()->create(['email' => 'chairman@testestate.test']);

    $invitation = Invitation::create([
        'estate_id' => $estate->id,
        'email' => $adminUser->email,
        'token' => 'test-invitation-token-123',
        'status' => 'pending',
        'relationship_type' => null,
        'expires_at' => now()->addDays(7),
    ]);

    app(AcceptInvitationAction::class)->execute($invitation, $adminUser);

    $estate->refresh();
    expect($estate->status)->toBe('active');
    expect($estate->activation_date)->not->toBeNull();
    expect($estate->partner_status)->toBe(PartnerStatus::Activated);
});
