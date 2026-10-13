<?php

use App\Models\Estate;
use App\Models\User;
use App\Models\UserClient;
use App\Models\UserClientDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    config(['session.driver' => 'database']);

    $this->zeus = fn () => $this->withSession([config('zeus.session_key') => true]);
    $this->overview = fn (array $query = []) => ($this->zeus)()->get(route('zeus.audience.index', $query))->viewData('page')['props']['overview'];

    $this->person = fn (array $attributes = []) => User::factory()->create($attributes);

    // A person active on a kind of client, this many days ago (0 = today).
    $this->active = function (User $user, string $platform = 'desktop_web', string $os = 'mac', int $daysAgo = 0) {
        UserClientDay::query()->insertOrIgnore(['user_id' => $user->id, 'platform' => $platform, 'os' => $os, 'day' => now()->subDays($daysAgo)->toDateString()]);
    };

    $this->member = fn (Estate $estate, User $user) => DB::table('estate_users_membership')->insert([
        'estate_id' => $estate->id, 'user_id' => $user->id, 'status' => 'accepted', 'created_at' => now(), 'updated_at' => now(),
    ]);

    $this->client = fn (User $user, string $os, ?string $version, int $daysAgo = 0) => UserClient::create([
        'user_id' => $user->id, 'platform' => 'native', 'os' => $os, 'browser' => 'app', 'app_version' => $version,
        'first_seen_at' => now()->subDays($daysAgo), 'last_seen_at' => now()->subDays($daysAgo),
    ]);

    $this->session = fn (User $user, int $secondsAgo) => DB::table('sessions')->insert([
        'id' => Str::random(40), 'user_id' => $user->id, 'ip_address' => '127.0.0.1', 'user_agent' => 'x', 'payload' => '', 'last_activity' => time() - $secondsAgo,
    ]);
});

it('keeps the audience behind the Zeus session', function () {
    $this->get(route('zeus.audience.index'))->assertRedirect(route('zeus.login'));
});

// ---------- Who is active ----------

it('counts people, not visits: today, this week and this month', function () {
    [$a, $b, $c, $d] = collect(range(1, 4))->map(fn () => ($this->person)())->all();

    ($this->active)($a, daysAgo: 0);
    ($this->active)($a, 'native', 'ios', 0);   // the same person on a second client is still one person
    ($this->active)($b, daysAgo: 0);
    ($this->active)($c, daysAgo: 3);
    ($this->active)($d, daysAgo: 20);
    ($this->active)($d, daysAgo: 40);           // outside every window

    $summary = ($this->overview)()['summary'];

    expect($summary)->toMatchArray(['today' => 2, 'week' => 3, 'month' => 4, 'in_range' => 4, 'yesterday' => 0])
        ->and($summary['stickiness'])->toBe(50.0);
});

it('compares this week and range with the ones before', function () {
    $people = collect(range(1, 6))->map(fn () => ($this->person)());

    ($this->active)($people[0], daysAgo: 1);
    ($this->active)($people[1], daysAgo: 2);
    ($this->active)($people[2], daysAgo: 9);
    ($this->active)($people[3], daysAgo: 10);
    ($this->active)($people[4], daysAgo: 11);

    $summary = ($this->overview)(['range' => '7d'])['summary'];

    expect($summary['week'])->toBe(2)->and($summary['previous_week'])->toBe(3)
        ->and($summary['in_range'])->toBe(2)->and($summary['previous_range'])->toBe(3);
});

it('splits people by the kind of client they use, counting someone on two kinds on both', function () {
    [$a, $b, $c, $d] = collect(range(1, 4))->map(fn () => ($this->person)())->all();

    ($this->active)($a, 'native', 'android', 0);
    ($this->active)($b, 'native', 'ios', 0);
    ($this->active)($b, 'desktop_web', 'mac', 1);   // on the app and a laptop
    ($this->active)($c, 'mobile_web', 'ios', 0);
    ($this->active)($c, 'mobile_web', 'android', 1); // two phones, still one phone-browser person
    ($this->active)($d, 'pwa', 'android', 0);

    $overview = ($this->overview)();
    $by = collect($overview['platforms'])->pluck('users', 'key');

    expect($by->all())->toBe(['android_app' => 1, 'ios_app' => 1, 'installed_web' => 1, 'phone_browser' => 1, 'desktop_browser' => 1, 'other' => 0])
        ->and($overview['summary']['in_range'])->toBe(4)
        ->and($overview['summary']['app_users'])->toBe(2)
        ->and($overview['summary']['app_share'])->toBe(50.0);
});

