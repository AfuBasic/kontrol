<?php

use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\OrganizationMembership;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->travelTo(now()->setTime(10, 0));

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'type' => 'business', 'is_active' => true]);
    $this->admin = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->admin->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $plan = Plan::create([
        'name' => 'Estate Pro',
        'slug' => 'estate-pro',
        'price_per_month' => 50000,
        'price_per_year' => 500000,
        'features' => ['access-code-generation'],
        'is_active' => true,
    ]);
    EstateSubscription::create(['estate_id' => $this->estate->id, 'plan_id' => $plan->id, 'status' => 'active', 'billing_interval' => 'monthly']);

    EstateSettings::forEstate($this->estate->id)->update([
        'access_code_min_lifespan_minutes' => 30,
        'access_code_max_lifespan_minutes' => 1440,
    ]);
});

test('visitors page offers the estate duration options and limits', function () {
    $props = $this->actingAs($this->admin)->get(route('org.visitors.index'))->assertOk()->inertiaPage()['props'];

    expect($props['durationConstraints'])->toBe(['min' => 30, 'max' => 1440])
        ->and($props['durationOptions'])->not->toBeEmpty()
        ->and($props['durationOptions'][0])->toHaveKeys(['minutes', 'label']);
});

test('a pass with no start time starts now and expires after the chosen duration', function () {
    $this->actingAs($this->admin)
        ->post(route('org.visitors.store'), ['visitor_name' => 'Dele', 'duration_minutes' => 60])
        ->assertSessionHasNoErrors();

    $pass = AccessCode::where('visitor_name', 'Dele')->firstOrFail();

    expect($pass->starts_at->equalTo(now()))->toBeTrue()
        ->and($pass->expires_at->equalTo(now()->addHour()))->toBeTrue();
});

test('a scheduled pass starts at the chosen time', function () {
    $startsAt = now()->addDay()->setTime(9, 30);

    $this->actingAs($this->admin)
        ->post(route('org.visitors.store'), [
            'visitor_name' => 'Ngozi',
            'starts_at' => $startsAt->toISOString(),
            'duration_minutes' => 120,
        ])
        ->assertSessionHasNoErrors();

    $pass = AccessCode::where('visitor_name', 'Ngozi')->firstOrFail();

    expect($pass->starts_at->equalTo($startsAt))->toBeTrue()
        ->and($pass->expires_at->equalTo($startsAt->copy()->addHours(2)))->toBeTrue();
});

test('durations outside the estate limits and past start times are rejected', function (array $input, string $field) {
    $this->actingAs($this->admin)
        ->post(route('org.visitors.store'), ['visitor_name' => 'Ade', ...$input])
        ->assertSessionHasErrors($field);

    expect(AccessCode::where('visitor_name', 'Ade')->exists())->toBeFalse();
})->with([
    'too short' => [['duration_minutes' => 15], 'duration_minutes'],
    'too long' => [['duration_minutes' => 2000], 'duration_minutes'],
    'missing duration' => [[], 'duration_minutes'],
    'start in the past' => [['duration_minutes' => 60, 'starts_at' => '2000-01-01T09:00:00Z'], 'starts_at'],
]);
