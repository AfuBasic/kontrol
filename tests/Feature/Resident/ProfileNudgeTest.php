<?php

use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Models\UserProfile;
use App\Support\ProfileCompleteness;
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

    $this->plan = Plan::first();
    $this->plan->features()->syncWithoutDetaching([
        Feature::where('slug', 'access-code-generation')->first()->id => ['is_enabled' => true],
    ]);

    $this->resident = User::factory()->create(['name' => 'Ada Tunde']);
    setPermissionsTeamId($this->estate->id);
    $this->resident->assignRole('resident');
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->subscription = ResidentSubscription::create([
        'user_id' => $this->resident->id,
        'estate_id' => $this->estate->id,
        'plan_id' => $this->plan->id,
        'status' => 'active',
        'current_period_end' => now()->addMonth(),
    ]);

    $this->act = fn () => $this->actingAs($this->resident)
        ->withSession(['estate_id' => $this->estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true']);

    $this->nudge = fn () => ProfileCompleteness::nudge($this->resident->fresh());
});

// ---------- What counts as missing ----------

it('asks for an address when neither unit number nor address is set', function () {
    expect(ProfileCompleteness::missing($this->resident))->toBe(['address']);
});

it('is satisfied by a unit number alone or an address alone', function (array $profile) {
    UserProfile::create(['user_id' => $this->resident->id, ...$profile]);

    expect(ProfileCompleteness::missing($this->resident->fresh()))->toBe([]);
})->with([
    'unit number only' => [['unit_number' => 'Block C, Flat 4']],
    'address only' => [['address' => '12 Palm Avenue']],
]);

it('treats an empty name or an email stand-in as not set', function (string $name) {
    $this->resident->update(['name' => $name]);
    UserProfile::create(['user_id' => $this->resident->id, 'unit_number' => 'A1']);

    expect(ProfileCompleteness::missing($this->resident->fresh()))->toBe(['name']);
})->with(['empty' => '', 'spaces' => '   ', 'email as name' => 'ada@example.com']);

it('never asks household members', function () {
    $member = User::factory()->create(['name' => '']);
    setPermissionsTeamId($this->estate->id);
    $member->assignRole('household_member');

    expect(ProfileCompleteness::nudge($member)['show'])->toBeFalse()
        ->and(ProfileCompleteness::nudge($member)['missing'])->toBe([]);
});

// ---------- The dashboard reminder stays gentle ----------

it('shows the dashboard reminder when details are missing', function () {
    ($this->act)()->get(route('resident.home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('profileNudge.show', true)
            ->where('profileNudge.missing', ['address'])
        );
});

it('shows nothing once the details are complete', function () {
    UserProfile::create(['user_id' => $this->resident->id, 'address' => '12 Palm Avenue']);

    ($this->act)()->get(route('resident.home'))
        ->assertInertia(fn ($page) => $page->where('profileNudge.show', false)->where('profileNudge.missing', []));
});

it('hides the reminder for a week after "Not now", then brings it back', function () {
    ($this->act)()->post(route('resident.profile.nudge.dismiss'))->assertRedirect();

    expect(($this->nudge)()['show'])->toBeFalse();

    $this->travel(ProfileCompleteness::SNOOZE_DAYS - 1)->days();
    expect(($this->nudge)()['show'])->toBeFalse();

    $this->travel(2)->days();
    expect(($this->nudge)()['show'])->toBeTrue();
});

it('stops asking on the dashboard after the third dismissal', function () {
    foreach (range(1, ProfileCompleteness::MAX_DISMISSALS) as $round) {
        expect(($this->nudge)()['show'])->toBeTrue();
        ($this->act)()->post(route('resident.profile.nudge.dismiss'));
        $this->travel(ProfileCompleteness::SNOOZE_DAYS + 1)->days();
    }

    // A fortnight and more later it still stays quiet, but the gap itself is still reported for the profile page.
    $this->travel(60)->days();

    expect(($this->nudge)()['show'])->toBeFalse()
        ->and(($this->nudge)()['missing'])->toBe(['address']);
});

it('lets a resident with a lapsed subscription dismiss the reminder', function () {
    $this->subscription->update(['status' => 'past_due', 'current_period_end' => now()->subDays(10)]);

    ($this->act)()->post(route('resident.profile.nudge.dismiss'))
        ->assertRedirect()
        ->assertSessionMissing('error');

    expect(($this->nudge)()['show'])->toBeFalse();
});

// ---------- Fixing it where it is noticed ----------

it('saves the address from the pass form and then stops flagging it', function () {
    ($this->act)()->get(route('resident.visitors.create'))
        ->assertInertia(fn ($page) => $page->where('residentAddressMissing', true));

    ($this->act)()->patch(route('resident.profile.address.update'), ['unit_number' => 'Block C, Flat 4', 'address' => ''])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($this->resident->fresh()->profile->unit_number)->toBe('Block C, Flat 4')
        ->and(ProfileCompleteness::missing($this->resident->fresh()))->toBe([]);

    ($this->act)()->get(route('resident.visitors.create'))
        ->assertInertia(fn ($page) => $page->where('residentAddressMissing', false));
});

it('requires at least a unit number or an address when saving', function () {
    ($this->act)()->patch(route('resident.profile.address.update'), ['unit_number' => '', 'address' => ''])
        ->assertSessionHasErrors(['unit_number', 'address']);

    expect($this->resident->fresh()->profile)->toBeNull();
});

it('reports the completeness on the profile page', function () {
    ($this->act)()->get(route('resident.profile'))
        ->assertInertia(fn ($page) => $page
            ->where('completeness.total', 2)
            ->where('completeness.missing', ['address'])
        );
});
