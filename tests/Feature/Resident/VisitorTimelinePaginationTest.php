<?php

use App\Models\AccessCode;
use App\Models\Estate;
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

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->estate = Estate::factory()->create();
    EstateSettings::updateOrCreate(['estate_id' => $this->estate->id], ['charge_type' => 'residents']);

    $plan = Plan::first();
    $plan->features()->syncWithoutDetaching([
        Feature::where('slug', 'access-code-generation')->first()->id => ['is_enabled' => true],
    ]);

    $this->resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $this->resident->assignRole('resident');
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);

    ResidentSubscription::create([
        'user_id' => $this->resident->id,
        'estate_id' => $this->estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_end' => now()->addMonth(),
    ]);

    $this->visit = fn (array $query = [], array $partial = []) => $this->actingAs($this->resident)
        ->withSession(['estate_id' => $this->estate->id])
        ->withHeaders(array_merge(['X-Bypass-Mobile-Restrict' => 'true'], $partial))
        ->get(route('resident.visitors.index', $query));

    $this->makeCodes = function (int $count, array $overrides = []) {
        for ($i = 0; $i < $count; $i++) {
            AccessCode::factory()->create(array_merge([
                'estate_id' => $this->estate->id,
                'user_id' => $this->resident->id,
            ], $overrides));
        }
    };
});

it('loads the upcoming schedule one page at a time', function () {
    ($this->makeCodes)(45, ['status' => 'active', 'type' => 'single_use', 'expires_at' => now()->addDays(3)]);

    ($this->visit)()->assertOk()->assertInertia(fn ($page) => $page
        ->component('Resident/Visitors/Index')
        ->has('upcomingTimeline.data', 20)
        ->where('upcomingSummary.total', 45)
    );
});

it('serves the next upcoming page without repeating earlier passes', function () {
    ($this->makeCodes)(45, ['status' => 'active', 'type' => 'single_use', 'expires_at' => now()->addDays(3)]);

    $first = collect(($this->visit)()->viewData('page')['props']['upcomingTimeline']['data'] ?? [])->pluck('id');
    $second = collect(($this->visit)(['upcoming_page' => 2])->viewData('page')['props']['upcomingTimeline']['data'] ?? [])->pluck('id');

    expect($first)->toHaveCount(20)
        ->and($second)->toHaveCount(20)
        ->and($first->intersect($second))->toBeEmpty();
});

it('loads the history archive one page at a time and searches the whole archive on the server', function () {
    ($this->makeCodes)(30, ['status' => 'expired', 'expires_at' => now()->subDays(5), 'visitor_name' => 'Regular Guest']);
    ($this->makeCodes)(1, ['status' => 'expired', 'expires_at' => now()->subDays(400), 'visitor_name' => 'Zebediah Needle']);

    ($this->visit)()->assertInertia(fn ($page) => $page->has('historyTimeline.data', 20));

    // The oldest visit is far beyond page one but must still be found by searching.
    ($this->visit)(['search_history' => 'Zebediah'])->assertInertia(fn ($page) => $page
        ->has('historyTimeline.data', 1)
        ->where('historyTimeline.data.0.visitor_name', 'Zebediah Needle')
    );
});

it('summarises today without loading every pass', function () {
    ($this->makeCodes)(3, ['status' => 'active', 'type' => 'single_use', 'expires_at' => now()->addHours(5)]);
    ($this->makeCodes)(2, ['status' => 'active', 'type' => 'single_use', 'expires_at' => now()->addDays(4)]);

    ($this->visit)()->assertInertia(fn ($page) => $page
        ->where('upcomingSummary.total', 5)
        ->where('upcomingSummary.today', 3)
    );
});
