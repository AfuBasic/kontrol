<?php

use App\Actions\Platform\RecordUserClient;
use App\Http\Middleware\RecordClientPlatform;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserClient;
use App\Services\Zeus\ImpersonationService;
use App\Support\ClientPlatform;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

const IPHONE_APP_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KontrolApp';
const ANDROID_APP_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36 KontrolApp';
const ANDROID_CHROME_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const OLD_ANDROID_BROWSER_UA = 'Mozilla/5.0 (Linux; U; Android 4.4; en-us; Nexus 5) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30';
const IPHONE_SAFARI_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const MAC_CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const IPAD_AS_MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KontrolApp';

function clientFor(string $userAgent, array $headers = []): ClientPlatform
{
    $server = ['HTTP_USER_AGENT' => $userAgent];
    foreach ($headers as $name => $value) {
        $server['HTTP_'.strtoupper(str_replace('-', '_', $name))] = $value;
    }

    return ClientPlatform::fromRequest(Request::create('/', 'GET', [], [], [], $server));
}

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $this->resident = function (): User {
        $estate = Estate::factory()->create();
        $user = User::factory()->create();
        setPermissionsTeamId($estate->id);
        $user->assignRole('resident');
        $user->update(['current_estate_id' => $estate->id]);

        return $user;
    };

    // Headers set on the test case stick to every later request, so each visit starts clean.
    $this->visit = fn (User $user, string $userAgent, array $headers = []) => $this->flushHeaders()
        ->actingAs($user)
        ->withHeaders(['User-Agent' => $userAgent, ...$headers])
        ->get(route('account.support.index'));
});

// ---------- Telling the platforms apart ----------

it('recognises the iOS app, and the Android app, by the app\'s own marks', function () {
    $ios = clientFor(IPHONE_APP_UA, ['X-Capacitor-App' => 'true', 'X-App-Platform' => 'ios', 'X-App-Version' => '1.4.2']);
    $android = clientFor(ANDROID_APP_UA, ['X-Capacitor-App' => 'true', 'X-App-Platform' => 'android', 'X-App-Version' => '1.4.0']);

    expect([$ios->platform, $ios->os, $ios->browser, $ios->appVersion])->toBe(['native', 'ios', 'app', '1.4.2'])
        ->and([$android->platform, $android->os, $android->browser, $android->appVersion])->toBe(['native', 'android', 'app', '1.4.0']);
});

it('recognises the app from its user agent alone, before it has sent any headers', function () {
    $client = clientFor(IPHONE_APP_UA);

    expect([$client->platform, $client->os, $client->appVersion])->toBe(['native', 'ios', null]);
});

it('trusts what the app says about its own system over a user agent that looks like a Mac', function () {
    // An iPad can present itself as a Mac.
    $client = clientFor(IPAD_AS_MAC_UA, ['X-App-Platform' => 'ios']);

    expect([$client->platform, $client->os])->toBe(['native', 'ios']);
});

it('does not call a phone browser the app just because its user agent resembles a web view', function () {
    $oldBrowser = clientFor(OLD_ANDROID_BROWSER_UA);
    $chrome = clientFor(ANDROID_CHROME_UA);

    expect([$oldBrowser->platform, $oldBrowser->os])->toBe(['mobile_web', 'android'])
        ->and([$chrome->platform, $chrome->os, $chrome->browser])->toBe(['mobile_web', 'android', 'chrome']);
});

it('tells the installed web app, a phone browser and a desktop browser apart', function () {
    $pwa = clientFor(ANDROID_CHROME_UA, ['X-PWA-Standalone' => 'true']);
    $safari = clientFor(IPHONE_SAFARI_UA);
    $desktop = clientFor(MAC_CHROME_UA);

    expect([$pwa->platform, $pwa->os])->toBe(['pwa', 'android'])
        ->and([$safari->platform, $safari->os, $safari->browser])->toBe(['mobile_web', 'ios', 'safari'])
        ->and([$desktop->platform, $desktop->os])->toBe(['desktop_web', 'mac']);
});

it('ignores a made-up platform or version, and a version from anything but the app', function () {
    expect(clientFor(MAC_CHROME_UA, ['X-App-Platform' => 'toaster'])->platform)->toBe('desktop_web')
        ->and(clientFor(IPHONE_APP_UA, ['X-App-Version' => "1.0'; DROP TABLE users;--"])->appVersion)->toBeNull()
        ->and(clientFor(IPHONE_APP_UA, ['X-App-Version' => str_repeat('9', 40)])->appVersion)->toBeNull()
        ->and(clientFor(IPHONE_SAFARI_UA, ['X-App-Version' => '9.9.9'])->appVersion)->toBeNull();
});

// ---------- Recording ----------

it('records what a signed-in person uses, once, with only the platform and version', function () {
    $user = ($this->resident)();

    ($this->visit)($user, IPHONE_APP_UA, ['X-Capacitor-App' => 'true', 'X-App-Platform' => 'ios', 'X-App-Version' => '1.4.2'])->assertOk();

    $row = UserClient::query()->sole();

    expect($row->user_id)->toBe($user->id)
        ->and([$row->platform, $row->os, $row->browser, $row->app_version])->toBe(['native', 'ios', 'app', '1.4.2'])
        ->and(collect($row->getAttributes())->keys()->all())->not->toContain('user_agent', 'ip_address');
});

