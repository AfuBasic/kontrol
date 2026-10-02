<?php

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->estate->settings()->update(['visitor_checkout_enabled' => true]);
    $this->org = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'is_active' => true]);

    $this->admin = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->admin->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $guard = User::factory()->create();
    $resident = User::factory()->create();

    $code = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'code' => 'ORG12345',
        'type' => 'single_use',
        'visitor_name' => 'Coded Caller',
        'status' => AccessCodeStatus::Active,
        'expires_at' => now()->addHours(2),
    ]);

    $base = ['estate_id' => $this->estate->id, 'organization_id' => $this->org->id, 'verified_by' => $guard->id, 'verified_at' => now()];

    AccessLog::create($base + ['access_code_id' => $code->id, 'meta' => ['visitor_name' => 'Coded Caller']]);
    AccessLog::create($base + ['meta' => ['entry_type' => 'quick_entry', 'visitor_name' => 'Walk Waldo', 'tag' => 'K7']]);
});

test('on-site lists both kinds and labels each entry', function () {
    $this->actingAs($this->admin)->get(route('org.on-site.index'))
        ->assertInertia(fn ($page) => $page
            ->has('onSiteVisitors', 2)
            ->where('onSiteVisitors', fn ($rows) => collect($rows)->pluck('entry_type')->sort()->values()->all() === ['access_code', 'walk_in']));
});

test('on-site can be narrowed to walk-ins or access codes', function () {
    $this->actingAs($this->admin)->get(route('org.on-site.index', ['entry_type' => 'walk_in']))
        ->assertInertia(fn ($page) => $page->has('onSiteVisitors', 1)->where('onSiteVisitors.0.tag', 'K7'));

    $this->actingAs($this->admin)->get(route('org.on-site.index', ['entry_type' => 'access_code']))
        ->assertInertia(fn ($page) => $page->has('onSiteVisitors', 1)->where('onSiteVisitors.0.entry_type', 'access_code'));
});

test('history honours the entry type filter and ignores unknown values', function () {
    $this->actingAs($this->admin)->get(route('org.on-site.history', ['entry_type' => 'walk_in']))
        ->assertInertia(fn ($page) => $page->has('logs.data', 1)->where('filters.entry_type', 'walk_in'));

    $this->actingAs($this->admin)->get(route('org.on-site.history', ['entry_type' => 'bogus']))
        ->assertInertia(fn ($page) => $page->has('logs.data', 2)->missing('filters.entry_type'));
});

test('the on-site tab flag is shared on every organization page when checkout is on', function () {
    $this->actingAs($this->admin)->get(route('org.on-site.history'))
        ->assertInertia(fn ($page) => $page->where('org_on_site_enabled', true));

    $this->estate->settings()->update(['visitor_checkout_enabled' => false]);

    $this->actingAs($this->admin)->get(route('org.on-site.history'))
        ->assertInertia(fn ($page) => $page->where('org_on_site_enabled', false));
});
