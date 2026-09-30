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
    $this->plan = Plan::factory()->create(['estate_id' => $this->estate->id]);
    $this->subscription = EstateSubscription::factory()->create([
        'estate_id' => $this->estate->id,
        'plan_id' => $this->plan->id,
        'status' => 'active',
    ]);

    $this->orgAdmin = User::factory()->create();
    $this->orgAdmin->assignRole('organization_superadmin');

    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'is_active' => true,
    ]);

    OrganizationMembership::factory()->create([
        'organization_id' => $this->org->id,
        'user_id' => $this->orgAdmin->id,
        'role' => 'superadmin',
        'status' => 'active',
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

    Queue::assertPushed(DeliverBulkVisitorPassJob::class, 2);

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
