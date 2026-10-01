<?php

use App\Jobs\RenewBulkVisitorInvitesJob;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use App\Notifications\BulkInviteRenewalBlockedNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Metro College',
        'type' => 'business',
        'is_active' => true,
    ]);

    $this->orgAdmin = User::factory()->create();
    $this->membership = OrganizationMembership::create([
        'user_id' => $this->orgAdmin->id,
        'organization_id' => $this->org->id,
        'role' => 'admin',
        'is_active' => true,
    ]);

    $this->plan = Plan::create([
        'name' => 'Estate Pro',
        'slug' => 'estate-pro',
        'estate_id' => $this->estate->id,
        'price_per_month' => 50000,
        'price_per_year' => 500000,
        'features' => ['access-code-generation'],
        'is_active' => true,
    ]);

    $this->subscription = EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => $this->plan->id,
        'status' => 'active',
        'billing_interval' => 'monthly',
    ]);
});

function dueGroup($test, array $overrides = []): OrganizationBulkInvite
{
    $invite = OrganizationBulkInvite::create(array_merge([
        'estate_id' => $test->estate->id,
        'organization_id' => $test->org->id,
        'created_by' => $test->orgAdmin->id,
        'name' => 'Group '.uniqid(),
        'status' => 'active',
        'auto_renew' => true,
        'valid_from' => now()->subDays(20)->toDateString(),
        'valid_until' => now()->subDays(10)->toDateString(),
        'next_renewal_at' => now()->subDays(11)->toDateString(),
    ], $overrides));

    OrganizationBulkInviteRecipient::create(['bulk_invite_id' => $invite->id, 'email' => 'a@example.com', 'status' => 'active', 'delivery_status' => 'sent']);

    return $invite;
}

test('a blocked renewal tells the creator once, and a same-day rerun does not crash', function () {
    Notification::fake();
    $this->subscription->update(['status' => 'cancelled']);
    $invite = dueGroup($this);

    (new RenewBulkVisitorInvitesJob($invite->id))->handle();
    (new RenewBulkVisitorInvitesJob($invite->id))->handle();

    Notification::assertSentToTimes($this->orgAdmin, BulkInviteRenewalBlockedNotification::class, 1);
    expect($invite->fresh()->renewal_blocked_reason)->toBe('subscription_required')
        ->and($invite->renewals()->where('status', 'blocked')->count())->toBe(1);
});

test('a group that sat blocked renews from today, not from the past', function () {
    Notification::fake();
    $invite = dueGroup($this, ['renewal_blocked_reason' => 'subscription_required']);

    (new RenewBulkVisitorInvitesJob($invite->id))->handle();

    expect($invite->fresh()->valid_from->toDateString())->toBe(now()->toDateString());
});

test('one failing group does not stop the others in the nightly run', function () {
    Notification::fake();
    $broken = dueGroup($this, ['name' => 'Broken']);
    $healthy = dueGroup($this, ['name' => 'Healthy']);

    // Explode while creating a pass for the broken group's recipient only.
    $brokenRecipientId = $broken->recipients()->value('id');
    AccessCode::creating(function (AccessCode $code) use ($brokenRecipientId) {
        if ($code->bulk_invite_recipient_id === $brokenRecipientId) {
            throw new RuntimeException('boom');
        }
    });

    (new RenewBulkVisitorInvitesJob)->handle();

    expect($broken->fresh()->last_renewed_at)->toBeNull()
        ->and($healthy->fresh()->last_renewed_at)->not->toBeNull();
});
