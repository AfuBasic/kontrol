<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
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

    $plan = Plan::create(['name' => 'Estate Pro', 'slug' => 'estate-pro', 'price_per_month' => 50000, 'price_per_year' => 500000, 'features' => ['access-code-generation'], 'is_active' => true]);
    EstateSubscription::create(['estate_id' => $this->estate->id, 'plan_id' => $plan->id, 'status' => 'active', 'billing_interval' => 'monthly']);

    $this->group = app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->orgAdmin,
        emails: ['one@example.com'],
        name: 'Staff',
        autoRenew: false,
    );

    $this->technical = 'Undefined variable $colors (View: /Library/WebServer/Documents/projects/kontrol/resources/views/mail/visitor/bulk-pass.blade.php)';
    $this->group->recipients()->update(['delivery_status' => 'failed', 'delivery_error' => $this->technical]);
});

test('the live delivery status shows the group creator a friendly reason, not the technical error', function () {
    $response = $this->actingAs($this->orgAdmin)->getJson(route('org.bulk-invites.delivery-status', $this->group))->assertOk();

    $error = $response->json('recipients.0.delivery_error');

    expect($error)->toContain('on our side')
        ->and($error)->not->toContain('Undefined variable')
        ->and($error)->not->toContain('.php');
});

test('the group page shows the creator a friendly reason, not the technical error', function () {
    $page = $this->actingAs($this->orgAdmin)->get(route('org.bulk-invites.show', $this->group->id))->inertiaPage();

    $error = $page['props']['bulkInvite']['recipients'][0]['delivery_error'] ?? null;

    expect($error)->toContain('on our side')
        ->and(json_encode($page['props']))->not->toContain('Undefined variable');
});

test('the technical error is still stored for support', function () {
    expect($this->group->recipients()->first()->delivery_error)->toBe($this->technical);
});
