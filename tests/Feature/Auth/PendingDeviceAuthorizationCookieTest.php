<?php

use App\Enums\AssignmentScope;
use App\Enums\DeviceAuthorizationStatus;
use App\Mail\Auth\LoginOtpMail;
use App\Models\AdministrativeAssignment;
use App\Models\DeviceAuthorizationRequest;
use App\Models\Estate;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Notifications\Security\DeviceAuthorizedNotification;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\Models\Role;

function pendingAuthUser(string $roleName = 'resident'): User
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

function completeOtpForPendingAuth(User $user): string
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

function getQueuedCookie(string $name): string
{
    $queued = Cookie::getQueuedCookies();

    foreach ($queued as $cookie) {
        if ($cookie->getName() === $name) {
            return $cookie->getValue();
        }
    }

    return '';
}

test('unknown device creates both a pending authorization and a pending authorization cookie', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);

    $code = completeOtpForPendingAuth($user);

    $response = $this->post('/login/verify', ['code' => $code]);

    $this->assertGuest();
    $response->assertRedirect(route('login.device.show'));

    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->pending()->first();
    expect($authorization)->not->toBeNull();

    $pendingCookieVal = getQueuedCookie(config('device-trust.pending_cookie'));
    expect($pendingCookieVal)->toBe($authorization->ulid);
});

test('if app session is lost after OTP, visiting /login/device with pending cookie restores verify-device screen', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();
    $deviceTrustToken = getQueuedCookie(config('device-trust.cookie'));

    session()->forget('device_authorization_id');

    $response = $this->withCookie(config('device-trust.pending_cookie'), $authorization->ulid)
        ->withCookie(config('device-trust.cookie'), $deviceTrustToken)
        ->get('/login/device');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Auth/VerifyDevice')
        ->where('status', 'pending')
    );
    expect(session('device_authorization_id'))->toBe($authorization->id);
});

test('if app session is lost after OTP, visiting /login with pending cookie redirects to /login/device', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();

    session()->flush();

    $response = $this->withCookie(config('device-trust.pending_cookie'), $authorization->ulid)
        ->get('/login');

    $response->assertRedirect(route('login.device.show'));
});

test('if authorization was approved while session was gone, returning to /login/device completes login', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();
    $deviceTrustToken = getQueuedCookie(config('device-trust.cookie'));

    $approveUrl = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    // Email client approves (in a different browser context)
    session()->forget('device_authorization_id');
    $this->flushSession();

    $this->get($approveUrl)->assertOk();
    $this->assertGuest();
    expect($authorization->fresh()->status)->toBe(DeviceAuthorizationStatus::Approved);

    // Original device returns with session lost
    session()->forget('device_authorization_id');

    $response = $this->withCookie(config('device-trust.pending_cookie'), $authorization->ulid)
        ->withCookie(config('device-trust.cookie'), $deviceTrustToken)
        ->post(route('login.device.continue'));

    $this->assertAuthenticatedAs($user);
    expect(TrustedDevice::query()->where('user_id', $user->id)->active()->count())->toBe(2);
    Notification::assertSentTo($user, DeviceAuthorizedNotification::class);
});

test('approval from email-opening browser does not authenticate or trust that browser', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();

    $approveUrl = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    // Separate browser opens approve URL without matching session
    session()->forget('device_authorization_id');

    $otherBrowser = $this->get($approveUrl);
    $otherBrowser->assertOk();
    $otherBrowser->assertInertia(fn ($page) => $page
        ->component('Auth/DeviceApproved')
        ->where('canContinue', false)
    );
    $this->assertGuest();
    expect(TrustedDevice::query()->where('user_id', $user->id)->active()->count())->toBe(1);
});

test('denied authorization clears pending cookie and shows denied state', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();

    $denyUrl = URL::temporarySignedRoute(
        'device-authorization.deny',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    $this->get($denyUrl);
    expect($authorization->fresh()->status)->toBe(DeviceAuthorizationStatus::Denied);

    session()->forget('device_authorization_id');

    $response = $this->withCookie(config('device-trust.pending_cookie'), $authorization->ulid)
        ->get('/login/device');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Auth/DeviceDenied'));
    $this->assertGuest();
});

test('expired authorization clears pending cookie and shows expired state', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();
    $authorization->forceFill(['expires_at' => now()->subMinute()])->save();

    session()->forget('device_authorization_id');

    $response = $this->withCookie(config('device-trust.pending_cookie'), $authorization->ulid)
        ->get('/login/device');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Auth/DeviceExpired'));
    $this->assertGuest();
});

test('consumed authorization clears pending cookie and redirects to login', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();
    $authorization->forceFill([
        'status' => DeviceAuthorizationStatus::Consumed,
        'consumed_at' => now(),
    ])->save();

    session()->forget('device_authorization_id');

    $response = $this->withCookie(config('device-trust.pending_cookie'), $authorization->ulid)
        ->get('/login/device');

    $response->assertRedirect(route('login'));
    $this->assertGuest();
});

test('invalid or nonexistent ulid in pending cookie is cleared and redirects to login', function () {
    $response = $this->withCookie(config('device-trust.pending_cookie'), 'nonexistent_ulid_12345')
        ->get('/login/device');

    $response->assertRedirect(route('login'));
    $this->assertGuest();
});

test('abort clears pending authorization cookie and session', function () {
    Notification::fake();
    $user = pendingAuthUser();
    TrustedDevice::factory()->create(['user_id' => $user->id]);
    $code = completeOtpForPendingAuth($user);

    $this->post('/login/verify', ['code' => $code]);
    $authorization = DeviceAuthorizationRequest::query()->where('user_id', $user->id)->first();

    $response = $this->withCookie(config('device-trust.pending_cookie'), $authorization->ulid)
        ->withSession(['device_authorization_id' => $authorization->id])
        ->post(route('login.device.abort'));

    $response->assertRedirect(route('login'));
    expect(session('device_authorization_id'))->toBeNull();
});
