<?php

use App\Mail\Organization\OrganizationInvitationMail;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'St. Jude Medical',
        'type' => 'hospital',
        'is_active' => true,
    ]);

    $this->adminUser = User::factory()->create([
        'name' => 'Org Admin',
        'email' => 'admin@stjude.com',
    ]);

    $this->adminMembership = OrganizationMembership::create([
        'user_id' => $this->adminUser->id,
        'organization_id' => $this->org->id,
        'role' => 'admin',
        'is_active' => true,
    ]);
});

test('organization admin can invite existing user as staff and dispatches invitation email', function () {
    Mail::fake();

    $staffUser = User::factory()->create([
        'name' => 'Nurse Jackie',
        'email' => 'jackie@stjude.com',
        'password' => bcrypt('Secret123!'),
    ]);

    $response = $this->actingAs($this->adminUser)
        ->withSession([\App\Services\OrganizationContextService::SESSION_KEY => $this->org->id])
        ->post(route('org.settings.staff.invite'), [
            'email' => 'jackie@stjude.com',
            'role' => 'member',
        ]);

    $response->assertRedirect()->assertSessionHas('success');

    $this->assertDatabaseHas('organization_memberships', [
        'organization_id' => $this->org->id,
        'user_id' => $staffUser->id,
        'role' => 'member',
        'is_active' => true,
    ]);

    Mail::assertQueued(OrganizationInvitationMail::class, function ($mail) use ($staffUser) {
        return $mail->hasTo($staffUser->email)
            && $mail->role === 'member'
            && $mail->isExistingUser === true;
    });
});
