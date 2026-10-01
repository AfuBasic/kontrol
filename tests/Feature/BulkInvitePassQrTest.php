<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'type' => 'business', 'is_active' => true]);
    $this->orgAdmin = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->orgAdmin->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $plan = Plan::create([
        'name' => 'Estate Pro',
        'slug' => 'estate-pro',
        'price_per_month' => 50000,
        'price_per_year' => 500000,
        'features' => ['access-code-generation'],
        'is_active' => true,
    ]);
    EstateSubscription::create(['estate_id' => $this->estate->id, 'plan_id' => $plan->id, 'status' => 'active', 'billing_interval' => 'monthly']);

    $this->bulkInvite = app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['ada@example.com'],
        name: 'Staff',
    );
    $this->recipient = $this->bulkInvite->recipients()->firstOrFail();
    $this->todayPass = $this->recipient->lastAccessCode;
});

test('after an early renewal the sheet shows the pass that works today, not the future one', function () {
    $this->actingAs($this->orgAdmin);

    $futurePass = AccessCode::create([
        'estate_id' => $this->estate->id,
        'organization_id' => $this->org->id,
        'bulk_invite_recipient_id' => $this->recipient->id,
        'user_id' => $this->orgAdmin->id,
        'code' => AccessCode::generateCode(),
        'type' => 'bulk_visitor',
        'source' => AccessCodeSource::BulkInvite,
        'visitor_name' => 'ada',
        'status' => AccessCodeStatus::Active,
        'starts_at' => now()->addDays(40),
        'expires_at' => now()->addDays(70),
    ]);
    $this->recipient->update(['last_access_code_id' => $futurePass->id]);

    $person = $this->get(route('org.bulk-invites.show', $this->bulkInvite))
        ->inertiaPage()['props']['bulkInvite']['recipients'][0];

    expect($person['code'])->toBe($this->todayPass->code)
        ->and($person['pass_starts_later'])->toBeFalse()
        ->and($person['pass_expires_at'])->toBe($this->todayPass->expires_at->toISOString())
        ->and($person['qr_url'])->toBe(route('org.bulk-invites.recipients.qr', [$this->bulkInvite, $this->recipient]));
});

test('the next pass is shown, marked as starting later, when none is valid yet', function () {
    $this->actingAs($this->orgAdmin);
    $this->todayPass->update(['starts_at' => now()->addDays(3)]);

    $person = $this->get(route('org.bulk-invites.show', $this->bulkInvite))
        ->inertiaPage()['props']['bulkInvite']['recipients'][0];

    expect($person['code'])->toBe($this->todayPass->code)
        ->and($person['pass_starts_later'])->toBeTrue();
});

test('qr endpoint returns a private png for the current pass', function () {
    $response = $this->actingAs($this->orgAdmin)
        ->get(route('org.bulk-invites.recipients.qr', [$this->bulkInvite, $this->recipient]))
        ->assertOk()
        ->assertHeader('Content-Type', 'image/png');

    expect($response->headers->get('Cache-Control'))->toContain('no-store')
        ->and(substr($response->getContent(), 0, 4))->toBe("\x89PNG");
});

test('qr endpoint is not found once the pass is revoked', function () {
    $this->todayPass->revoke();

    $this->actingAs($this->orgAdmin)
        ->get(route('org.bulk-invites.recipients.qr', [$this->bulkInvite, $this->recipient]))
        ->assertNotFound();
});

test('qr endpoint is not reachable from another organization', function () {
    $otherOrg = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'is_active' => true]);
    $outsider = User::factory()->create();
    OrganizationMembership::create(['user_id' => $outsider->id, 'organization_id' => $otherOrg->id, 'role' => 'admin', 'is_active' => true]);

    $this->actingAs($outsider)
        ->get(route('org.bulk-invites.recipients.qr', [$this->bulkInvite, $this->recipient]))
        ->assertNotFound();
});

test('gate QR payload is the scanner format', function () {
    expect($this->todayPass->gateQrPayload())
        ->toBe("kontrol://pass/{$this->todayPass->pass_uuid}?token={$this->todayPass->qr_token}");
});
