<?php

use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $estate = Estate::factory()->create();
    $this->org = EstateOrganization::factory()->create(['estate_id' => $estate->id, 'type' => 'business', 'is_active' => true]);
    $this->admin = User::factory()->create();
    OrganizationMembership::create(['user_id' => $this->admin->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $this->makePass = fn (array $attrs = []) => AccessCode::create(array_merge([
        'estate_id' => $estate->id,
        'organization_id' => $this->org->id,
        'user_id' => $this->admin->id,
        'code' => AccessCode::generateCode(),
        'type' => 'single_use',
        'visitor_name' => 'Olaide',
        'status' => 'active',
        'starts_at' => now()->subDay(),
        'expires_at' => now()->addHour(),
    ], $attrs));
});

test('a pass past its window is shown as expired even though its stored status is still active', function () {
    $live = ($this->makePass)();
    $stale = ($this->makePass)(['expires_at' => now()->subHour(), 'starts_at' => now()->subDay()]);
    $revoked = ($this->makePass)(['status' => 'revoked']);

    $rows = collect($this->actingAs($this->admin)->get(route('org.visitors.index'))->assertOk()->inertiaPage()['props']['visitors']['data'])->keyBy('id');

    expect($rows[$live->id]['display_status'])->toBe('active')
        ->and($rows[$stale->id]['display_status'])->toBe('expired')
        ->and($rows[$revoked->id]['display_status'])->toBe('revoked');
});

test('an expired pass cannot be extended or revoked, and nothing about it changes', function () {
    $stale = ($this->makePass)(['expires_at' => now()->subHour()]);
    $expiry = $stale->expires_at->toDateTimeString();

    $this->actingAs($this->admin)->post(route('org.visitors.extend', $stale), ['duration_minutes' => 60])
        ->assertSessionHasErrors('duration_minutes');
    $this->actingAs($this->admin)->delete(route('org.visitors.destroy', $stale));

    $stale->refresh();
    expect($stale->expires_at->toDateTimeString())->toBe($expiry)
        ->and($stale->status->value)->toBe('active');
});

test('a revoked pass cannot be brought back by extending it', function () {
    $revoked = ($this->makePass)(['status' => 'revoked']);

    $this->actingAs($this->admin)->post(route('org.visitors.extend', $revoked), ['duration_minutes' => 60])
        ->assertSessionHasErrors('duration_minutes');

    expect($revoked->fresh()->status->value)->toBe('revoked');
});

test('a valid pass can still be extended and revoked', function () {
    $pass = ($this->makePass)();
    $before = $pass->expires_at->copy();

    $this->actingAs($this->admin)->post(route('org.visitors.extend', $pass), ['duration_minutes' => 60])->assertSessionHasNoErrors();
    expect($pass->fresh()->expires_at->gt($before))->toBeTrue();

    $this->actingAs($this->admin)->delete(route('org.visitors.destroy', $pass));
    expect($pass->fresh()->status->value)->toBe('revoked');
});
