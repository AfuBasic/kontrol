<?php

namespace Tests\Feature\Authorization;

use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PolicyHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Ensure the global admin role exists (used for checking permissions)
        Role::firstOrCreate(['name' => 'admin', 'estate_id' => null, 'guard_name' => 'web']);
    }

    public function test_admin_cannot_update_role_from_different_estate()
    {
        // Estate A
        $estateA = Estate::factory()->create();
        $adminA = User::factory()->create();
        
        // Assign Admin A to Estate A
        $membershipA = EstateMembership::factory()->create([
            'estate_id' => $estateA->id,
            'user_id' => $adminA->id,
            'role' => 'admin',
        ]);
        $adminA->roles()->attach(Role::where('name', 'admin')->first(), ['team_id' => $estateA->id]);

        // Estate B
        $estateB = Estate::factory()->create();
        
        // A custom role belonging to Estate B
        $roleB = Role::create([
            'name' => 'custom-role-b',
            'estate_id' => $estateB->id,
            'guard_name' => 'web'
        ]);

        // Admin A logs in and accesses Estate A context
        $this->actingAs($adminA)->withSession(['active_context' => $membershipA->id]);

        // Admin A attempts to update Role B via spoofing
        $response = $this->put(route('admin.roles.update', $roleB), [
            'name' => 'hacked-role-name',
            'permissions' => []
        ]);

        // Should be forbidden by the RolePolicy because roleB->team_id !== estateA->id
        $response->assertForbidden();
    }

    public function test_admin_cannot_delete_role_from_different_estate()
    {
        $estateA = Estate::factory()->create();
        $adminA = User::factory()->create();
        $membershipA = EstateMembership::factory()->create([
            'estate_id' => $estateA->id,
            'user_id' => $adminA->id,
            'role' => 'admin',
        ]);
        $adminA->roles()->attach(Role::where('name', 'admin')->first(), ['team_id' => $estateA->id]);

        $estateB = Estate::factory()->create();
        $roleB = Role::create([
            'name' => 'custom-role-b',
            'estate_id' => $estateB->id, // or team_id depending on config, but role factory typically handles it
            'guard_name' => 'web'
        ]);

        $this->actingAs($adminA)->withSession(['active_context' => $membershipA->id]);

        $response = $this->delete(route('admin.roles.destroy', $roleB));
        $response->assertForbidden();
    }

    public function test_admin_can_update_role_in_their_own_estate()
    {
        $estateA = Estate::factory()->create();
        $adminA = User::factory()->create();
        $membershipA = EstateMembership::factory()->create([
            'estate_id' => $estateA->id,
            'user_id' => $adminA->id,
            'role' => 'admin',
        ]);
        $adminA->roles()->attach(Role::where('name', 'admin')->first(), ['team_id' => $estateA->id]);

        // A custom role belonging to Estate A
        $roleA = Role::create([
            'name' => 'custom-role-a',
            'estate_id' => $estateA->id,
            'guard_name' => 'web'
        ]);

        $this->actingAs($adminA)->withSession(['active_context' => $membershipA->id]);

        // Valid update payload based on typical controller requirements
        $response = $this->put(route('admin.roles.update', $roleA), [
            'name' => 'updated-role-name',
            'permissions' => [] // empty permissions for simplicity
        ]);

        $response->assertRedirect(route('admin.roles.index'));
        $this->assertDatabaseHas('roles', [
            'id' => $roleA->id,
            'name' => 'updated-role-name'
        ]);
    }
}
