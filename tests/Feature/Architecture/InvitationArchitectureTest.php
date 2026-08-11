<?php

use App\Actions\Admin\BulkInviteResidentsAction;
use App\Actions\Invitation\AcceptInvitationAction;
use App\Actions\Invitation\CreateInvitationAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Estate A']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate B']);

    $this->adminRoleA = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->adminRoleB = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->residentRoleA = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->residentRoleB = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);

    $this->adminUserA = User::factory()->create();
    $this->estateA->users()->attach($this->adminUserA->id, ['status' => 'accepted']);
    setPermissionsTeamId($this->estateA->id);
    $this->adminUserA->assignRole($this->adminRoleA);

    $this->assignAdminA = AdministrativeAssignment::create([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
});

test('1. Bulk import creates pending invitations rather than ghost users (password = null)', function () {
    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $emails = ['newuser1@example.com', 'newuser2@example.com'];
    $result = app(BulkInviteResidentsAction::class)->execute($emails, $this->estateA);

    expect($result['invited'])->toBe(2);

    // Assert NO ghost users were created in users table with null password
    expect(User::whereIn('email', $emails)->count())->toBe(0);

    // Assert pending invitations were created
    expect(Invitation::where('estate_id', $this->estateA->id)->whereIn('email', $emails)->count())->toBe(2);
});

test('2. New user can accept invitation and 3. creates exactly one User and 4. exactly one EstateMembership', function () {
    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'newresident@example.com',
        estate: $this->estateA,
        relationshipType: 'resident'
    );

    expect(User::where('email', 'newresident@example.com')->exists())->toBeFalse();

    $response = $this->post(route('invitations.accept', ['token' => $invitation->token]), [
        'name' => 'New Resident',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertRedirect();

    $user = User::where('email', 'newresident@example.com')->first();
    expect($user)->not->toBeNull();
    expect(User::where('email', 'newresident@example.com')->count())->toBe(1);

    $memberships = EstateMembership::where('user_id', $user->id)->where('estate_id', $this->estateA->id)->get();
    expect($memberships->count())->toBe(1);
    expect($invitation->fresh()->isAccepted())->toBeTrue();
});

test('5. Existing User receives invitation and 6. accepting invitation does not create duplicate User and 7. gains membership in invited estate and 8. original membership remains intact', function () {
    // Existing user belongs to Estate B
    $existingUser = User::factory()->create(['email' => 'existinguser@example.com']);
    $this->estateB->users()->attach($existingUser->id, ['status' => 'accepted']);

    // Admin in Estate A invites existing user to Estate A
    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'existinguser@example.com',
        estate: $this->estateA,
        relationshipType: 'resident'
    );

    expect($invitation)->not->toBeNull();

    // Accept invitation
    app(AcceptInvitationAction::class)->execute($invitation, $existingUser);

    // User count remains 1
    expect(User::where('email', 'existinguser@example.com')->count())->toBe(1);

    // User now belongs to Estate A AND Estate B
    expect(EstateMembership::where('user_id', $existingUser->id)->where('estate_id', $this->estateA->id)->count())->toBe(1);
    expect(EstateMembership::where('user_id', $existingUser->id)->where('estate_id', $this->estateB->id)->count())->toBe(1);
});

test('9. Already-member user does not receive a duplicate membership or invitation', function () {
    $existingUser = User::factory()->create(['email' => 'member@example.com']);
    $this->estateA->users()->attach($existingUser->id, ['status' => 'accepted']);

    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'member@example.com',
        estate: $this->estateA,
        relationshipType: 'resident'
    );

    expect($invitation)->toBeNull();
});

test('10. Re-importing the same email does not create uncontrolled duplicate pending invitations', function () {
    $action = app(CreateInvitationAction::class);

    $invitation1 = $action->execute(
        email: 'repeat@example.com',
        estate: $this->estateA,
        relationshipType: 'resident'
    );

    $token1 = $invitation1->token;

    $invitation2 = $action->execute(
        email: 'repeat@example.com',
        estate: $this->estateA,
        relationshipType: 'resident'
    );

    expect($invitation2->token)->not->toBe($token1);
    expect($invitation2->isPending())->toBeTrue();
    expect(Invitation::where('estate_id', $this->estateA->id)->where('email', 'repeat@example.com')->count())->toBe(1);
});