it('charts every day of the range, quiet days included, split by kind of client', function () {
    [$a, $b] = collect(range(1, 2))->map(fn () => ($this->person)())->all();

    ($this->active)($a, 'native', 'ios', 0);
    ($this->active)($b, 'desktop_web', 'mac', 0);
    ($this->active)($a, 'native', 'ios', 2);

    $series = collect(($this->overview)(['range' => '7d'])['series']);

    expect($series)->toHaveCount(7)
        ->and($series->last())->toMatchArray(['day' => now()->toDateString(), 'total' => 2, 'ios_app' => 1, 'desktop_browser' => 1])
        ->and($series[4])->toMatchArray(['day' => now()->subDays(2)->toDateString(), 'total' => 1, 'ios_app' => 1])
        ->and($series[5]['total'])->toBe(0)
        ->and($series->pluck('day')->all())->toBe($series->pluck('day')->sort()->values()->all())
        ->and(($this->overview)(['range' => '30d'])['series'])->toHaveCount(30)
        ->and(($this->overview)(['range' => '90d'])['series'])->toHaveCount(90);

    ($this->zeus)()->get(route('zeus.audience.index', ['range' => 'forever']))->assertSessionHasErrors('range');
});

// ---------- App versions ----------

it('shows which app versions people are on per system, and who is behind', function () {
    $people = collect(range(1, 7))->map(fn () => ($this->person)());

    ($this->client)($people[0], 'ios', '1.5.0');
    ($this->client)($people[1], 'ios', '1.5.0');
    ($this->client)($people[2], 'ios', '1.4.2');
    ($this->client)($people[3], 'ios', null);
    ($this->client)($people[4], 'android', '1.10.0');   // 1.10 is newer than 1.9
    ($this->client)($people[5], 'android', '1.9.0');
    ($this->client)($people[6], 'ios', '1.0.0', daysAgo: 45);  // not seen for over 30 days: not counted

    $versions = collect(($this->overview)()['versions'])->keyBy('os');

    expect($versions['ios'])->toMatchArray(['users' => 4, 'latest' => '1.5.0', 'on_latest' => 2, 'unknown' => 1, 'label' => 'iOS'])
        ->and(collect($versions['ios']['versions'])->pluck('version')->all())->toBe(['1.5.0', '1.4.2'])
        ->and($versions['android'])->toMatchArray(['users' => 2, 'latest' => '1.10.0', 'on_latest' => 1, 'label' => 'Android']);
});

// ---------- Roles and estates ----------

it('counts active people by the role they hold', function () {
    $estate = Estate::factory()->create();
    foreach (['resident', 'security'] as $name) {
        Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }
    setPermissionsTeamId($estate->id);

    $resident = ($this->person)();
    $other = ($this->person)();
    $guard = ($this->person)();
    $silent = ($this->person)();
    $resident->assignRole('resident');
    $other->assignRole('resident');
    $guard->assignRole('security');
    $silent->assignRole('resident');

    ($this->active)($resident);
    ($this->active)($other, daysAgo: 2);
    ($this->active)($guard);

    expect(collect(($this->overview)()['roles'])->pluck('users', 'role')->all())->toBe(['resident' => 2, 'security' => 1]);
});

it('ranks estates by how much of their membership is active, and by how much of it uses the app', function () {
    [$busy, $quiet, $tiny] = collect(['Busy Estate', 'Quiet Estate', 'Tiny Estate'])->map(fn ($name) => Estate::factory()->create(['name' => $name]))->all();

    $busyPeople = collect(range(1, 6))->map(fn () => ($this->person)());
    $quietPeople = collect(range(1, 6))->map(fn () => ($this->person)());
    $tinyPeople = collect(range(1, 2))->map(fn () => ($this->person)());

    $busyPeople->each(fn ($u) => ($this->member)($busy, $u));
    $quietPeople->each(fn ($u) => ($this->member)($quiet, $u));
    $tinyPeople->each(fn ($u) => ($this->member)($tiny, $u));

    $busyPeople->take(5)->each(fn ($u) => ($this->active)($u));
    ($this->active)($busyPeople[0], 'native', 'ios');
    ($this->active)($busyPeople[1], 'native', 'android');
    ($this->active)($quietPeople[0]);

    $estates = ($this->overview)()['estates'];

    expect($estates['busiest'][0])->toMatchArray(['name' => 'Busy Estate', 'members' => 6, 'active' => 5, 'rate' => 83.3, 'app_users' => 2, 'app_share' => 40.0])
        ->and(collect($estates['quietest'])->pluck('name')->all())->toBe(['Quiet Estate', 'Busy Estate']);   // Tiny Estate is below the size cut-off
});

