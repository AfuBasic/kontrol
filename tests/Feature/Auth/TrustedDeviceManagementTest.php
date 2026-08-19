<?php

use App\Enums\AssignmentScope;
use App\Enums\SecurityEventType;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\SecurityEvent;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Notifications\Security\TrustedDeviceRevokedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

function accountUser(): User
{
    $estate = Estate::factory()->create();
    $user = User::factory()->create(['email_verified_at' => now()]);
    $estate->users()->attach($user->id, ['status' => 'accepted']);
    $role = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => $role->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
    setPermissionsTeamId($estate->id);
    $user->assignRole($role);

    return $user->fresh();
}

test('trusted devices list only shows the current user devices', function () {
    $user = accountUser();
    $other = accountUser();
    $mine = TrustedDevice::factory()->create(['user_id' => $user->id, 'display_name' => 'Mine']);
    TrustedDevice::factory()->create(['user_id' => $other->id, 'display_name' => 'Other']);

    $this->actingAs($user)
        ->get(route('account.devices.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Account/TrustedDevices')
            ->has('devices', 1)
            ->where('devices.0.display_name', 'Mine')
            ->where('devices.0.id', $mine->ulid));
});

test('user cannot revoke another users device', function () {
    $user = accountUser();
    $other = accountUser();
    $device = TrustedDevice::factory()->create(['user_id' => $other->id]);

    $this->actingAs($user)
        ->delete(route('account.devices.destroy', $device))
        ->assertForbidden();

    expect($device->fresh()->revoked_at)->toBeNull();
});

test('device revocation logs a security event and notifies the owner', function () {
    Notification::fake();
    $user = accountUser();
    $device = TrustedDevice::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete(route('account.devices.destroy', $device))
        ->assertRedirect();

    expect($device->fresh()->revoked_at)->not->toBeNull();
    expect(SecurityEvent::query()->where('user_id', $user->id)->where('type', SecurityEventType::TrustedDeviceRevoked)->count())->toBe(1);
    Notification::assertSentTo($user, TrustedDeviceRevokedNotification::class);
});

test('revoking the current device ends the session', function () {
    $user = accountUser();
    $plain = Str::random(64);
    $device = TrustedDevice::factory()->create([
        'user_id' => $user->id,
        'token_hash' => hash('sha256', $plain),
    ]);

    $this->actingAs($user)
        ->withCookie(config('device-trust.cookie'), $plain)
        ->delete(route('account.devices.destroy', $device));

    $this->assertGuest();
    expect($device->fresh()->revoked_at)->not->toBeNull();
});

test('revocation is idempotent', function () {
    Notification::fake();
    $user = accountUser();
    $device = TrustedDevice::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)->delete(route('account.devices.destroy', $device));
    $this->actingAs($user)->delete(route('account.devices.destroy', $device))->assertForbidden();

    expect(SecurityEvent::query()->where('type', SecurityEventType::TrustedDeviceRevoked)->count())->toBe(1);
});
