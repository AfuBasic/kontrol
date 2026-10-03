<?php

use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\EstateSettings;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Policy: once a resident's subscription lapses, only the dashboard, dues (collections),
 * coupons, notifications, SOS and profile settings remain available. Everything else is locked.
 */
beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->estate = Estate::factory()->create();
    EstateSettings::updateOrCreate(
        ['estate_id' => $this->estate->id],
        ['charge_type' => 'residents', 'grace_period_days' => 2],
    );

    $this->plan = Plan::first();
    foreach (['access-code-generation', 'interactive-notice-board', 'household-management', 'payment-collection', 'estate-contacts', 'real-time-visit-feed'] as $slug) {
        $this->plan->features()->syncWithoutDetaching([
            Feature::where('slug', $slug)->first()->id => ['is_enabled' => true],
        ]);
    }

    $this->resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $this->resident->assignRole('resident');
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->subscription = ResidentSubscription::create([
        'user_id' => $this->resident->id,
        'estate_id' => $this->estate->id,
        'plan_id' => $this->plan->id,
        'status' => 'past_due',
        'current_period_end' => now()->subDays(10), // well beyond the grace period
    ]);

    $this->act = fn () => $this->actingAs($this->resident)
        ->withSession(['estate_id' => $this->estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true']);
});

it('keeps the dashboard, dues, coupons and profile available when the subscription has lapsed', function (string $routeName) {
    ($this->act)()->get(route($routeName))->assertOk();
})->with([
    'dashboard' => 'resident.home',
    'dues' => 'resident.collections.index',
    'coupons' => 'resident.coupons.index',
    'profile' => 'resident.profile',
]);

it('locks every other resident page when the subscription has lapsed', function (string $routeName) {
    ($this->act)()->get(route($routeName))
        ->assertRedirect(route('resident.home'))
        ->assertSessionHas('error');
})->with([
    'visitors' => 'resident.visitors.index',
    'new pass form' => 'resident.visitors.create',
    'visitor calendar' => 'resident.visitors.calendar',
    'estate board' => 'resident.estate-board.index',
    'incidents' => 'resident.incidents.index',
    'new incident form' => 'resident.incidents.create',
    'household' => 'resident.household.index',
    'contacts' => 'resident.contacts.index',
    'activity feed' => 'resident.activity',
    'compliance' => 'resident.compliance.index',
]);

it('locks reading a single estate notice when the subscription has lapsed', function () {
    $post = EstateBoardPost::factory()->published()->create([
        'estate_id' => $this->estate->id,
        'category' => 'general',
        'priority' => 'normal',
        'audience' => 'all',
    ]);

    ($this->act)()->get(route('resident.estate-board.show', ['post' => $post->hashid]))
        ->assertRedirect(route('resident.home'))
        ->assertSessionHas('error');
});

it('blocks creating or changing things when the subscription has lapsed', function () {
    ($this->act)()->post(route('resident.household.store'), ['name' => 'Jane', 'email' => 'jane@example.com'])
        ->assertSessionHas('error');

    ($this->act)()->post(route('resident.incidents.store'), [
        'title' => 'Water pipe burst',
        'body' => 'A water pipe has burst near block C and is flooding the road outside.',
        'category' => 'water_plumbing',
    ])->assertSessionHas('error');

    ($this->act)()->post(route('resident.visitors.store'), [
        'type' => 'single_use',
        'visitor_name' => 'John Doe',
        'visitor_phone' => '1234567890',
        'purpose' => 'Guest',
        'has_vehicle' => false,
        'duration_minutes' => 60,
    ])->assertSessionHas('error');

    $this->assertDatabaseCount('incidents', 0);
    $this->assertDatabaseCount('access_codes', 0);
});

it('answers JSON requests to locked routes with 403', function () {
    ($this->act)()->getJson(route('resident.contacts.json'))->assertForbidden();
});

it('restores access as soon as the subscription is active again', function () {
    $this->subscription->update(['status' => 'active', 'current_period_end' => now()->addMonth()]);

    ($this->act)()->get(route('resident.estate-board.index'))->assertOk();
    ($this->act)()->get(route('resident.visitors.index'))->assertOk();
    ($this->act)()->get(route('resident.household.index'))->assertOk();
});

it('flags the lapsed state to the front end so menus can show as locked', function () {
    ($this->act)()->get(route('resident.home'))
        ->assertInertia(fn ($page) => $page->where('auth.user.resident_subscription.access_restricted', true));

    $this->subscription->update(['status' => 'active', 'current_period_end' => now()->addMonth()]);

    ($this->act)()->get(route('resident.home'))
        ->assertInertia(fn ($page) => $page->where('auth.user.resident_subscription.access_restricted', false));
});

it('does not restrict residents when the estate pays instead of residents', function () {
    EstateSettings::where('estate_id', $this->estate->id)->update(['charge_type' => 'estate']);

    ($this->act)()->get(route('resident.estate-board.index'))->assertOk();
});
