<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\Activity;
use App\Models\Estate;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Estate Alpha']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate Beta']);

    $this->permAdmin = Permission::create(['name' => 'settings.manage', 'guard_name' => 'web']);
    $this->permResident = Permission::create(['name' => 'visitors.create', 'guard_name' => 'web']);

    $this->roleAdminA = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->roleAdminA->givePermissionTo($this->permAdmin);

    $this->roleResidentB = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->roleResidentB->givePermissionTo($this->permResident);

    $this->multiUser = User::factory()->create(['email' => 'multi.user@example.com']);

    // Estate A membership (First membership created)
    DB::table('estate_users_membership')->insert([
        'user_id' => $this->multiUser->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
        'relationship_type' => 'staff',
        'created_at' => now()->subDays(10),
        'updated_at' => now()->subDays(10),
    ]);

    // Estate B membership (Second membership created)
    DB::table('estate_users_membership')->insert([
        'user_id' => $this->multiUser->id,
        'estate_id' => $this->estateB->id,
        'status' => 'accepted',
        'relationship_type' => 'resident',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->assignAdminA = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->multiUser,
        estate: $this->estateA,
        role: $this->roleAdminA,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );

    $this->assignResidentB = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->multiUser,
        estate: $this->estateB,
        role: $this->roleResidentB,
        scopeType: AssignmentScope::Estate,
        isPrimary: false
    );
});

test('1. Multi-estate context isolation and 2. First-estate bug prevention (Active context = Estate B operates in B even if Estate A is first)', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    // Activate Context for Estate B (Second membership)
    $contextManager->activate($this->assignResidentB);

    expect($contextManager->current()->estateId)->toBe($this->estateB->id);
    expect(getPermissionsTeamId())->toBe($this->estateB->id);

    // Activity logging respects ContextManager active estate B rather than first estate A
    $activity = Activity::create([
        'log_name' => 'test',
        'description' => 'User performed action in Estate B',
        'causer_id' => $this->multiUser->id,
        'causer_type' => User::class,
    ]);

    expect($activity->estate_id)->toBe($this->estateB->id);
});

test('3. Role routing & authorization isolation: Active Context B (Resident) does not authorize Admin functionality from Estate A', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    // Activate Context B (Resident)
    $contextManager->activate($this->assignResidentB);

    // Cannot access settings.manage permission from Estate A
    expect($this->multiUser->can('settings.manage'))->toBeFalse();
    expect($this->multiUser->contextHasRole('admin'))->toBeFalse();

    // Accessing admin route is blocked (forbidden or redirected to context picker)
    $response = $this->get(route('admin.roles.index'));
    expect(in_array($response->status(), [403, 302]))->toBeTrue();
});

test('4. Subscription & EstateContextService strictly derive estate from ContextManager current context', function () {
    $contextManager = app(ContextManager::class);
    $estateContextService = app(EstateContextService::class);
    $this->actingAs($this->multiUser);

    $contextManager->activate($this->assignAdminA);
    expect($estateContextService->getEstateId())->toBe($this->estateA->id);

    $contextManager->activate($this->assignResidentB);
    expect($estateContextService->getEstateId())->toBe($this->estateB->id);
});

test('5. Spatie team ID and cached permissions switch dynamically on context activation', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    // Switch to Estate A
    $contextManager->activate($this->assignAdminA);
    expect($this->multiUser->can('settings.manage'))->toBeTrue();

    // Switch to Estate B
    $contextManager->activate($this->assignResidentB);
    expect($this->multiUser->can('settings.manage'))->toBeFalse();
    expect($this->multiUser->can('visitors.create'))->toBeTrue();
});

test('6. Auth audit diagnostic tool passes cleanly with 0 integrity issues', function () {
    $exitCode = Artisan::call('kontrol:auth-audit');
    expect($exitCode)->toBe(0);
});
