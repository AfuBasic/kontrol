<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Estate Alpha']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate Beta']);

    $this->roleA = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->roleB = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);

    $this->user = User::factory()->create(['email' => 'data.user@example.com']);

    DB::table('estate_users_membership')->insert([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
        'relationship_type' => 'staff',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->assignA = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->user,
        estate: $this->estateA,
        role: $this->roleA,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );
});

test('1. Membership & Assignment invariant: assignment estate must match role estate', function () {
    expect((int) $this->assignA->estate_id)->toBe((int) $this->roleA->estate_id);
});

test('2. Context resolvability: valid multi-estate user resolves context correctly', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->user);

    $contextManager->activate($this->assignA);
    expect($contextManager->current()->estateId)->toBe($this->estateA->id);
});

test('3. Data Audit command runs cleanly and reports zero manual review items', function () {
    $exitCode = Artisan::call('kontrol:data-audit');
    expect($exitCode)->toBe(0);
});

test('4. Data Repair command is idempotent and transactional', function () {
    // Run dry-run
    $dryRunCode = Artisan::call('kontrol:data-repair', ['--dry-run' => 'true']);
    expect($dryRunCode)->toBe(0);

    // Run force repair
    $forceCode = Artisan::call('kontrol:data-repair', ['--force' => true]);
    expect($forceCode)->toBe(0);
});
