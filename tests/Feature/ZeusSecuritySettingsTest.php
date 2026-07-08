<?php

use App\Models\ZeusSetting;
use App\Services\Zeus\TotpService;

beforeEach(function () {
    ZeusSetting::truncate();
    session()->forget('zeus_temp_2fa_secret');
    session()->forget('zeus_pending_login');
});

test('guests get redirected to login when trying to view settings', function () {
    $this->get(route('zeus.settings.index'))
        ->assertRedirect(route('zeus.login'));
});

test('authenticated zeus admin can view settings index and see 2FA configuration details', function () {
    $sessionKey = config('zeus.session_key');

    $this->withSession([$sessionKey => true])
        ->get(route('zeus.settings.index'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/Settings/Index')
            ->where('isEnabled', false)
            ->has('secret')
            ->has('qrCodeUrl')
        );
});

test('enabling 2FA with an invalid code fails', function () {
    $sessionKey = config('zeus.session_key');

    $this->withSession([
        $sessionKey => true,
        'zeus_temp_2fa_secret' => 'ORSXG5BRGIZTINJ2', // Sample base32 secret
    ])
        ->post(route('zeus.settings.two_factor.enable'), [
            'code' => '000000',
        ])
        ->assertSessionHasErrors('code');

    expect(ZeusSetting::get('google2fa_secret'))->toBeNull();
});

test('enabling 2FA with a valid code succeeds and stores secret in database', function () {
    $sessionKey = config('zeus.session_key');
    $secret = 'ORSXG5BRGIZTINJ2';
    $totp = app(TotpService::class);
    $validCode = $totp->getTotpCode($secret);

    $this->withSession([
        $sessionKey => true,
        'zeus_temp_2fa_secret' => $secret,
    ])
        ->post(route('zeus.settings.two_factor.enable'), [
            'code' => $validCode,
        ])
        ->assertRedirect(route('zeus.settings.index'))
        ->assertSessionHasNoErrors();

    expect(ZeusSetting::get('google2fa_secret'))->toBe($secret);
});

test('login checks for 2FA and redirects to verification page if enabled', function () {
    $secret = 'ORSXG5BRGIZTINJ2';
    ZeusSetting::set('google2fa_secret', $secret);

    $this->post(route('zeus.login.submit'), [
        'username' => config('zeus.username'),
        'password' => config('zeus.password'),
    ])
        ->assertRedirect(route('zeus.login.2fa'))
        ->assertSessionHas('zeus_pending_login', true);

    expect(session(config('zeus.session_key')))->toBeNull();
});

test('submitting invalid 2FA code during login fails', function () {
    $secret = 'ORSXG5BRGIZTINJ2';
    ZeusSetting::set('google2fa_secret', $secret);

    $this->withSession(['zeus_pending_login' => true])
        ->post(route('zeus.login.2fa.submit'), [
            'code' => '000000',
        ])
        ->assertSessionHasErrors('code');

    expect(session(config('zeus.session_key')))->toBeNull();
});

test('submitting valid 2FA code during login logs the admin in successfully', function () {
    $secret = 'ORSXG5BRGIZTINJ2';
    ZeusSetting::set('google2fa_secret', $secret);
    $totp = app(TotpService::class);
    $validCode = $totp->getTotpCode($secret);

    $this->withSession(['zeus_pending_login' => true])
        ->post(route('zeus.login.2fa.submit'), [
            'code' => $validCode,
        ])
        ->assertRedirect(route('zeus.dashboard'))
        ->assertSessionHasNoErrors();

    expect(session(config('zeus.session_key')))->toBeTrue();
});

test('disabling 2FA with a valid code clears secret from database', function () {
    $sessionKey = config('zeus.session_key');
    $secret = 'ORSXG5BRGIZTINJ2';
    ZeusSetting::set('google2fa_secret', $secret);
    $totp = app(TotpService::class);
    $validCode = $totp->getTotpCode($secret);

    $this->withSession([$sessionKey => true])
        ->post(route('zeus.settings.two_factor.disable'), [
            'code' => $validCode,
        ])
        ->assertRedirect(route('zeus.settings.index'))
        ->assertSessionHasNoErrors();

    expect(ZeusSetting::get('google2fa_secret'))->toBeNull();
});
