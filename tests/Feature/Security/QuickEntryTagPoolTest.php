<?php

use App\Models\AccessLog;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Models\OrganizationPublicWindow;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->travelTo(now()->setTime(12, 0));
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

    EstateSettings::forEstate($this->estate->id)->update([
        'quick_entry_enabled' => true,
        'visitor_checkout_enabled' => true,
    ]);

    $this->organization = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'OSBA',
        'type' => 'school',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'access_policy' => 'public_window',
    ]);

    OrganizationPublicWindow::create([
        'organization_id' => $this->organization->id,
        'name' => 'School day',
        'day_of_week' => now()->dayOfWeek,
        'start_time' => '00:00:00',
        'end_time' => '23:59:59',
        'is_active' => true,
    ]);

    $this->asGuard = fn () => $this->actingAs($this->guard)
        ->withSession(['active_context_assignment_id' => $this->assignment->id]);
});

test('an entry is recorded with the tag the gate issued', function () {
    $tag = 'K7PQ';

    ($this->asGuard)()
        ->postJson(route('security.quick-entry.store'), [
            'tag' => $tag,
            'organization_id' => $this->organization->id,
            'visitor_name' => 'Parent',
        ])
        ->assertOk()
        ->assertJsonPath('tag', $tag);

    expect(AccessLog::withoutGlobalScopes()->where('meta->tag', $tag)->exists())->toBeTrue();
});

test('a tag still held by someone inside cannot be issued again', function () {
    ($this->asGuard)()
        ->postJson(route('security.quick-entry.store'), ['tag' => 'AB23', 'organization_id' => $this->organization->id])
        ->assertOk();

    ($this->asGuard)()
        ->postJson(route('security.quick-entry.store'), ['tag' => 'AB23', 'organization_id' => $this->organization->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tag']);
});

test('an entry without a tag still gets a generated one', function () {
    $tag = ($this->asGuard)()
        ->postJson(route('security.quick-entry.store'), ['organization_id' => $this->organization->id])
        ->assertOk()
        ->json('tag');

    expect($tag)->toBeString()->toHaveLength(4);
});

test('offline sync keeps the tags handed to visitors', function () {
    ($this->asGuard)()
        ->postJson(route('security.quick-entry.sync'), [
            'logs' => [
                ['tag' => 'QX7K', 'organization_id' => $this->organization->id, 'verified_at' => now()->subMinutes(20)->toISOString()],
                ['tag' => 'M4PZ', 'organization_id' => $this->organization->id, 'verified_at' => now()->subMinutes(10)->toISOString()],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('synced_count', 2);

    $tags = AccessLog::withoutGlobalScopes()->where('estate_id', $this->estate->id)->get()->pluck('meta.tag')->sort()->values()->all();

    expect($tags)->toBe(['M4PZ', 'QX7K']);
});
