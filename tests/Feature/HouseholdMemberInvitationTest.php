<?php

use App\Actions\Resident\CreateHouseholdMemberAction;
use App\Mail\Resident\HouseholdMemberInvitationMail;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Feature;
use App\Models\HouseholdMember;
use App\Models\Invitation;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Notifications\Resident\HouseholdMemberInvitationAcceptedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
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
    Notification::fake();

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

    // Verify notification was sent
    Notification::assertSentTo(
        [$primaryResident], HouseholdMemberInvitationAcceptedNotification::class
    );
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
        ->post(route('resident.household.resend-invitation', ['householdMember' => $householdMember->id]));

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

test('resident billed estates enforce the subscriber plan household limit', function () {
    Mail::fake();

    $feature = Feature::create([
        'name' => 'Household Management',
        'slug' => 'household-management',
        'group' => 'resident',
        'is_global' => true,
        'is_active' => true,
    ]);

    $estatePlan = Plan::factory()->create(['name' => 'Estate Baseline']);
    $estatePlan->features()->attach($feature->id, ['is_enabled' => true, 'limit' => '0']);

    $residentPlan = Plan::factory()->create(['name' => 'Resident Pro']);
    $residentPlan->features()->attach($feature->id, ['is_enabled' => true, 'limit' => '2']);

    $estate = Estate::factory()->active()->create();
    $estate->settings()->update(['charge_type' => 'residents']);

    EstateSubscription::factory()->create([
        'estate_id' => $estate->id,
        'plan_id' => $estatePlan->id,
        'status' => 'active',
    ]);

    $primaryResident = User::factory()->create(['email' => 'resident@example.com']);

    setPermissionsTeamId($estate->id);
    $primaryResident->assignRole('resident');
    $primaryResident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::factory()->create([
        'user_id' => $primaryResident->id,
        'estate_id' => $estate->id,
        'plan_id' => $residentPlan->id,
        'status' => 'active',
        'current_period_start' => now()->subDay(),
        'current_period_end' => now()->addMonth(),
    ]);

    $existingMember = User::factory()->create(['email' => 'first-member@example.com']);
    $existingMember->estates()->attach($estate->id, ['status' => 'pending']);
    HouseholdMember::create([
        'estate_id' => $estate->id,
        'primary_resident_id' => $primaryResident->id,
        'household_member_id' => $existingMember->id,
    ]);

    $this->actingAs($primaryResident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.household.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/Household/Index')
            ->where('estate_plan.limits.max_household_members', 2)
            ->has('members', 1));

    expect($estate->fresh()->canAddMoreHouseholdMembers($primaryResident))->toBeTrue();

    app(CreateHouseholdMemberAction::class)->execute(
        ['name' => 'Second Member', 'email' => 'second-member@example.com'],
        $estate,
        $primaryResident,
    );

    expect(HouseholdMember::where('estate_id', $estate->id)
        ->where('primary_resident_id', $primaryResident->id)
        ->count())->toBe(2);
});

test('zero household member limit is exposed as unlimited instead of zero', function () {
    $feature = Feature::create([
        'name' => 'Household Management',
        'slug' => 'household-management',
        'group' => 'resident',
        'is_global' => true,
        'is_active' => true,
    ]);

    $residentPlan = Plan::factory()->create(['name' => 'Resident Unlimited']);
    $residentPlan->features()->attach($feature->id, ['is_enabled' => true, 'limit' => '0']);

    $estate = Estate::factory()->active()->create();
    $estate->settings()->update(['charge_type' => 'residents']);

    $primaryResident = User::factory()->create(['email' => 'unlimited@example.com']);

    setPermissionsTeamId($estate->id);
    $primaryResident->assignRole('resident');
    $primaryResident->estates()->attach($estate->id, ['status' => 'accepted']);

    ResidentSubscription::factory()->create([
        'user_id' => $primaryResident->id,
        'estate_id' => $estate->id,
        'plan_id' => $residentPlan->id,
        'status' => 'active',
        'current_period_start' => now()->subDay(),
        'current_period_end' => now()->addMonth(),
    ]);

    $member = User::factory()->create(['email' => 'unlimited-member@example.com']);
    HouseholdMember::create([
        'estate_id' => $estate->id,
        'primary_resident_id' => $primaryResident->id,
        'household_member_id' => $member->id,
    ]);

    $this->actingAs($primaryResident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.household.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Resident/Household/Index')
            ->where('estate_plan.limits.max_household_members', null)
            ->has('members', 1));

    expect($estate->fresh()->getHouseholdMemberLimit($primaryResident))->toBeNull()
        ->and($estate->fresh()->canAddMoreHouseholdMembers($primaryResident))->toBeTrue();
});
