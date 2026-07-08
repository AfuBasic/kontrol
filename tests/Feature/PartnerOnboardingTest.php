<?php

use App\Actions\Zeus\AcceptInvitationAction;
use App\Mail\Zeus\PartnerMemberInvitationMail;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
    Mail::fake();
    Partner::truncate();
    User::where('user_type', 'affiliate')->delete();
});

test('zeus admin can create a partner and it starts as pending and invites the primary member', function () {
    $sessionKey = config('zeus.session_key');

    $response = $this->withSession([$sessionKey => true])
        ->post(route('zeus.partners.store'), [
            'name' => 'Apex Referral Network',
            'email' => 'contact@apexreferrals.com',
            'phone' => '+2348012345678',
            'commission_type' => 'percentage',
            'commission_rate' => '12.50',
            'commission_length' => 12,
        ]);

    $response->assertRedirect(route('zeus.partners.index'));
    $response->assertSessionHasNoErrors();

    // Verify partner is created in pending status
    $partner = Partner::where('email', 'contact@apexreferrals.com')->first();
    expect($partner)->not->toBeNull();
    expect($partner->status)->toBe('pending');
    expect($partner->commission_length)->toBe(12);

    // Verify corresponding user is created with partner_id and affiliate role
    $user = User::where('email', 'contact@apexreferrals.com')->first();
    expect($user)->not->toBeNull();
    expect($user->partner_id)->toBe($partner->id);
    expect($user->user_type)->toBe('affiliate');
    expect($user->hasRole('affiliate'))->toBeTrue();

    // Verify invitation email was queued
    Mail::assertQueued(PartnerMemberInvitationMail::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});

test('invited partner member accepting their invitation activates the partner status', function () {
    // 1. Create a partner and associated user manually in pending state
    $partner = Partner::create([
        'name' => 'Delta Partners',
        'email' => 'delta@partners.com',
        'commission_type' => 'percentage',
        'commission_rate' => 10,
        'status' => 'pending',
    ]);

    $user = User::create([
        'name' => 'Delta Partners',
        'email' => 'delta@partners.com',
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $user->assignRole('affiliate');

    expect($partner->fresh()->status)->toBe('pending');

    // 2. Accept invitation
    $action = app(AcceptInvitationAction::class);
    $action->execute($user, ['password_reset' => false]);

    // 3. Verify status changed to active
    expect($partner->fresh()->status)->toBe('active');
    expect($user->fresh()->email_verified_at)->not->toBeNull();
});

test('zeus admin can edit and manually toggle the partner status on the edit page', function () {
    $sessionKey = config('zeus.session_key');

    $partner = Partner::create([
        'name' => 'Gamma Referrals',
        'email' => 'gamma@referrals.com',
        'commission_type' => 'percentage',
        'commission_rate' => 10,
        'status' => 'pending',
    ]);

    // Update status to suspended
    $response = $this->withSession([$sessionKey => true])
        ->put(route('zeus.partners.update', $partner), [
            'name' => 'Gamma Referrals',
            'email' => 'gamma@referrals.com',
            'phone' => '+2348123456789',
            'commission_type' => 'percentage',
            'commission_rate' => '10.00',
            'commission_length' => '',
            'status' => 'suspended',
        ]);

    $response->assertRedirect(route('zeus.partners.index'));
    $response->assertSessionHasNoErrors();

    expect($partner->fresh()->status)->toBe('suspended');
});
