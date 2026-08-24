<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use App\Notifications\ResidentApproved;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();
    $this->adminRole = Role::where('name', 'admin')->whereNull('estate_id')->firstOrFail();
    $this->residentRole = Role::where('name', 'resident')->whereNull('estate_id')->firstOrFail();

    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->adminAssignment = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->admin,
        estate: $this->estate,
        role: $this->adminRole,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );
});

function createPendingApprovalResident(?Zone $zone = null, string $status = 'pending'): User
{
    $resident = User::factory()->create();

    setPermissionsTeamId(test()->estate->id);
    $resident->assignRole(test()->residentRole);

    test()->estate->users()->attach($resident->id, [
        'status' => $status,
        'relationship_type' => 'resident',
        'zone_id' => $zone?->id,
    ]);

    return $resident;
}

function createApprovalZoneAssignment(Zone $zone): AdministrativeAssignment
{
    return app(CreateAdministrativeAssignmentAction::class)->execute(
        user: test()->admin,
        estate: test()->estate,
        role: test()->adminRole,
        scopeType: AssignmentScope::Zone,
        zone: $zone,
        isPrimary: false
    );
}

function approvalMembershipStatus(User $user): ?string
{
    return DB::table('estate_users_membership')
        ->where('estate_id', test()->estate->id)
        ->where('user_id', $user->id)
        ->value('status');
}

it('passes mobile-friendly submitted dates to the pending approvals page', function () {
    $resident = createPendingApprovalResident();

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.residents.approvals.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Residents/Approvals/Index')
            ->has('residents.data', 1)
            ->where('residents.data.0.id', $resident->id)
            ->where('residents.data.0.created_at_human', $resident->created_at->format('M d, Y'))
        );
});

it('blocks zone-scoped admins from approving pending residents outside their zone', function () {
    Notification::fake();

    $allowedZone = Zone::factory()->create(['estate_id' => $this->estate->id]);
    $outsideZone = Zone::factory()->create(['estate_id' => $this->estate->id]);
    $outsideResident = createPendingApprovalResident($outsideZone);
    $zoneAssignment = createApprovalZoneAssignment($allowedZone);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $zoneAssignment->id])
        ->post(route('admin.residents.approvals.approve', $outsideResident))
        ->assertForbidden();

    expect(approvalMembershipStatus($outsideResident))->toBe('pending');
    Notification::assertNothingSent();
});

it('limits approve all to the active zone context', function () {
    Notification::fake();

    $allowedZone = Zone::factory()->create(['estate_id' => $this->estate->id]);
    $outsideZone = Zone::factory()->create(['estate_id' => $this->estate->id]);
    $allowedResident = createPendingApprovalResident($allowedZone);
    $outsideResident = createPendingApprovalResident($outsideZone);
    $zoneAssignment = createApprovalZoneAssignment($allowedZone);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $zoneAssignment->id])
        ->post(route('admin.residents.approvals.approve-all'))
        ->assertRedirect();

    expect(approvalMembershipStatus($allowedResident))->toBe('accepted')
        ->and(approvalMembershipStatus($outsideResident))->toBe('pending');

    Notification::assertSentTo($allowedResident, ResidentApproved::class);
    Notification::assertNotSentTo($outsideResident, ResidentApproved::class);
});

it('rejects approval submissions for residents that are not pending', function () {
    Notification::fake();

    $zone = Zone::factory()->create(['estate_id' => $this->estate->id]);
    $resident = createPendingApprovalResident($zone, 'accepted');
    $zoneAssignment = createApprovalZoneAssignment($zone);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $zoneAssignment->id])
        ->post(route('admin.residents.approvals.approve', $resident))
        ->assertNotFound();

    expect(approvalMembershipStatus($resident))->toBe('accepted');
    Notification::assertNothingSent();
});
