<?php

use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Services\PaystackService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'collections.view']);
    $adminRole->givePermissionTo('collections.view');

    $this->estate = Estate::factory()->create();
    $this->adminUser = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    
    app(\App\Actions\Admin\CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->adminUser,
        estate: $this->estate,
        role: $adminRole,
        scopeType: \App\Enums\AssignmentScope::Estate
    );
    $this->estate->users()->attach($this->adminUser->id, ['status' => 'accepted']);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    EstateSettings::forEstate($this->estate->id)->update([
        'bank_name' => 'Access Bank',
        'bank_code' => '044',
        'account_number' => '0123456789',
        'account_name' => 'Estate Settlement Account',
    ]);

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('getBanks')->andReturn([
            ['name' => 'Access Bank', 'code' => '044'],
        ]);
    });
});

it('renders the admin collections index with settlement settings', function () {
    $this->actingAs($this->adminUser)
        ->get(route('admin.collections.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Collections/Index')
            ->has('settlement', fn ($settlement) => $settlement
                ->where('bank_name', 'Access Bank')
                ->where('bank_code', '044')
                ->where('account_number', '0123456789')
                ->where('account_name', 'Estate Settlement Account')
            )
            ->has('banks', 1)
        );
});
