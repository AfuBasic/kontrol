<?php

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\EstateOrganization;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');

    EstateMembership::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'status' => 'accepted',
    ]);

    $adminRole = Role::where('name', 'admin')->where('estate_id', $this->estate->id)->first()
        ?? Role::where('name', 'admin')->first();

    $this->assignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => 'estate',
        'is_primary' => true,
        'is_active' => true,
    ]);
});

it('allows estate admin to view organizations index page', function () {
    EstateOrganization::factory()->count(3)->create([
        'estate_id' => $this->estate->id,
    ]);

    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('admin.organizations.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Organizations/Index')
            ->has('organizations.data', 3)
            ->has('filters')
        );
});

it('allows estate admin to create a new organization with operating hours and enforcement', function () {
    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('admin.organizations.store'), [
            'name' => 'St. Mary High School',
            'type' => 'school',
            'hours_enforcement' => 'block',
            'quick_entry_enabled' => true,
            'is_active' => true,
            'operating_hours' => [
                'open' => '07:30',
                'close' => '16:00',
                'days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            ],
        ]);

    $response->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('estate_organizations', [
        'estate_id' => $this->estate->id,
        'name' => 'St. Mary High School',
        'type' => 'school',
        'hours_enforcement' => 'block',
        'quick_entry_enabled' => true,
        'is_active' => true,
    ]);

    $org = EstateOrganization::where('name', 'St. Mary High School')->first();
    expect($org->operating_hours['open'])->toBe('07:30')
        ->and($org->operating_hours['close'])->toBe('16:00');
});

it('allows estate admin to update an existing organization', function () {
    $org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Old Name',
        'type' => 'business',
        'hours_enforcement' => 'inherit',
        'quick_entry_enabled' => true,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->put(route('admin.organizations.update', $org->id), [
            'name' => 'Updated Community Hospital',
            'type' => 'hospital',
            'hours_enforcement' => 'off',
            'quick_entry_enabled' => false,
            'is_active' => false,
        ]);

    $response->assertRedirect()
        ->assertSessionHas('success');

    $org->refresh();
    expect($org->name)->toBe('Updated Community Hospital')
        ->and($org->type)->toBe('hospital')
        ->and($org->hours_enforcement)->toBe('off')
        ->and($org->quick_entry_enabled)->toBeFalse()
        ->and($org->is_active)->toBeFalse();
});

it('allows estate admin to delete an organization', function () {
    $org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'To Be Deleted Org',
    ]);

    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->delete(route('admin.organizations.destroy', $org->id));

    $response->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('estate_organizations', [
        'id' => $org->id,
    ]);
});

it('forbids admin from managing an organization from another estate', function () {
    $otherEstate = Estate::factory()->create();
    $otherOrg = EstateOrganization::factory()->create([
        'estate_id' => $otherEstate->id,
        'name' => 'Other Estate Org',
    ]);

    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->put(route('admin.organizations.update', $otherOrg->id), [
            'name' => 'Hijacked Name',
            'type' => 'school',
        ]);

    $response->assertStatus(403);
});
