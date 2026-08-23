<?php

namespace Tests\Feature\Authorization;

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PolicyHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_cannot_update_role_from_different_estate()
    {
        // Estate A
        $estateA = Estate::factory()->create();
        $adminA = User::factory()->create();

        EstateMembership::create([
            'estate_id' => $estateA->id,
            'user_id' => $adminA->id,
            'status' => 'accepted',
        ]);

        $adminRole = Role::where('name', 'admin')->first();

        $assignmentA = AdministrativeAssignment::create([
            'user_id' => $adminA->id,
            'estate_id' => $estateA->id,
            'role_id' => $adminRole->id,
            'scope_type' => AssignmentScope::Estate,
            'is_active' => true,
        ]);

        $adminA->roles()->attach($adminRole, ['estate_id' => $estateA->id]);

        // Estate B
        $estateB = Estate::factory()->create();

        $roleB = Role::create([
            'name' => 'custom-role-b',
            'estate_id' => $estateB->id,
            'guard_name' => 'web',
        ]);

        $this->actingAs($adminA)->withSession(['active_context_assignment_id' => $assignmentA->id]);

        $response = $this->put(route('admin.roles.update', $roleB), [
            'name' => 'hacked-role-name',
            'permissions' => [],
        ]);

        $response->assertForbidden();
    }

    public function test_admin_cannot_delete_role_from_different_estate()
    {
        $estateA = Estate::factory()->create();
        $adminA = User::factory()->create();
        EstateMembership::create([
            'estate_id' => $estateA->id,
            'user_id' => $adminA->id,
            'status' => 'accepted',
        ]);

        $adminRole = Role::where('name', 'admin')->first();

        $assignmentA = AdministrativeAssignment::create([
            'user_id' => $adminA->id,
            'estate_id' => $estateA->id,
            'role_id' => $adminRole->id,
            'scope_type' => AssignmentScope::Estate,
            'is_active' => true,
        ]);
        $adminA->roles()->attach($adminRole, ['estate_id' => $estateA->id]);

        $estateB = Estate::factory()->create();
        $roleB = Role::create([
            'name' => 'custom-role-b',
            'estate_id' => $estateB->id,
            'guard_name' => 'web',
        ]);

        $this->actingAs($adminA)->withSession(['active_context_assignment_id' => $assignmentA->id]);

        $response = $this->delete(route('admin.roles.destroy', $roleB));
        $response->assertForbidden();
    }

    public function test_admin_cannot_manage_global_roles_through_admin_role_forms()
    {
        $estate = Estate::factory()->create();
        $admin = User::factory()->create();

        EstateMembership::create([
            'estate_id' => $estate->id,
            'user_id' => $admin->id,
            'status' => 'accepted',
        ]);

        $adminRole = Role::where('name', 'admin')->first();

        $assignment = AdministrativeAssignment::create([
            'user_id' => $admin->id,
            'estate_id' => $estate->id,
            'role_id' => $adminRole->id,
            'scope_type' => AssignmentScope::Estate,
            'is_active' => true,
        ]);
        $admin->roles()->attach($adminRole, ['estate_id' => $estate->id]);

        $globalRole = Role::create([
            'name' => 'global-custom-role',
            'estate_id' => null,
            'guard_name' => 'web',
        ]);

        $this->actingAs($admin)->withSession(['active_context_assignment_id' => $assignment->id]);

        $this->get(route('admin.roles.edit', $globalRole))->assertForbidden();

        $this->put(route('admin.roles.update', $globalRole), [
            'name' => 'renamed-global-role',
            'permissions' => [],
        ])->assertForbidden();

        $this->delete(route('admin.roles.destroy', $globalRole))->assertForbidden();
    }

    public function test_admin_can_update_role_in_their_own_estate()
    {
        $estateA = Estate::factory()->create();
        $adminA = User::factory()->create();
        EstateMembership::create([
            'estate_id' => $estateA->id,
            'user_id' => $adminA->id,
            'status' => 'accepted',
        ]);

        $adminRole = Role::where('name', 'admin')->first();

        $assignmentA = AdministrativeAssignment::create([
            'user_id' => $adminA->id,
            'estate_id' => $estateA->id,
            'role_id' => $adminRole->id,
            'scope_type' => AssignmentScope::Estate,
            'is_active' => true,
        ]);
        $adminA->roles()->attach($adminRole, ['estate_id' => $estateA->id]);

        $roleA = Role::create([
            'name' => 'custom-role-a',
            'estate_id' => $estateA->id,
            'guard_name' => 'web',
        ]);

        $this->actingAs($adminA)->withSession(['active_context_assignment_id' => $assignmentA->id]);

        $response = $this->put(route('admin.roles.update', $roleA), [
            'name' => 'updated-role-name',
            'permissions' => [],
        ]);

        $response->assertRedirect(route('admin.roles.index'));
        $this->assertDatabaseHas('roles', [
            'id' => $roleA->id,
            'name' => 'updated-role-name',
        ]);
    }
}
