<?php

use App\Models\Estate;
use App\Models\User;
use App\Services\Platform\PlatformAccessService;
use App\Services\Platform\PlatformDetectionService;
use App\Services\Platform\RolePlatformPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create base roles if needed
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'household_member', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
});

test('platform detection service identifies capacitor native app', function () {
    $detection = new PlatformDetectionService();

    // Via header
    $requestHeader = Request::create('/', 'GET', [], [], [], ['HTTP_X_CAPACITOR_APP' => 'true']);
    $contextHeader = $detection->detect($requestHeader);
    expect($contextHeader->isNativeApp)->toBeTrue();

    // Via User Agent
    $requestUa = Request::create('/', 'GET', [], [], [], ['HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) KontrolApp']);
    $contextUa = $detection->detect($requestUa);
    expect($contextUa->isNativeApp)->toBeTrue();
});

test('platform detection service identifies installed PWA standalone mode', function () {
    $detection = new PlatformDetectionService();

    // Via header
    $requestHeader = Request::create('/', 'GET', [], [], [], ['HTTP_X_PWA_STANDALONE' => 'true']);
    $contextHeader = $detection->detect($requestHeader);
    expect($contextHeader->isInstalledPwa)->toBeTrue();

    // Via query parameter
    $requestQuery = Request::create('/?source=pwa', 'GET');
    $contextQuery = $detection->detect($requestQuery);
    expect($contextQuery->isInstalledPwa)->toBeTrue();
});

test('administrative roles have unrestricted access across all platforms', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');

    $policy = new RolePlatformPolicy();

    // Desktop request
    $requestDesktop = Request::create('/admin/dashboard', 'GET', [], [], [], [
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ]);
    $detection = new PlatformDetectionService();
    $contextDesktop = $detection->detect($requestDesktop);

    expect($policy->isAllowed($admin, $contextDesktop))->toBeTrue();
});

test('operational roles are blocked on desktop browsers and redirected to unsupported page', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');

    $requestDesktop = Request::create('/resident/home', 'GET', [], [], [], [
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]);

    $service = app(PlatformAccessService::class);
    $result = $service->evaluate($requestDesktop, $resident);

    expect($result->allowed)->toBeFalse();
    expect($result->redirectUrl)->toBe(route('platform.unsupported'));
});

test('operational roles on android mobile browsers are redirected to android install experience', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');

    $requestAndroidBrowser = Request::create('/resident/home', 'GET', [], [], [], [
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ]);

    $service = app(PlatformAccessService::class);
    $result = $service->evaluate($requestAndroidBrowser, $resident);

    expect($result->allowed)->toBeFalse();
    expect($result->redirectUrl)->toBe(route('platform.install.android'));
});

test('operational roles on installed android PWA are allowed', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');

    $requestPwa = Request::create('/resident/home', 'GET', [], [], [], [
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'HTTP_X_PWA_STANDALONE' => 'true',
    ]);

    $service = app(PlatformAccessService::class);
    $result = $service->evaluate($requestPwa, $resident);

    expect($result->allowed)->toBeTrue();
});

test('exempt routes are accessible by operational users on mobile browser', function () {
    $estate = Estate::factory()->create();
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');

    $requestBilling = Request::create('/resident/billing', 'GET', [], [], [], [
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Linux; Android 13; SM-G998B)',
    ]);

    $service = app(PlatformAccessService::class);
    $result = $service->evaluate($requestBilling, $resident);

    expect($result->allowed)->toBeTrue();
});

test('platform experience routes render correctly for guest and authenticated requests', function () {
    $this->get(route('platform.install.android'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Platform/AndroidInstall'));

    $this->get(route('platform.install.ios'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Platform/IosDownload'));

    $this->get(route('platform.unsupported'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Platform/UnsupportedPlatform'));
});
