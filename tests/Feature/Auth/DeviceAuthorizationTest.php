<?php

use App\Enums\AssignmentScope;
use App\Enums\DeviceAuthorizationStatus;
use App\Enums\SecurityEventType;
use App\Mail\Auth\LoginOtpMail;
use App\Models\AdministrativeAssignment;
use App\Models\DeviceAuthorizationRequest;
use App\Models\Estate;
use App\Models\SecurityEvent;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Notifications\Security\DeviceAuthorizedNotification;
use App\Notifications\Security\NewDeviceSignInNotification;
use App\Notifications\Security\SignInBlockedNotification;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

function loginReadyUser(string $roleName = 'resident'): User
{
    $estate = Estate::factory()->create();
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $estate->users()->attach($user->id, ['status' => 'accepted']);

    $role = Role::create([
        'name' => $roleName,
        'guard_name' => 'web',
        'estate_id' => $estate->id,
    ]);

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

function completeOtp(User $user): string
{
    Mail::fake();

    test()->post('/login', ['email' => $user->email])->assertRedirect(route('login.otp.show'));

    $code = '';
    Mail::assertQueued(LoginOtpMail::class, function (LoginOtpMail $mail) use (&$code, $user): bool {
        $code = $mail->code;

        return $mail->user->is($user);
    });

    return $code;
}

test('first trusted device authenticates without a challenge', function () {
    $user = loginReadyUser();
    $code = completeOtp($user);

    $response = $this->post('/login/verify', ['code' => $code]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect();
    expect(TrustedDevice::query()->where('user_id', $user->id)->active()->count())->toBe(1);
});

test('known trusted device authenticates normally', function () {
    $user = loginReadyUser();
    $plain = Str::random(64);
    TrustedDevice::factory()->create([
        'user_id' => $user->id,
        'token_hash' => hash('sha256', $plain),
    ]);

    $code = completeOtp($user);

    $this->withCookie(config('device-trust.cookie'), $plain)
        ->post('/login/verify', ['code' => $code]);

    $this->assertAuthenticatedAs($user);
    expect(DeviceAuthorizationRequest::query()->count())->toBe(0);
});

test('unknown device triggers a challenge and does not authenticate', function () {
    Notification::fake();
    $user = loginReadyUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);

    $code = completeOtp($user);

    $response = $this->post('/login/verify', ['code' => $code]);

    $this->assertGuest();
    $response->assertRedirect(route('login.device.show'));
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->pending()->first();
    expect($authorization)->not->toBeNull();
    expect(queuedPendingAuthToken())->toBe($authorization->ulid);
    expect(SecurityEvent::query()->where('user_id', $user->id)->where('type', SecurityEventType::NewDeviceAttempt)->count())->toBe(1);
    Notification::assertSentTo($user, NewDeviceSignInNotification::class);
});

test('approval authorizes the pending device and not the email-opening client', function () {
    Notification::fake();
    $user = loginReadyUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtp($user);

    $pending = $this->post('/login/verify', ['code' => $code]);
    $pending->assertRedirect(route('login.device.show'));

    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();
    $plain = queuedDeviceTrustToken();

    $approveUrl = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    session()->forget('device_authorization_id');

    $otherBrowser = $this->get($approveUrl);
    $otherBrowser->assertOk();
    $otherBrowser->assertInertia(fn ($page) => $page->component('Auth/DeviceApproved'));
    $this->assertGuest();

    $authorization->refresh();
    expect($authorization->status)->toBe(DeviceAuthorizationStatus::Approved);

    $this->withCookie(config('device-trust.cookie'), $plain)
        ->withSession(['device_authorization_id' => $authorization->id])
        ->post(route('login.device.continue'));

    $this->assertAuthenticatedAs($user);
    expect(TrustedDevice::query()->where('user_id', $user->id)->active()->count())->toBe(2);
    Notification::assertSentTo($user, DeviceAuthorizedNotification::class);
});

test('approval link is single-use', function () {
    Notification::fake();
    $user = loginReadyUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtp($user);
    $this->post('/login/verify', ['code' => $code]);

    $authorization = DeviceAuthorizationRequest::query()->first();
    $url = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    session()->forget('device_authorization_id');
    $this->get($url)->assertOk();
    $this->get($url)->assertInertia(fn ($page) => $page
        ->component('Auth/DeviceLinkInvalid')
        ->where('reason', 'completed'));
});

test('expired approval link cannot authorize a device', function () {
    Notification::fake();
    $user = loginReadyUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtp($user);
    $this->post('/login/verify', ['code' => $code]);

    $authorization = DeviceAuthorizationRequest::query()->first();
    $authorization->forceFill(['expires_at' => now()->subMinute()])->save();

    $url = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    $this->get($url)->assertInertia(fn ($page) => $page
        ->component('Auth/DeviceLinkInvalid')
        ->where('reason', 'expired'));

    expect($authorization->fresh()->status)->not->toBe(DeviceAuthorizationStatus::Approved);
});

test('denial prevents authorization and cannot later be approved', function () {
    Notification::fake();
    $user = loginReadyUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtp($user);
    $this->post('/login/verify', ['code' => $code]);

    $authorization = DeviceAuthorizationRequest::query()->first();

    $denyUrl = URL::temporarySignedRoute(
        'device-authorization.deny',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );
    $approveUrl = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    $this->get($denyUrl)->assertInertia(fn ($page) => $page->component('Auth/DeviceDenied'));
    Notification::assertSentTo($user, SignInBlockedNotification::class);

    $this->get($approveUrl)->assertInertia(fn ($page) => $page->component('Auth/DeviceDenied'));

    $this->withSession(['device_authorization_id' => $authorization->id])
        ->post(route('login.device.continue'));

    $this->assertGuest();
    expect(TrustedDevice::query()->where('user_id', $user->id)->active()->count())->toBe(1);
    expect($authorization->fresh()->status)->toBe(DeviceAuthorizationStatus::Denied);
    expect(SecurityEvent::query()->where('type', SecurityEventType::DeviceDenied)->count())->toBe(1);
});

test('device token is stored hashed', function () {
    $user = loginReadyUser();
    $code = completeOtp($user);
    $this->post('/login/verify', ['code' => $code]);

    $device = TrustedDevice::query()->where('user_id', $user->id)->first();
    expect($device->token_hash)->toHaveLength(64);
    expect($device->getRawOriginal('token_hash'))->not->toBeNull();
    expect($device->toArray())->not->toHaveKey('token_hash');
});

test('revoked device cannot authenticate as trusted', function () {
    Notification::fake();
    $user = loginReadyUser();
    $plain = Str::random(64);
    $device = TrustedDevice::factory()->create([
        'user_id' => $user->id,
        'token_hash' => hash('sha256', $plain),
        'revoked_at' => now(),
    ]);
    TrustedDevice::factory()->create(['user_id' => $user->id]);

    $code = completeOtp($user);

    $response = $this->withCookie(config('device-trust.cookie'), $plain)
        ->post('/login/verify', ['code' => $code]);

    $this->assertGuest();
    $response->assertRedirect(route('login.device.show'));
    expect(SecurityEvent::query()->where('type', SecurityEventType::RevokedDeviceAttempt)->count())->toBe(1);
    expect($device->fresh()->revoked_at)->not->toBeNull();
});

test('logout does not revoke the trusted device', function () {
    $user = loginReadyUser();
    $device = TrustedDevice::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)->post('/logout');

    expect($device->fresh()->revoked_at)->toBeNull();
    expect($device->fresh()->isActive())->toBeTrue();
});

function queuedDeviceTrustToken(): string
{
    $queued = Cookie::getQueuedCookies();
    $name = config('device-trust.cookie');

    foreach ($queued as $cookie) {
        if ($cookie->getName() === $name) {
            return $cookie->getValue();
        }
    }

    return '';
}

function queuedPendingAuthToken(): string
{
    $queued = Cookie::getQueuedCookies();
    $name = config('device-trust.pending_cookie');

    foreach ($queued as $cookie) {
        if ($cookie->getName() === $name) {
            return $cookie->getValue();
        }
    }

    return '';
}