test('11. Estate A cannot create Estate B invitations and 12. cannot assign Estate B zones and 13. cannot assign Estate B roles', function () {
    $zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Zone B']);
    $roleB = Role::create(['name' => 'custom_role_b', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);

    $action = app(CreateInvitationAction::class);

    expect(fn () => $action->execute(
        email: 'test@example.com',
        estate: $this->estateA,
        relationshipType: 'resident',
        zoneId: $zoneB->id
    ))->toThrow(InvalidArgumentException::class);

    expect(fn () => $action->execute(
        email: 'test@example.com',
        estate: $this->estateA,
        relationshipType: 'resident',
        role: $roleB
    ))->toThrow(InvalidArgumentException::class);
});

test('14. Invalid token rejected and 15. Expired token rejected and 16. Cancelled token rejected and 17. Accepted token cannot be reused', function () {
    $userExpired = User::factory()->create(['email' => 'expired@example.com']);
    $userCancelled = User::factory()->create(['email' => 'cancelled@example.com']);
    $userAccepted = User::factory()->create(['email' => 'accepted@example.com']);

    // 14. Invalid token
    $responseInvalid = $this->get(route('invitations.show', ['token' => 'invalid-token-xyz']));
    $responseInvalid->assertNotFound();

    // 15. Expired token
    $expiredInv = Invitation::create([
        'estate_id' => $this->estateA->id,
        'email' => 'expired@example.com',
        'token' => 'expired-token-123',
        'status' => 'pending',
        'expires_at' => now()->subDay(),
    ]);

    expect(fn () => app(AcceptInvitationAction::class)->execute($expiredInv, $userExpired))
        ->toThrow(Exception::class);

    // 16. Cancelled token
    $cancelledInv = Invitation::create([
        'estate_id' => $this->estateA->id,
        'email' => 'cancelled@example.com',
        'token' => 'cancelled-token-123',
        'status' => 'cancelled',
    ]);

    expect(fn () => app(AcceptInvitationAction::class)->execute($cancelledInv, $userCancelled))
        ->toThrow(Exception::class);

    // 17. Accepted token reuse
    $acceptedInv = Invitation::create([
        'estate_id' => $this->estateA->id,
        'email' => 'accepted@example.com',
        'token' => 'accepted-token-123',
        'status' => 'accepted',
    ]);

    expect(fn () => app(AcceptInvitationAction::class)->execute($acceptedInv, $userAccepted))
        ->toThrow(Exception::class);
});

test('18. Existing user can have estate-local property-owner relationships without modifying another estate relationship', function () {
    $user = User::factory()->create(['email' => 'owner@example.com']);
    $this->estateA->users()->attach($user->id, ['status' => 'accepted', 'relationship_type' => 'resident']);

    $invitation = app(CreateInvitationAction::class)->execute(
        email: 'owner@example.com',
        estate: $this->estateB,
        relationshipType: 'property_owner'
    );

    app(AcceptInvitationAction::class)->execute($invitation, $user);

    $membershipA = EstateMembership::where('user_id', $user->id)->where('estate_id', $this->estateA->id)->first();
    $membershipB = EstateMembership::where('user_id', $user->id)->where('estate_id', $this->estateB->id)->first();

    expect($membershipA->relationship_type)->toBe('resident');
    expect($membershipB->relationship_type)->toBe('property_owner');
});

test('19. Invalid duplicate emails are reported and 20. Valid rows remain successfully processed', function () {
    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $emails = [
        'valid1@example.com',
        'valid2@example.com',
        'valid1@example.com', // duplicate in payload
    ];

    $result = app(BulkInviteResidentsAction::class)->execute($emails, $this->estateA);

    expect($result['invited'])->toBe(2);
    expect($result['duplicates'])->toBe(1);
    expect(Invitation::where('estate_id', $this->estateA->id)->count())->toBe(2);
});
