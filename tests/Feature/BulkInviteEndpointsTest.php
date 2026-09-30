<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

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

test('organization admin can view bulk invites index and show pages', function () {
    $this->actingAs($this->orgAdmin);

    $action = app(CreateBulkVisitorInviteAction::class);
    $bulkInvite = $action->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['user1@example.com', 'user2@example.com'],
        name: 'Conference Guests',
        role: 'Guest / Visitor',
        purpose: 'Annual Meeting',
    );

    $indexRes = $this->get(route('org.bulk-invites.index'));
    $indexRes->assertOk();

    $showRes = $this->get(route('org.bulk-invites.show', $bulkInvite));
    $showRes->assertOk();
});

test('bulk invites index provides server-computed validity, renewal, and delivery payload without eager-loading recipients', function () {
    $this->actingAs($this->orgAdmin);

    // 1. Upcoming
    OrganizationBulkInvite::create([
        'organization_id' => $this->org->id,
        'estate_id' => $this->estate->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'Upcoming Group',
        'valid_from' => now()->addDays(5)->toDateString(),
        'valid_until' => now()->addDays(15)->toDateString(),
        'status' => 'active',
    ]);

    // 2. Expiring soon (≤ 3 days) without auto-renew
    OrganizationBulkInvite::create([
        'organization_id' => $this->org->id,
        'estate_id' => $this->estate->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'Expiring Group',
        'valid_from' => now()->subDays(5)->toDateString(),
        'valid_until' => now()->addDays(2)->toDateString(),
        'status' => 'active',
        'auto_renew' => false,
    ]);

    // 3. Expired by date while status still active
    OrganizationBulkInvite::create([
        'organization_id' => $this->org->id,
        'estate_id' => $this->estate->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'Past Due Group',
        'valid_from' => now()->subDays(10)->toDateString(),
        'valid_until' => now()->subDay()->toDateString(),
        'status' => 'active',
    ]);

    // 4. Cancelled status
    OrganizationBulkInvite::create([
        'organization_id' => $this->org->id,
        'estate_id' => $this->estate->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'Cancelled Group',
        'valid_from' => now()->toDateString(),
        'valid_until' => now()->addDays(10)->toDateString(),
        'status' => 'cancelled',
    ]);

    // 5. Auto-renew enabled with blocked reason
    OrganizationBulkInvite::create([
        'organization_id' => $this->org->id,
        'estate_id' => $this->estate->id,
        'created_by' => $this->orgAdmin->id,
        'name' => 'Blocked Renewal Group',
        'valid_from' => now()->subDays(2)->toDateString(),
        'valid_until' => now()->addDays(12)->toDateString(),
        'status' => 'active',
        'auto_renew' => true,
        'renewal_blocked_reason' => 'subscription_required',
    ]);

    $response = $this->get(route('org.bulk-invites.index'));
    $response->assertOk();

    $invites = $response->inertiaPage()['props']['bulkInvites']['data'];

    // Ensure recipients collection is NOT eager-loaded on items
    foreach ($invites as $item) {
        expect(array_key_exists('recipients', $item))->toBeFalse();
        expect($item)->toHaveKeys(['validity', 'renewal', 'delivery']);
    }

    $byName = collect($invites)->keyBy('name');

    expect($byName['Upcoming Group']['validity']['state'])->toBe('upcoming')
        ->and($byName['Expiring Group']['validity']['state'])->toBe('expiring')
        ->and($byName['Past Due Group']['validity']['state'])->toBe('expired')
        ->and($byName['Cancelled Group']['validity']['state'])->toBe('cancelled')
        ->and($byName['Blocked Renewal Group']['renewal']['blocked_reason_label'])->toBe('subscription required');
});

test('delivery-status endpoint returns summary and recipient details', function () {
    $this->actingAs($this->orgAdmin);

    $action = app(CreateBulkVisitorInviteAction::class);
    $bulkInvite = $action->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['client1@example.com', 'client2@example.com'],
        role: 'Contractor',
    );

    $response = $this->getJson(route('org.bulk-invites.delivery-status', $bulkInvite));

    $response->assertOk()
        ->assertJsonStructure([
            'bulk_invite_id',
            'summary' => ['total', 'pending', 'queued', 'sent', 'failed'],
            'recipients',
        ]);

    expect($response->json('summary.total'))->toBe(2);
});

test('retry-failed endpoint redispatches jobs only for failed recipients', function () {
    Queue::fake([DeliverBulkVisitorPassJob::class]);

    $this->actingAs($this->orgAdmin);

    $action = app(CreateBulkVisitorInviteAction::class);
    $bulkInvite = $action->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['success@example.com', 'fail1@example.com', 'fail2@example.com'],
    );

    // Mark two as failed and one as sent
    $recipients = $bulkInvite->recipients;
    $recipients[0]->update(['delivery_status' => 'sent']);
    $recipients[1]->update(['delivery_status' => 'failed', 'delivery_error' => 'SMTP timeout']);
    $recipients[2]->update(['delivery_status' => 'failed', 'delivery_error' => 'Connection refused']);

    $response = $this->postJson(route('org.bulk-invites.retry-failed', $bulkInvite));

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'retried_count' => 2,
        ]);

    Queue::assertPushed(DeliverBulkVisitorPassJob::class, 5);

    expect($recipients[1]->fresh()->delivery_status)->toBe('queued')
        ->and($recipients[2]->fresh()->delivery_status)->toBe('queued')
        ->and($recipients[0]->fresh()->delivery_status)->toBe('sent');
});

test('bulk invite creation stores role and send_immediately accurately', function () {
    $this->actingAs($this->orgAdmin);

    $response = $this->post(route('org.bulk-invites.store'), [
        'name' => 'Event Techs',
        'role' => 'Contractor',
        'purpose' => 'Audio Setup',
        'emails' => ['tech1@example.com', 'tech2@example.com'],
        'send_immediately' => false,
    ]);

    $response->assertRedirect();

    $invite = OrganizationBulkInvite::first();
    expect($invite)->not->toBeNull()
        ->and($invite->role)->toBe('Contractor')
        ->and($invite->purpose)->toBe('Audio Setup')
        ->and($invite->send_immediately)->toBeFalse();

    expect(OrganizationBulkInviteRecipient::where('delivery_status', 'pending')->count())->toBe(2);
});