it('does not touch the database again for the same client within fifteen minutes', function () {
    $user = ($this->resident)();
    $this->travelTo(now());

    ($this->visit)($user, MAC_CHROME_UA);
    $first = UserClient::query()->sole()->last_seen_at;

    $this->travel(10)->minutes();
    $writes = 0;
    DB::listen(function ($query) use (&$writes) {
        if (str_contains($query->sql, 'user_clients')) {
            $writes++;
        }
    });
    ($this->visit)($user, MAC_CHROME_UA);

    expect($writes)->toBe(0)
        ->and(UserClient::query()->sole()->last_seen_at->equalTo($first))->toBeTrue();
});

it('refreshes last seen after fifteen minutes', function () {
    $user = ($this->resident)();
    $this->travelTo(now());

    ($this->visit)($user, MAC_CHROME_UA);
    $first = UserClient::query()->sole()->last_seen_at;

    $this->travel(16)->minutes();
    ($this->visit)($user, MAC_CHROME_UA);

    $row = UserClient::query()->sole();

    expect($row->last_seen_at->greaterThan($first))->toBeTrue()
        ->and($row->first_seen_at->equalTo($first))->toBeTrue();
});

it('keeps one row per platform, so a person on the app and a laptop counts on both', function () {
    $user = ($this->resident)();

    ($this->visit)($user, IPHONE_APP_UA, ['X-App-Platform' => 'ios']);
    ($this->visit)($user, MAC_CHROME_UA);

    expect(UserClient::query()->where('user_id', $user->id)->orderBy('platform')->pluck('platform')->all())->toBe(['desktop_web', 'native']);
});

it('updates the version when the app is updated, and never erases it on a plain page load', function () {
    $user = ($this->resident)();

    ($this->visit)($user, IPHONE_APP_UA, ['X-App-Platform' => 'ios', 'X-App-Version' => '1.4.2']);
    expect(UserClient::query()->sole()->app_version)->toBe('1.4.2');

    // A page load carries the user agent but not the headers.
    ($this->visit)($user, IPHONE_APP_UA);
    expect(UserClient::query()->sole()->app_version)->toBe('1.4.2');

    ($this->visit)($user, IPHONE_APP_UA, ['X-App-Platform' => 'ios', 'X-App-Version' => '1.5.0']);
    expect(UserClient::query()->sole()->app_version)->toBe('1.5.0');
});

it('records nothing for a guest', function () {
    $this->withHeaders(['User-Agent' => MAC_CHROME_UA])->get(route('account.support.index'))->assertRedirect(route('login'));

    expect(UserClient::query()->count())->toBe(0);
});

it('does not record Zeus looking at an account as that person using the app', function () {
    $user = ($this->resident)();

    $request = Request::create('/', 'GET', [], [], [], ['HTTP_USER_AGENT' => MAC_CHROME_UA]);
    $request->setLaravelSession(app('session')->driver());
    $request->session()->put(ImpersonationService::SESSION_ID_KEY, 999);
    $this->actingAs($user);

    app(RecordClientPlatform::class)->handle($request, fn () => response('ok'));

    // Nothing was even scheduled for writing.
    expect($request->session()->has('client_platform'))->toBeFalse()
        ->and(UserClient::query()->count())->toBe(0);
});

it('lets the request through even when recording fails', function () {
    $user = ($this->resident)();
    $this->mock(RecordUserClient::class)->shouldReceive('execute')->andThrow(new RuntimeException('database is down'));

    ($this->visit)($user, MAC_CHROME_UA)->assertOk();

    expect(UserClient::query()->count())->toBe(0);
});

it('tolerates two requests from a brand new client arriving together', function () {
    $user = ($this->resident)();
    $client = clientFor(MAC_CHROME_UA);

    app(RecordUserClient::class)->execute($user, $client);
    app(RecordUserClient::class)->execute($user, $client);

    expect(UserClient::query()->count())->toBe(1);
});

it('removes clients not seen for six months, and keeps the rest', function () {
    $user = ($this->resident)();
    $make = fn (string $os, int $daysAgo) => UserClient::create([
        'user_id' => $user->id, 'platform' => 'native', 'os' => $os,
        'first_seen_at' => now()->subDays($daysAgo), 'last_seen_at' => now()->subDays($daysAgo),
    ]);
    $make('ios', 200);
    $recent = $make('android', 10);

    $this->artisan('model:prune', ['--model' => [UserClient::class]])->assertSuccessful();

    expect(UserClient::query()->pluck('id')->all())->toBe([$recent->id]);
});

it('prunes stale clients on the daily schedule', function () {
    $event = collect(app(Schedule::class)->events())->first(fn ($e) => str_contains($e->command, 'model:prune'));

    expect($event->command)->toContain('UserClient');
});

it('deletes a person\'s clients along with the person', function () {
    $user = ($this->resident)();
    ($this->visit)($user, MAC_CHROME_UA);

    $user->delete();

    expect(UserClient::query()->count())->toBe(0);
});
