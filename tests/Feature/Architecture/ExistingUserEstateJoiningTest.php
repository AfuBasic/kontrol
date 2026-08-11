<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Actions\Invitation\AcceptInvitationAction;
use App\Actions\Invitation\CreateInvitationAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Estate Alpha']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate Beta']);

    $this->roleA = Role::create(['name' => 'estate_admin_a', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->roleB = Role::create(['name' => 'estate_admin_b', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);

    $this->existingUser = User::factory()->create([
        'name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'password' => bcrypt('Password123!'),
    ]);

    // Attach existing user to Estate A
    DB::table('estate_users_membership')->insert([
        'user_id' => $this->existingUser->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
        'relationship_type' => 'resident',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->assignA = AdministrativeAssignment::create([
        'user_id' => $this->existingUser->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->roleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
});

test('1. Existing user accepting invitation does not create another User and 2. Existing membership remains untouched and 3. New estate membership is created exactly once', function () {
    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'property_owner'
    );

    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    // Assert user count remains exactly 1
    expect(User::where('email', 'john.doe@example.com')->count())->toBe(1);

    // Assert Estate A membership remains intact
    $membershipA = EstateMembership::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateA->id)->first();
    expect($membershipA)->not->toBeNull();
    expect($membershipA->status)->toBe('accepted');
    expect($membershipA->relationship_type)->toBe('resident');

    // Assert Estate B membership was created exactly once
    $membershipB = EstateMembership::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateB->id)->get();
    expect($membershipB->count())->toBe(1);
    expect($membershipB->first()->status)->toBe('accepted');
    expect($membershipB->first()->relationship_type)->toBe('property_owner');
});

test('4. Duplicate acceptance does not create duplicate membership', function () {
    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'staff'
    );

    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    // Attempt second execution
    $invitation->update(['status' => 'pending']);
    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    expect(EstateMembership::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateB->id)->count())->toBe(1);
});

test('5. Pending membership transitions correctly to accepted upon invitation acceptance', function () {
    // Manually insert pending membership
    DB::table('estate_users_membership')->insert([
        'user_id' => $this->existingUser->id,
        'estate_id' => $this->estateB->id,
        'status' => 'pending',
        'relationship_type' => 'resident',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $invitation = Invitation::create([
        'estate_id' => $this->estateB->id,
        'email' => 'john.doe@example.com',
        'relationship_type' => 'resident',
        'token' => 'pending-invitation-token',
        'status' => 'pending',
    ]);

    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    $membershipB = EstateMembership::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateB->id)->first();
    expect($membershipB->status)->toBe('accepted');
});

test('6. Invitation relationship type becomes estate-scoped membership relationship', function () {
    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'security'
    );

    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    $membershipB = EstateMembership::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateB->id)->first();
    expect($membershipB->relationship_type)->toBe('security');
});

test('7. Estate A property-owner relationship remains intact and 8. Estate B property-owner relationship can coexist', function () {
    $ownerA = User::factory()->create();
    $ownerB = User::factory()->create();

    DB::table('estate_users_membership')
        ->where('user_id', $this->existingUser->id)
        ->where('estate_id', $this->estateA->id)
        ->update(['property_owner_id' => $ownerA->id, 'relationship_type' => 'resident']);

    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'resident'
    );

    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    DB::table('estate_users_membership')
        ->where('user_id', $this->existingUser->id)
        ->where('estate_id', $this->estateB->id)
        ->update(['property_owner_id' => $ownerB->id]);

    $membershipA = EstateMembership::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateA->id)->first();
    $membershipB = EstateMembership::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateB->id)->first();

    expect($membershipA->property_owner_id)->toBe($ownerA->id);
    expect($membershipB->property_owner_id)->toBe($ownerB->id);
});

test('9. Administrative invitation creates only valid estate-scoped assignment and 10. Global role cannot be assigned', function () {
    $roleB = Role::create(['name' => 'admin_b', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $globalRole = Role::create(['name' => 'global_admin', 'guard_name' => 'web', 'estate_id' => null]);

    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'staff',
        role: $roleB
    );

    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    $assignmentB = AdministrativeAssignment::where('user_id', $this->existingUser->id)->where('estate_id', $this->estateB->id)->first();
    expect($assignmentB)->not->toBeNull();
    expect($assignmentB->role_id)->toBe($roleB->id);

    // Global role assignment failure
    expect(fn () => app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->existingUser,
        estate: $this->estateB,
        role: $globalRole,
        scopeType: AssignmentScope::Estate
    ))->toThrow(ValidationException::class);
});

