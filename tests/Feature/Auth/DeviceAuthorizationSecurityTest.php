<?php

use App\Enums\AssignmentScope;
use App\Mail\Auth\LoginOtpMail;
use App\Models\AdministrativeAssignment;
use App\Models\DeviceAuthorizationRequest;
use App\Models\Estate;
use App\Models\TrustedDevice;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

function securityLoginUser(): User
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

function startUnknownDeviceChallenge(User $user): DeviceAuthorizationRequest
{
    Notification::fake();
    Mail::fake();
    TrustedDevice::factory()->create(['user_id' => $user->id]);

    test()->post('/login', ['email' => $user->email]);
    $code = '';
    Mail::assertQueued(LoginOtpMail::class, function (LoginOtpMail $mail) use (&$code): bool {
        $code = $mail->code;

        return true;
    });
    test()->post('/login/verify', ['code' => $code]);

    return DeviceAuthorizationRequest::query()->where('user_id', $user->id)->latest('id')->firstOrFail();
}

test('tampered signed link fails', function () {
    $user = securityLoginUser();
    $authorization = startUnknownDeviceChallenge($user);

    $url = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    $this->get($url.'tampered')->assertForbidden();
});

test('raw device token is never persisted', function () {
    $user = securityLoginUser();
    $authorization = startUnknownDeviceChallenge($user);

    expect($authorization->token_hash)->toHaveLength(64);
    expect($authorization->getAttributes()['token_hash'])->not->toContain($authorization->ulid);
});

test('client submitted user id cannot authorize another user', function () {
    $owner = securityLoginUser();
    $attacker = securityLoginUser();
    $authorization = startUnknownDeviceChallenge($owner);

    $url = URL::temporarySignedRoute(
        'device-authorization.approve',
        now()->addHour(),
        ['authorization' => $authorization->ulid],
    );

    $this->actingAs($attacker)->get($url);

    expect($authorization->fresh()->status->value)->toBe('approved');
    expect(TrustedDevice::query()->where('user_id', $attacker->id)->count())->toBe(0);
});

test('resend is rate limited', function () {
    $user = securityLoginUser();
    startUnknownDeviceChallenge($user);

    $this->post(route('login.device.resend'))->assertRedirect();
    $this->post(route('login.device.resend'))->assertRedirect();
    $this->post(route('login.device.resend'))->assertRedirect();
    $this->post(route('login.device.resend'))->assertTooManyRequests();
});

test('unknown email does not create a device challenge', function () {
    Notification::fake();

    $this->post('/login', ['email' => 'missing-'.Str::random(8).'@example.com'])
        ->assertSessionHasErrors('email');

    expect(DeviceAuthorizationRequest::query()->count())->toBe(0);
    Notification::assertNothingSent();
});

test('concurrent approve and deny has a single winner', function () {
    $user = securityLoginUser();
    $authorization = startUnknownDeviceChallenge($user);

    $approve = URL::temporarySignedRoute('device-authorization.approve', now()->addHour(), ['authorization' => $authorization->ulid]);
    $deny = URL::temporarySignedRoute('device-authorization.deny', now()->addHour(), ['authorization' => $authorization->ulid]);

    $this->get($approve);
    $this->get($deny);

    $authorization->refresh();
    expect($authorization->status->value)->toBe('approved');
    expect($authorization->denied_at)->toBeNull();
});
