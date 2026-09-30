<?php

use App\Actions\Security\CheckoutQuickEntryAction;
use App\Actions\Security\RecordQuickEntryAction;
use App\Actions\Security\ReserveQuickEntryAction;
use App\Models\AccessLog;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Models\User;
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
        'quick_entry_enabled' => true,
        'visitor_checkout_enabled' => true,
    ]);

    $this->organization = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Greenwood International School',
        'type' => 'school',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'access_policy' => 'managed',
    ]);
});

it('allows guard to reserve a quick entry tag', function () {
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.quick-entry.reservations.store'), [
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Dr. Johnson',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $data = $response->json('reservation');
    expect($data['status'])->toBe('reserved')
        ->and($data['tag'])->not->toBeNull()
        ->and($data['organization_name'])->toBe('Greenwood International School');

    $this->assertDatabaseHas('access_logs', [
        'estate_id' => $this->estate->id,
        'verified_by' => $this->guard->id,
    ]);

    $log = AccessLog::where('estate_id', $this->estate->id)->latest()->first();
    expect($log->meta['entry_type'])->toBe('quick_entry')
        ->and($log->meta['status'])->toBe('reserved')
        ->and($log->meta['tag'])->toBe($data['tag']);
});

it('allows guard to confirm a reserved tag arrival', function () {
    // Reserve first
    $reserveAction = app(ReserveQuickEntryAction::class);
    $reservation = $reserveAction->execute($this->estate->id, $this->guard, [
        'organization_id' => $this->organization->id,
        'visitor_name' => 'Arriving Visitor',
    ], $this->organization);

    $tag = $reservation->meta['tag'];

    // Confirm arrival
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.quick-entry.reservations.confirm', ['tag' => $tag]));

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tag' => $tag,
            'status' => 'confirmed',
        ]);

    $reservation->refresh();
    expect($reservation->meta['status'])->toBe('confirmed');
});

it('allows guard to log a quick entry admission directly', function () {
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.quick-entry.store'), [
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Dr. Johnson',
            'vehicle_plate_number' => 'ABC-123-XY',
            'vehicle_make' => 'Toyota',
            'vehicle_model' => 'Corolla',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $this->assertDatabaseHas('access_logs', [
        'estate_id' => $this->estate->id,
        'verified_by' => $this->guard->id,
        'vehicle_plate_number' => 'ABC-123-XY',
        'vehicle_make' => 'Toyota',
    ]);

    $log = AccessLog::where('estate_id', $this->estate->id)->latest()->first();
    expect($log->meta['entry_type'])->toBe('quick_entry')
        ->and($log->meta['organization_name'])->toBe('Greenwood International School');
});

it('allows guard to sync offline quick entry logs', function () {
    // Create entries first to get real tags
    $log1 = app(RecordQuickEntryAction::class)->execute($this->estate->id, $this->guard, [
        'organization_id' => $this->organization->id,
        'visitor_name' => 'Offline Visitor 1',
    ]);
    $log2 = app(RecordQuickEntryAction::class)->execute($this->estate->id, $this->guard, [
        'organization_id' => $this->organization->id,
        'visitor_name' => 'Offline Visitor 2',
    ]);

    $offlineLogs = [
        [
            'tag' => $log1->meta['tag'],
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Offline Visitor 1',
            'verified_at' => now()->subMinutes(10)->toIso8601String(),
        ],
        [
            'tag' => $log2->meta['tag'],
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Offline Visitor 2',
            'verified_at' => now()->subMinutes(5)->toIso8601String(),
        ],
    ];

    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.quick-entry.sync'), [
            'logs' => $offlineLogs,
        ]);

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'synced_count',
            'errors',
        ]);

    expect($response->json('synced_count'))->toBe(2);
});

it('allows guard to lookup a quick entry visitor by tag', function () {
    $action = app(RecordQuickEntryAction::class);
    $log = $action->execute($this->estate->id, $this->guard, [
        'organization_id' => $this->organization->id,
        'visitor_name' => 'Lookup Visitor',
    ]);

    $tag = $log->meta['tag'];

    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('security.quick-entry.lookup', ['tag' => $tag]));

    $response->assertOk()
        ->assertJson([
            'found' => true,
            'tag' => $tag,
            'visitor_name' => 'Lookup Visitor',
            'organization_name' => 'Greenwood International School',
        ]);
});

it('returns not found for a non-existent tag lookup', function () {
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('security.quick-entry.lookup', ['tag' => 'ZZZZ']));

    $response->assertOk()
        ->assertJson([
            'found' => false,
        ]);
});

it('allows guard to checkout a quick entry visitor by tag', function () {
    $action = app(RecordQuickEntryAction::class);
    $log = $action->execute($this->estate->id, $this->guard, [
        'organization_id' => $this->organization->id,
        'visitor_name' => 'John Doe',
    ]);

    expect($log->checked_out_at)->toBeNull();

    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.quick-entry.checkout'), [
            'tag' => $log->meta['tag'],
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $log->refresh();
    expect($log->checked_out_at)->not->toBeNull()
        ->and($log->checked_out_by)->toBe($this->guard->id);
});

it('cannot checkout an already checked-out tag', function () {
    $action = app(RecordQuickEntryAction::class);
    $log = $action->execute($this->estate->id, $this->guard, [
        'organization_id' => $this->organization->id,
    ]);

    // Check out once
    app(CheckoutQuickEntryAction::class)->execute($log->meta['tag'], $this->estate->id, $this->guard);

    // Attempt checking out second time
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.quick-entry.checkout'), [
            'tag' => $log->meta['tag'],
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['tag']);
});

it('forbids quick entry for an organization from another estate', function () {
    $otherEstate = Estate::factory()->create();
    $otherOrg = EstateOrganization::factory()->create([
        'estate_id' => $otherEstate->id,
        'is_active' => true,
        'quick_entry_enabled' => true,
        'access_policy' => 'managed',
    ]);

    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('security.quick-entry.store'), [
            'organization_id' => $otherOrg->id,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['organization_id']);
});
