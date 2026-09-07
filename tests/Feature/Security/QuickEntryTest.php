<?php

use App\Actions\Security\CheckoutQuickEntryAction;
use App\Actions\Security\RecordQuickEntryAction;
use App\Models\AccessLog;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Models\QuickEntryAllocation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

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
        'quick_entry_hours_enforcement' => 'warn',
        'visitor_checkout_enabled' => true,
    ]);

    $this->organization = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Greenwood International School',
        'type' => 'school',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'hours_enforcement' => 'inherit',
    ]);
});

it('allows guard to reserve a block of quick entry tags', function () {
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->getJson(route('security.quick-entry.reserve', ['count' => 10]));

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                'allocation_id',
                'tags',
                'expires_at',
            ],
        ]);

    $data = $response->json('data');
    expect($data['tags'])->toHaveCount(10);

    $this->assertDatabaseHas('quick_entry_allocations', [
        'id' => $data['allocation_id'],
        'estate_id' => $this->estate->id,
        'user_id' => $this->guard->id,
        'allocated_count' => 10,
    ]);
});

it('allows guard to log a quick entry admission online', function () {
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->postJson(route('security.quick-entry.store'), [
            'tag' => 'K9A2',
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Dr. Johnson',
            'vehicle_plate_number' => 'ABC-123-XY',
            'vehicle_make' => 'Toyota',
            'vehicle_model' => 'Corolla',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Quick entry recorded successfully.',
        ]);

    $this->assertDatabaseHas('access_logs', [
        'estate_id' => $this->estate->id,
        'verified_by' => $this->guard->id,
        'vehicle_plate_number' => 'ABC-123-XY',
        'vehicle_make' => 'Toyota',
    ]);

    $log = AccessLog::where('estate_id', $this->estate->id)->latest()->first();
    expect($log->meta['entry_type'])->toBe('quick_entry')
        ->and($log->meta['tag'])->toBe('K9A2')
        ->and($log->meta['organization_name'])->toBe('Greenwood International School');
});

it('allows guard to sync offline quick entry logs', function () {
    $offlineLogs = [
        [
            'tag' => 'TAG1',
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Offline Visitor 1',
            'verified_at' => now()->subMinutes(10)->toISOString(),
        ],
        [
            'tag' => 'TAG2',
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Offline Visitor 2',
            'verified_at' => now()->subMinutes(5)->toISOString(),
        ],
    ];

    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->postJson(route('security.quick-entry.sync'), [
            'logs' => $offlineLogs,
        ]);

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'synced_count',
            'errors',
        ]);

    expect($response->json('synced_count'))->toBe(2);

    $this->assertDatabaseHas('access_logs', [
        'estate_id' => $this->estate->id,
        'meta->tag' => 'TAG1',
    ]);
    $this->assertDatabaseHas('access_logs', [
        'estate_id' => $this->estate->id,
        'meta->tag' => 'TAG2',
    ]);
});

it('allows guard to checkout a quick entry visitor by tag', function () {
    // Record entry first
    $action = app(RecordQuickEntryAction::class);
    $log = $action->execute($this->estate->id, $this->guard, [
        'tag' => 'CHK1',
        'organization_id' => $this->organization->id,
        'visitor_name' => 'John Doe',
    ]);

    expect($log->checked_out_at)->toBeNull();

    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->postJson(route('security.quick-entry.checkout'), [
            'tag' => 'CHK1',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Visitor checked out successfully.',
        ]);

    $log->refresh();
    expect($log->checked_out_at)->not->toBeNull()
        ->and($log->checked_out_by)->toBe($this->guard->id);
});

it('cannot checkout an already checked-out tag', function () {
    $action = app(RecordQuickEntryAction::class);
    $action->execute($this->estate->id, $this->guard, [
        'tag' => 'CHK2',
        'organization_id' => $this->organization->id,
    ]);

    // Check out once
    app(CheckoutQuickEntryAction::class)->execute('CHK2', $this->estate->id, $this->guard);

    // Attempt checking out second time
    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->postJson(route('security.quick-entry.checkout'), [
            'tag' => 'CHK2',
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
    ]);

    $response = $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->postJson(route('security.quick-entry.store'), [
            'tag' => 'OTH1',
            'organization_id' => $otherOrg->id,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['organization_id']);
});

it('blocks quick entry outside operating hours when enforcement is block', function () {
    $strictSchool = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Strict School',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'hours_enforcement' => 'block',
        'operating_hours' => [
            'open' => '08:00',
            'close' => '15:00',
            'days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        ],
    ]);

    // Sunday at 10am (closed on weekends)
    $sundayTime = CarbonImmutable::parse('2026-09-06 10:00:00'); // Sunday

    expect(function () use ($strictSchool, $sundayTime) {
        app(RecordQuickEntryAction::class)->execute($this->estate->id, $this->guard, [
            'tag' => 'BLK1',
            'organization_id' => $strictSchool->id,
            'verified_at' => $sundayTime,
        ]);
    })->toThrow(ValidationException::class);
});

it('allows quick entry outside hours with outside_hours flag when enforcement is warn', function () {
    $warnOrg = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Church Center',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'hours_enforcement' => 'warn',
        'operating_hours' => [
            'open' => '08:00',
            'close' => '12:00',
            'days' => ['sunday'],
        ],
    ]);

    // Monday at 8pm (outside church hours)
    $mondayNight = CarbonImmutable::parse('2026-09-07 20:00:00');

    $log = app(RecordQuickEntryAction::class)->execute($this->estate->id, $this->guard, [
        'tag' => 'WRN1',
        'organization_id' => $warnOrg->id,
        'verified_at' => $mondayNight,
    ]);

    expect($log)->toBeInstanceOf(AccessLog::class)
        ->and($log->meta['outside_hours'])->toBeTrue();
});

it('allows quick entry regardless of hours when enforcement is off', function () {
    $hospital = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'General Hospital 24/7',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'hours_enforcement' => 'off',
        'operating_hours' => [
            'open' => '08:00',
            'close' => '17:00',
        ],
    ]);

    // Midnight
    $midnight = CarbonImmutable::parse('2026-09-07 00:30:00');

    $log = app(RecordQuickEntryAction::class)->execute($this->estate->id, $this->guard, [
        'tag' => 'HOSP',
        'organization_id' => $hospital->id,
        'verified_at' => $midnight,
    ]);

    expect($log)->toBeInstanceOf(AccessLog::class);
});

it('resolves enforcement from estate setting when organization enforcement is inherit', function () {
    // Estate has enforcement 'block'
    $this->settings->update(['quick_entry_hours_enforcement' => 'block']);

    $inheritedOrg = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Inherited Org',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'hours_enforcement' => 'inherit',
        'operating_hours' => [
            'open' => '09:00',
            'close' => '17:00',
            'days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        ],
    ]);

    expect($inheritedOrg->resolvedEnforcement($this->settings))->toBe('block');

    $saturday = CarbonImmutable::parse('2026-09-05 12:00:00'); // Saturday

    expect(function () use ($inheritedOrg, $saturday) {
        app(RecordQuickEntryAction::class)->execute($this->estate->id, $this->guard, [
            'tag' => 'INH1',
            'organization_id' => $inheritedOrg->id,
            'verified_at' => $saturday,
        ]);
    })->toThrow(ValidationException::class);
});