it('lists every estate on its own tab, sorted and searchable, and reads the list only there', function () {
    $estates = collect(['Alpha Court', 'Beta Court', 'Gamma Park'])->map(fn ($name) => Estate::factory()->create(['name' => $name]));
    foreach ($estates as $i => $estate) {
        foreach (range(1, 4 - $i) as $n) {
            $user = ($this->person)();
            ($this->member)($estate, $user);
            ($this->active)($user);
        }
    }

    $props = fn (array $query) => ($this->zeus)()->get(route('zeus.audience.index', $query))->viewData('page')['props'];
    $names = fn (array $query) => collect($props(['tab' => 'estates', ...$query])['estates']['data'])->pluck('name')->all();

    expect($props([])['estates'] ?? null)->toBeNull()
        ->and($names([]))->toBe(['Alpha Court', 'Beta Court', 'Gamma Park'])
        ->and($names(['sort' => 'members']))->toBe(['Alpha Court', 'Beta Court', 'Gamma Park'])
        ->and($names(['search' => 'court']))->toBe(['Alpha Court', 'Beta Court'])
        ->and($names(['search' => 'zzz']))->toBe([])
        ->and($props(['tab' => 'estates'])['estates']['total'])->toBe(3);

    ($this->zeus)()->get(route('zeus.audience.index', ['sort' => 'nonsense']))->assertSessionHasErrors('sort');
    ($this->zeus)()->get(route('zeus.audience.index', ['tab' => 'nonsense']))->assertSessionHasErrors('tab');
});

// ---------- Online now ----------

it('lists who is online right now with the kind of client and estate, and not guests or people who left', function () {
    $estate = Estate::factory()->create(['name' => 'Lekki Gardens']);
    $here = ($this->person)(['name' => 'Ada Online']);
    $gone = ($this->person)(['name' => 'Bola Gone']);
    ($this->member)($estate, $here);
    ($this->client)($here, 'ios', '1.5.0');

    ($this->session)($here, 30);
    ($this->session)($here, 120);        // two sessions, one person
    ($this->session)($gone, 1800);       // left half an hour ago
    DB::table('sessions')->insert(['id' => Str::random(40), 'user_id' => null, 'payload' => '', 'last_activity' => time()]);  // a guest

    $overview = ($this->overview)();

    expect($overview['summary']['online_now'])->toBe(1)
        ->and($overview['online'])->toHaveCount(1)
        ->and($overview['online'][0])->toMatchArray(['name' => 'Ada Online', 'estate' => 'Lekki Gardens', 'client' => 'ios_app', 'app_version' => '1.5.0']);
});

it('has no online figures when sessions are not kept in the database', function () {
    config(['session.driver' => 'file']);

    $overview = ($this->overview)();

    expect($overview['online'])->toBeNull()->and($overview['summary']['online_now'])->toBeNull();
});

// ---------- Is it fine? ----------

it('says nothing has been recorded when there is no data yet', function () {
    $overview = ($this->overview)();

    expect($overview['health']['level'])->toBe('attention')->and($overview['health']['message'])->toContain('Nothing has been recorded')
        ->and($overview['tracking_since'])->toBeNull();
});

it('flags a day that was much quieter than the week before, and otherwise calls usage steady', function () {
    $people = collect(range(1, 12))->map(fn () => ($this->person)());

    // A steady 12 a day for the week before yesterday, with the first day long enough ago.
    foreach (range(2, 9) as $ago) {
        $people->each(fn ($u) => ($this->active)($u, daysAgo: $ago));
    }
    $people->take(12)->each(fn ($u) => ($this->active)($u, daysAgo: 1));
    expect(($this->overview)()['health'])->toMatchArray(['level' => 'ok', 'message' => 'Usage is steady.']);

    DB::table('user_client_days')->where('day', now()->subDay()->toDateString())->whereIn('user_id', $people->take(8)->pluck('id'))->delete();
    Cache::flush();

    expect(($this->overview)()['health']['level'])->toBe('attention')
        ->and(($this->overview)()['health']['message'])->toContain('quieter');
});

it('says tracking is new while the history is short', function () {
    ($this->active)(($this->person)(), daysAgo: 2);

    $overview = ($this->overview)();

    expect($overview['health']['message'])->toContain('Tracking started')
        ->and($overview['tracking_since'])->toBe(now()->subDays(2)->toDateString());
});

// ---------- Live refresh ----------

it('answers a live refresh of only the figures', function () {
    ($this->active)(($this->person)());
    $version = ($this->zeus)()->get(route('zeus.audience.index'))->viewData('page')['version'];

    ($this->zeus)()->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Inertia-Partial-Component' => 'Zeus/Audience/Index',
        'X-Inertia-Partial-Data' => 'overview',
    ])->get(route('zeus.audience.index'))
        ->assertOk()
        ->assertJsonPath('props.overview.summary.today', 1)
        ->assertJsonMissingPath('props.filters');
});
