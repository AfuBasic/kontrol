<?php

use App\Actions\Zeus\UpdatePartnerAssignmentAction;
use App\Auth\ContextManager;
use App\Models\Activity;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Permission::create(['name' => 'change-partner-assignment', 'guard_name' => 'web']);
    Role::create(['name' => 'admin', 'guard_name' => 'web']);
    Role::create(['name' => 'security', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->authorizedAdmin = User::factory()->create();
    $this->unauthorizedAdmin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);

    Role::findByName('admin')->givePermissionTo('change-partner-assignment');

    $this->authorizedAdmin->assignRole('admin');
    $this->authorizedAdmin->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->unauthorizedAdmin->assignRole('security');
    $this->unauthorizedAdmin->estates()->attach($this->estate->id, ['status' => 'accepted']);
});

it('allows only authorized admins to change partner assignment', function () {
    setPermissionsTeamId($this->estate->id);

    // Test authorized admin
    $this->actingAs($this->authorizedAdmin);
    app(ContextManager::class)->resolve();

    expect(Gate::forUser($this->authorizedAdmin)->allows('update', $this->estate))->toBeTrue();

    // Test unauthorized admin
    $this->actingAs($this->unauthorizedAdmin);
    app(ContextManager::class)->resolve();

    expect(Gate::forUser($this->unauthorizedAdmin)->allows('update', $this->estate))->toBeFalse();
});

it('creates an audit log entry when partner assignment changes via zeus action', function () {
    $oldPartner = Partner::factory()->create();
    $newPartner = Partner::factory()->create();

    $estate = Estate::factory()->create([
        'partner_id' => $oldPartner->id,
    ]);

    $admin = User::factory()->create();

    app(UpdatePartnerAssignmentAction::class)->execute($estate, [
        'partner_id' => $newPartner->id,
        'reason' => 'Correcting attribution error',
    ], $admin);

    $estate->refresh();

    expect($estate->partner_id)->toBe($newPartner->id)
        ->and($estate->commission_plan_id)->not->toBeNull();

    $activity = Activity::query()
        ->where('subject_type', Estate::class)
        ->where('subject_id', $estate->id)
        ->latest('id')
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain('Partner changed from')
        ->and($activity->description)->toContain('Correcting attribution error');
});
