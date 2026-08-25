<?php

use App\Models\Estate;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('partner estate stats combine resident and property_owner roles and exclude admins', function () {
    $partner = Partner::factory()->create();
    $estate = Estate::factory()->create(['partner_id' => $partner->id]);

    $residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $ownerRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $resident1 = User::factory()->create();
    $resident2 = User::factory()->create();
    $owner = User::factory()->create();
    $admin = User::factory()->create();

    // Attach users to estate with accepted status
    $estate->users()->attach([
        $resident1->id => ['status' => 'accepted'],
        $resident2->id => ['status' => 'accepted'],
        $owner->id => ['status' => 'accepted'],
        $admin->id => ['status' => 'accepted'],
    ]);

    // Assign roles scoped by estate_id in model_has_roles
    DB::table('model_has_roles')->insert([
        ['role_id' => $residentRole->id, 'model_type' => User::class, 'model_id' => $resident1->id, 'estate_id' => $estate->id],
        ['role_id' => $residentRole->id, 'model_type' => User::class, 'model_id' => $resident2->id, 'estate_id' => $estate->id],
        ['role_id' => $ownerRole->id, 'model_type' => User::class, 'model_id' => $owner->id, 'estate_id' => $estate->id],
        ['role_id' => $adminRole->id, 'model_type' => User::class, 'model_id' => $admin->id, 'estate_id' => $estate->id],
    ]);

    $partnerUser = User::factory()->create(['partner_id' => $partner->id]);

    $this->actingAs($partnerUser)
        ->get(route('partner.estates.show', $estate))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/Estates/Show')
            ->has('estate.counts', fn ($counts) => $counts
                ->where('residents', 3)
                ->where('resident_only', 2)
                ->where('property_owners', 1)
                ->where('people', 3)
                ->where('admins', 1)
                ->where('members', 3)
                ->etc()
            )
        );
});
