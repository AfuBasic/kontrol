<?php

use App\Actions\Resident\CreateHouseholdMemberAction;
use App\Mail\Resident\HouseholdMemberInvitationMail;
use App\Models\Estate;
use App\Models\HouseholdMember;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'household_member', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
});

test('resident adding household member creates invitation and sends email with valid token link', function () {
    Mail::fake();

    $estate = Estate::factory()->create();
    $primaryResident = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);

    setPermissionsTeamId($estate->id);
    $primaryResident->assignRole('resident');
    $primaryResident->estates()->attach($estate->id, ['status' => 'accepted']);

    $action = app(CreateHouseholdMemberAction::class);
    $member = $action->execute(
        ['name' => 'Jane Doe', 'email' => 'jane@example.com'],
        $estate,
        $primaryResident,
    );

    expect($member->email)->toBe('jane@example.com');

    // Verify invitation record in database
    $invitation = Invitation::withoutGlobalScopes()
        ->where('email', 'jane@example.com')
        ->where('estate_id', $estate->id)
        ->first();

    expect($invitation)->not->toBeNull();
    expect($invitation->relationship_type)->toBe('household_member');
    expect($invitation->status)->toBe('pending');

    // Verify mail was queued
    Mail::assertQueued(HouseholdMemberInvitationMail::class, function (HouseholdMemberInvitationMail $mail) use ($invitation) {
        return str_contains($mail->invitationUrl, $invitation->token);
    });

    // Visiting invitation URL
    $response = $this->get(route('invitations.show', ['token' => $invitation->token]));
    $response->assertOk();

    // Accepting invitation
    $acceptResponse = $this->post(route('invitations.accept', ['token' => $invitation->token]));
    $acceptResponse->assertRedirect(route('resident.home'));

    // Check invitation is marked accepted
    $invitation->refresh();
    expect($invitation->status)->toBe('accepted');
});

test('resending household member invitation refreshes invitation and sends valid email', function () {
    Mail::fake();

    $estate = Estate::factory()->create();
    $primaryResident = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);

    setPermissionsTeamId($estate->id);
    $primaryResident->assignRole('resident');
    $primaryResident->estates()->attach($estate->id, ['status' => 'accepted']);

    $memberUser = User::factory()->create(['name' => 'Jane Doe', 'email' => 'jane@example.com']);
    $householdMember = HouseholdMember::create([
        'estate_id' => $estate->id,
        'primary_resident_id' => $primaryResident->id,
        'household_member_id' => $memberUser->id,
    ]);
    $memberUser->estates()->attach($estate->id, ['status' => 'pending']);

    $response = $this->actingAs($primaryResident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.household.reset-password', ['householdMember' => $householdMember->id]));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $invitation = Invitation::withoutGlobalScopes()
        ->where('email', 'jane@example.com')
        ->where('estate_id', $estate->id)
        ->first();

    expect($invitation)->not->toBeNull();
    expect($invitation->relationship_type)->toBe('household_member');
    expect($invitation->status)->toBe('pending');

    Mail::assertQueued(HouseholdMemberInvitationMail::class, function (HouseholdMemberInvitationMail $mail) use ($invitation) {
        return str_contains($mail->invitationUrl, $invitation->token);
    });
});
