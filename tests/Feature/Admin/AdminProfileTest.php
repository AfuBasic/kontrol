<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create(['name' => 'The Squatters']);
    $this->admin = User::factory()->create([
        'name' => 'Silverwood Bane',
        'email' => 'admin@example.com',
    ]);

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->adminAssignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => Role::findByName('admin')->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);
});

function asProfileAdmin()
{
    return test()->actingAs(test()->admin)
        ->withSession(['active_context_assignment_id' => test()->adminAssignment->id]);
}

it('renders the profile with personal details and the active estate access', function () {
    asProfileAdmin()
        ->get(route('admin.profile'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Profile/Index')
            ->where('account.name', 'Silverwood Bane')
            ->where('account.email', 'admin@example.com')
            ->where('account.role_label', 'Estate Administrator')
            ->where('estate_context.name', 'The Squatters')
            ->where('estate_context.access_label', 'Estate Administrator')
            ->where('estate_context.scope_label', 'Estate-wide access')
            ->where('estate_context.can_switch', false)
            ->where('estate_context.can_view_authority', true)
            ->where('user.name', 'Silverwood Bane')
            ->missing('estate_context.shares_account_name')
            ->missing('estate_context.editable')
        );
});

it('does not expose account and estate relationship metadata', function () {
    test()->estate->update(['name' => 'Silverwood Bane']);

    asProfileAdmin()
        ->get(route('admin.profile'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('account.name', 'Silverwood Bane')
            ->where('estate_context.name', 'Silverwood Bane')
            ->missing('estate_context.shares_account_name')
        );
});

it('shows switch estate when the administrator has more than one active context', function () {
    $otherEstate = Estate::factory()->create(['name' => 'Northgate']);
    setPermissionsTeamId($otherEstate->id);
    test()->admin->assignRole('admin');
    $otherEstate->users()->attach(test()->admin->id, ['status' => 'accepted']);

    AdministrativeAssignment::create([
        'user_id' => test()->admin->id,
        'estate_id' => $otherEstate->id,
        'role_id' => Role::findByName('admin')->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    asProfileAdmin()
        ->get(route('admin.profile'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('estate_context.can_switch', true)
            ->where('estate_context.name', 'The Squatters')
        );
});

it('describes zone-scoped access from the active context', function () {
    $zone = Zone::factory()->create([
        'estate_id' => test()->estate->id,
        'name' => 'GRA',
    ]);

    test()->adminAssignment->update([
        'scope_type' => AssignmentScope::Zone,
        'zone_id' => $zone->id,
    ]);

    asProfileAdmin()
        ->get(route('admin.profile'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('estate_context.scope_label', 'Zone · GRA')
        );
});

it('updates the administrator name without requiring a password', function () {
    asProfileAdmin()
        ->from(route('admin.profile'))
        ->put(route('admin.profile.update'), [
            'name' => 'Ada Lovelace',
        ])
        ->assertRedirect(route('admin.profile'))
        ->assertSessionHas('success', 'Profile updated successfully.');

    expect(test()->admin->fresh()->name)->toBe('Ada Lovelace');
});

it('does not change the administrator password through the profile endpoint', function () {
    $existingPassword = test()->admin->password;

    asProfileAdmin()
        ->from(route('admin.profile'))
        ->put(route('admin.profile.update'), [
            'name' => 'Silverwood Bane',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])
        ->assertRedirect(route('admin.profile'))
        ->assertSessionHas('success', 'Profile updated successfully.');

    expect(test()->admin->fresh()->password)->toBe($existingPassword);
});

it('rejects an empty administrator name', function () {
    asProfileAdmin()
        ->from(route('admin.profile'))
        ->put(route('admin.profile.update'), [
            'name' => '',
        ])
        ->assertRedirect(route('admin.profile'))
        ->assertSessionHasErrors('name');
});
