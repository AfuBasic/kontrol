<?php

use App\Actions\Security\RecordCheckInAction;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->guard = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->guard->assignRole('security');
    $this->estate->users()->attach($this->guard->id, ['status' => 'accepted']);

    // Create an assignment so ContextManager works seamlessly
    $this->assignment = AdministrativeAssignment::create([
        'user_id' => $this->guard->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->guard->roles->first()->id,
        'scope_type' => 'estate',
        'is_primary' => true,
        'is_active' => true,
    ]);

    $this->settings = EstateSettings::forEstate($this->estate->id);
    $this->settings->update([
        'visitor_checkout_enabled' => true,
        'entry_point_checkout_enforced' => true,
        'entry_points' => ['North Gate', 'South Gate'],
    ]);
});

it('redirects security personnel to checkpoint select when entry point enforcement is active', function () {
    $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('security.home'))
        ->assertRedirect(route('security.checkpoint.select'));
});

it('allows security personnel to view the checkpoint selection page', function () {
    $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('security.checkpoint.select'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Security/Checkpoint/Select')
            ->where('estateName', $this->estate->name)
            ->where('enforced', true)
            ->has('checkpoints', 2)
        );
});

it('allows security personnel to claim an available checkpoint', function () {
    $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.checkpoint.claim'), [
            'entry_point' => 'North Gate',
        ])
        ->assertRedirect(route('security.home'))
        ->assertSessionHas('success');

    $claimService = app(CheckpointClaimService::class);
    expect($claimService->getCurrentCheckpoint($this->estate->id, $this->guard))->toBe('North Gate');
});

it('prevents two security personnel from claiming the same checkpoint simultaneously', function () {
    $guard2 = User::factory()->create();
    $guard2->assignRole('security');
    $this->estate->users()->attach($guard2->id, ['status' => 'accepted']);
    $assignment2 = AdministrativeAssignment::create([
        'user_id' => $guard2->id,
        'estate_id' => $this->estate->id,
        'role_id' => $guard2->roles->first()->id,
        'scope_type' => 'estate',
        'is_primary' => true,
        'is_active' => true,
    ]);

    // Guard 1 claims North Gate
    $claimService = app(CheckpointClaimService::class);
    $claimService->claim($this->estate->id, $this->guard, 'North Gate');

    // Guard 2 attempts to claim North Gate
    $this->actingAs($guard2)
        ->withSession(['active_context_assignment_id' => $assignment2->id])
        ->post(route('security.checkpoint.claim'), [
            'entry_point' => 'North Gate',
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($claimService->getCurrentCheckpoint($this->estate->id, $guard2))->toBeNull();
});

it('records claimed checkpoint on access log when visitor is checked in', function () {
    $claimService = app(CheckpointClaimService::class);
    $claimService->claim($this->estate->id, $this->guard, 'South Gate');

    $resident = User::factory()->create();
    $accessCode = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => '998877',
        'type' => 'single_use',
        'visitor_name' => 'John Guest',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
    ]);

    $action = app(RecordCheckInAction::class);
    $log = $action->execute(
        code: '998877',
        estateId: $this->estate->id,
        verifiedBy: $this->guard
    );

    expect($log->entry_point)->toBe('South Gate');
    expect($log->meta['entry_point'])->toBe('South Gate');
});

it('allows security personnel to release their claimed checkpoint', function () {
    $claimService = app(CheckpointClaimService::class);
    $claimService->claim($this->estate->id, $this->guard, 'North Gate');

    $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.checkpoint.release'))
        ->assertRedirect(route('security.checkpoint.select'))
        ->assertSessionHas('success');

    expect($claimService->getCurrentCheckpoint($this->estate->id, $this->guard))->toBeNull();
});
