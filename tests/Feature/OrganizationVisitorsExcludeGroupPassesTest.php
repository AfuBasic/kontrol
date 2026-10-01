<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSubscription;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;

test('organization visitors list excludes passes created by groups', function () {
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $estate = Estate::factory()->create();
    $org = EstateOrganization::factory()->create(['estate_id' => $estate->id, 'type' => 'business', 'is_active' => true]);
    $admin = User::factory()->create();
    OrganizationMembership::create(['user_id' => $admin->id, 'organization_id' => $org->id, 'role' => 'admin', 'is_active' => true]);

    $plan = Plan::create([
        'name' => 'Estate Pro',
        'slug' => 'estate-pro',
        'price_per_month' => 50000,
        'price_per_year' => 500000,
        'features' => ['access-code-generation'],
        'is_active' => true,
    ]);
    EstateSubscription::create(['estate_id' => $estate->id, 'plan_id' => $plan->id, 'status' => 'active', 'billing_interval' => 'monthly']);

    app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $org,
        user: $admin,
        emails: ['group@example.com'],
        name: 'Staff',
    );

    $visitorPass = AccessCode::create([
        'estate_id' => $estate->id,
        'organization_id' => $org->id,
        'user_id' => $admin->id,
        'code' => AccessCode::generateCode(),
        'type' => 'single_use',
        'visitor_name' => 'Walk-in Guest',
        'status' => 'active',
        'starts_at' => now(),
        'expires_at' => now()->addDay(),
    ]);

    $visitors = $this->actingAs($admin)
        ->get(route('org.visitors.index'))
        ->assertOk()
        ->inertiaPage()['props']['visitors'];

    expect(collect($visitors['data'])->pluck('id')->all())->toBe([$visitorPass->id])
        ->and($visitors['total'])->toBe(1);
});
