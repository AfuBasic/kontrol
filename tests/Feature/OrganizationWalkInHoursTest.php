<?php

use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationPublicWindow;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->travelTo(now()->startOfWeek()->setTime(9, 0)); // Monday 9:00
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'OSBA',
        'type' => 'school',
        'is_active' => true,
        'quick_entry_enabled' => true,
        'access_policy' => 'public_window',
    ]);

    $this->admin = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->admin->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $this->staff = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->staff->id, 'organization_id' => $this->org->id, 'role' => 'member', 'is_active' => true]);
});

test('admin can set the same walk-in hours for several days at once', function () {
    $this->actingAs($this->admin)
        ->post(route('org.public-windows.store'), [
            'name' => 'School run',
            'days' => [1, 2, 3, 4, 5],
            'start_time' => '07:30',
            'end_time' => '08:30',
        ])
        ->assertSessionHasNoErrors();

    $windows = $this->org->publicWindows()->orderBy('day_of_week')->get();

    expect($windows)->toHaveCount(5)
        ->and($windows->pluck('day_of_week')->map(fn ($d) => (int) $d)->all())->toBe([1, 2, 3, 4, 5])
        ->and($windows->every(fn ($w) => $w->is_active && $w->name === 'School run'))->toBeTrue();
});

test('hours without a label get a default name', function () {
    $this->actingAs($this->admin)
        ->post(route('org.public-windows.store'), ['days' => [6], 'start_time' => '09:00', 'end_time' => '11:00'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($this->org->publicWindows()->first()->name)->toBe('Walk-in hours');
});

test('closing time must be after opening time and at least one day is needed', function () {
    $this->actingAs($this->admin)
        ->post(route('org.public-windows.store'), ['days' => [], 'start_time' => '10:00', 'end_time' => '09:00'])
        ->assertSessionHasErrors(['days', 'end_time']);

    expect($this->org->publicWindows()->count())->toBe(0);
});

test('admin can edit and remove walk-in hours', function () {
    $window = OrganizationPublicWindow::create([
        'organization_id' => $this->org->id, 'name' => 'Walk-in hours', 'day_of_week' => 1,
        'start_time' => '08:00', 'end_time' => '10:00', 'is_active' => true,
    ]);

    $this->actingAs($this->admin)
        ->patch(route('org.public-windows.update', $window), ['day_of_week' => 2, 'start_time' => '13:00', 'end_time' => '15:00', 'is_active' => true])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($window->fresh()->day_of_week)->toBe(2)
        ->and(substr($window->fresh()->start_time, 0, 5))->toBe('13:00');

    $this->actingAs($this->admin)->delete(route('org.public-windows.destroy', $window))->assertRedirect();

    expect(OrganizationPublicWindow::find($window->id))->toBeNull();
});

test('staff cannot change walk-in hours', function () {
    $this->actingAs($this->staff)
        ->post(route('org.public-windows.store'), ['days' => [1], 'start_time' => '08:00', 'end_time' => '10:00'])
        ->assertForbidden();
});

test('another organization cannot edit these hours', function () {
    $window = OrganizationPublicWindow::create([
        'organization_id' => $this->org->id, 'name' => 'Walk-in hours', 'day_of_week' => 1,
        'start_time' => '08:00', 'end_time' => '10:00', 'is_active' => true,
    ]);

    $otherOrg = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'is_active' => true]);
    $outsider = User::factory()->create();
    OrganizationMembership::create(['user_id' => $outsider->id, 'organization_id' => $otherOrg->id, 'role' => 'admin', 'is_active' => true]);

    $this->actingAs($outsider)
        ->delete(route('org.public-windows.destroy', $window))
        ->assertForbidden();
});

test('profile shows walk-in status and the weekly hours', function () {
    OrganizationPublicWindow::create([
        'organization_id' => $this->org->id, 'name' => 'Morning', 'day_of_week' => 1,
        'start_time' => '08:00', 'end_time' => '10:00', 'is_active' => true,
    ]);

    $org = $this->actingAs($this->admin)->get(route('org.settings.index'))->assertOk()->inertiaPage()['props']['organization'];

    expect($org['walk_in'])->toBe(['open' => true, 'label' => 'Open until 10:00 AM'])
        ->and($org['walk_in_windows'])->toHaveCount(1)
        ->and($org['walk_in_windows'][0]['start_time'])->toBe('08:00')
        ->and($org)->not->toHaveKey('arrival_confirmation_required');
});

test('walk-in status says when a closed organization opens next', function () {
    OrganizationPublicWindow::create([
        'organization_id' => $this->org->id, 'name' => 'Afternoon', 'day_of_week' => 1,
        'start_time' => '14:00', 'end_time' => '16:00', 'is_active' => true,
    ]);

    expect($this->org->fresh()->walkInStatus())->toBe(['open' => false, 'label' => 'Closed · opens today 2:00 PM']);
});

test('an organization that relies on walk-in hours but has none is flagged on home', function () {
    $props = $this->actingAs($this->admin)->get(route('org.dashboard'))->assertOk()->inertiaPage()['props']['organization'];

    expect($props['needs_walk_in_hours'])->toBeTrue()
        ->and($props['walk_in'])->toBe(['open' => false, 'label' => 'No walk-in hours set']);
});

test('the flag clears once hours are added and never applies to other policies', function () {
    OrganizationPublicWindow::create([
        'organization_id' => $this->org->id, 'name' => 'Walk-in hours', 'day_of_week' => 3,
        'start_time' => '08:00', 'end_time' => '10:00', 'is_active' => true,
    ]);
    expect($this->org->fresh()->needsWalkInHours())->toBeFalse();

    $this->org->update(['access_policy' => 'unrestricted']);
    $this->org->publicWindows()->delete();
    expect($this->org->fresh()->needsWalkInHours())->toBeFalse();

    $this->org->update(['access_policy' => 'managed']);
    expect($this->org->fresh()->needsWalkInHours())->toBeFalse();
});

test('paused hours do not count as set', function () {
    OrganizationPublicWindow::create([
        'organization_id' => $this->org->id, 'name' => 'Walk-in hours', 'day_of_week' => 3,
        'start_time' => '08:00', 'end_time' => '10:00', 'is_active' => false,
    ]);

    expect($this->org->fresh()->needsWalkInHours())->toBeTrue();
});