test('11. Valid zone in invited estate succeeds and 12. Zone belonging to another estate fails', function () {
    $zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Zone B']);
    $zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);

    $invitationValid = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'resident',
        zoneId: $zoneB->id
    );

    expect($invitationValid->zone_id)->toBe($zoneB->id);

    // Attempt creating invitation with another estate's zone
    expect(fn () => app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'resident',
        zoneId: $zoneA->id
    ))->toThrow(InvalidArgumentException::class);
});

test('13. Archived zone follows established lifecycle rules during invitation creation', function () {
    $archivedZone = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Archived Zone', 'is_active' => false, 'deleted_at' => now()]);

    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'resident',
        zoneId: $archivedZone->id
    );

    expect($invitation)->not->toBeNull();
    expect($invitation->zone_id)->toBe($archivedZone->id);
});

test('14. Wrong authenticated email cannot accept the invitation', function () {
    $wrongUser = User::factory()->create(['email' => 'other.person@example.com']);
    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'resident'
    );

    $this->actingAs($wrongUser);

    $response = $this->post(route('invitations.accept', ['token' => $invitation->token]));
    $response->assertSessionHasErrors(['email']);
});

test('15. Invalid token fails and 16. Expired invitation fails and 17. Cancelled invitation fails and 18. Already-accepted invitation is handled safely', function () {
    $userExpired = User::factory()->create(['email' => 'user.expired@example.com']);
    $userCancelled = User::factory()->create(['email' => 'user.cancelled@example.com']);
    $userAccepted = User::factory()->create(['email' => 'user.accepted@example.com']);

    // 15. Invalid token
    $this->get(route('invitations.show', ['token' => 'non-existent-token']))->assertNotFound();

    // 16. Expired token
    $expiredInv = Invitation::create([
        'estate_id' => $this->estateB->id,
        'email' => 'user.expired@example.com',
        'token' => 'token-expired',
        'status' => 'pending',
        'expires_at' => now()->subHours(2),
    ]);

    expect(fn () => app(AcceptInvitationAction::class)->execute($expiredInv, $userExpired))
        ->toThrow(Exception::class);

    // 17. Cancelled token
    $cancelledInv = Invitation::create([
        'estate_id' => $this->estateB->id,
        'email' => 'user.cancelled@example.com',
        'token' => 'token-cancelled',
        'status' => 'cancelled',
    ]);

    expect(fn () => app(AcceptInvitationAction::class)->execute($cancelledInv, $userCancelled))
        ->toThrow(Exception::class);

    // 18. Already accepted
    $acceptedInv = Invitation::create([
        'estate_id' => $this->estateB->id,
        'email' => 'user.accepted@example.com',
        'token' => 'token-accepted',
        'status' => 'accepted',
    ]);

    expect(fn () => app(AcceptInvitationAction::class)->execute($acceptedInv, $userAccepted))
        ->toThrow(Exception::class);
});

test('19. Existing active context remains stable and 20. Newly joined estate appears in Context Picker', function () {
    $this->actingAs($this->existingUser);
    $contextManager = app(ContextManager::class);

    // Set active context on Estate A
    $contextManager->activate($this->assignA);
    expect($contextManager->current()->estateId)->toBe($this->estateA->id);

    // Accept invitation to Estate B
    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'john.doe@example.com',
        estate: $this->estateB,
        relationshipType: 'resident',
        role: $this->roleB
    );

    app(AcceptInvitationAction::class)->execute($invitation, $this->existingUser);

    // Active context remains on Estate A
    expect($contextManager->current()->estateId)->toBe($this->estateA->id);

    // Newly joined estate appears in Context Picker assignments
    $validAssignments = $contextManager->getValidAssignments($this->existingUser);
    $estateIds = $validAssignments->pluck('estate_id')->toArray();

    expect($estateIds)->toContain($this->estateA->id);
    expect($estateIds)->toContain($this->estateB->id);
});
