<?php

namespace App\Services\Zeus;

use App\Models\User;
use App\Models\UserClient;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Who uses Kontrol, and on what. Counts people, not requests: everything comes from the daily record in
 * user_client_days (history) and user_clients (the latest sighting, with the app version).
 */
class AudienceService
{
    /** Each range, in days. Daily is the finest the record goes. */
    public const RANGES = ['7d' => 7, '30d' => 30, '90d' => 90];

    /** @var list<int> */
    public const PER_PAGE = [25, 50, 100];

    public const ESTATE_SORTS = ['active', 'rate', 'members', 'app'];

    /** Someone with a session touched in the last this-many seconds counts as online. */
    public const ONLINE_WITHIN_SECONDS = 300;

    /** Estates smaller than this are left out of "quietest", where a handful of members would only be noise. */
    public const QUIET_MIN_MEMBERS = 5;

    /** The kinds of client, in the order they are shown. */
    public const GROUPS = [
        'android_app' => 'Android app',
        'ios_app' => 'iOS app',
        'installed_web' => 'Installed web app',
        'phone_browser' => 'Phone browser',
        'desktop_browser' => 'Desktop browser',
        'other' => 'Other',
    ];

    /**
     * Everything the Audience overview shows, for one range. Cached for a few seconds so a page that refreshes itself,
     * in several tabs, costs about one set of queries per window.
     *
     * @return array<string, mixed>
     */
    public function overview(string $range = '30d'): array
    {
        $range = array_key_exists($range, self::RANGES) ? $range : '30d';
        $ttl = (int) config('queue.history.overview_cache_seconds', 4);

        if ($ttl <= 0) {
            return $this->buildOverview($range);
        }

        return Cache::remember("zeus:audience:overview:{$range}", $ttl, fn () => $this->buildOverview($range));
    }

    /**
     * Every estate with how many of its members were active in the range, for the Estates tab.
     *
     * @param  array{search?: string|null, sort?: string, range?: string}  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function estates(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        $rows = $this->estateRows($filters['range'] ?? '30d');

        $search = mb_strtolower(trim((string) ($filters['search'] ?? '')));
        if ($search !== '') {
            $rows = $rows->filter(fn (array $row) => str_contains(mb_strtolower($row['name']), $search));
        }

        $sort = in_array($filters['sort'] ?? 'active', self::ESTATE_SORTS, true) ? ($filters['sort'] ?? 'active') : 'active';
        $key = ['active' => 'active', 'rate' => 'rate', 'members' => 'members', 'app' => 'app_users'][$sort];
        $rows = $rows->sortBy([[$key, 'desc'], ['name', 'asc']])->values();

        $page = max(1, (int) request()->query('page', 1));

        return (new Paginator($rows->forPage($page, $perPage)->values(), $rows->count(), $perPage, $page, ['path' => request()->url()]))
            ->withQueryString();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildOverview(string $range): array
    {
        $days = self::RANGES[$range];
        $today = CarbonImmutable::today();
        $from = $today->subDays($days - 1);

        $firstDay = DB::table('user_client_days')->min('day');

        $active = fn (CarbonImmutable $start, ?CarbonImmutable $end = null) => (int) DB::table('user_client_days')
            ->where('day', '>=', $start->toDateString())
            ->when($end, fn ($q) => $q->where('day', '<=', $end->toDateString()))
            ->distinct()->count('user_id');

        $dau = $active($today, $today);
        $yesterday = $active($today->subDay(), $today->subDay());
        $wau = $active($today->subDays(6));
        $previousWau = $active($today->subDays(13), $today->subDays(7));
        $mau = $active($today->subDays(29));
        $inRange = $active($from);
        $previous = $active($from->subDays($days), $from->subDay());

        $byClient = $this->activeByClient($from);
        $appUsers = (int) DB::table('user_client_days')->where('day', '>=', $from->toDateString())->where('platform', UserClient::NATIVE)->distinct()->count('user_id');

        $summary = [
            'online_now' => $this->onlineCount(),
            'today' => $dau,
            'yesterday' => $yesterday,
            'week' => $wau,
            'previous_week' => $previousWau,
            'month' => $mau,
            'stickiness' => $mau > 0 ? round($dau / $mau * 100, 1) : null,
            'in_range' => $inRange,
            'previous_range' => $previous,
            'app_users' => $appUsers,
            'app_share' => $inRange > 0 ? round($appUsers / $inRange * 100, 1) : null,
            'total_users' => User::query()->count(),
            'new_users' => User::query()->where('created_at', '>=', $from)->count(),
        ];

        return [
            'range' => $range,
            'generated_at' => now()->toIso8601String(),
            'summary' => $summary,
            'health' => $this->health($firstDay, $yesterday, $this->dailyActive($today->subDays(8), $today->subDays(2)), $today),
            'tracking_since' => $firstDay ? CarbonImmutable::parse($firstDay)->toDateString() : null,
            'platforms' => $byClient,
            'series' => $this->series($from, $today),
            'versions' => $this->versions(),
            'roles' => $this->roles($from),
            'estates' => $this->estateHighlights($range),
            'online' => $this->online(),
        ];
    }

    /**
     * People active per kind of client in the range. A person on two kinds counts on both, so these can add up to
     * more than the number of people; the page says so.
     *
     * @return list<array{key: string, label: string, users: int}>
     */
    private function activeByClient(CarbonImmutable $from): array
    {
        $since = $from->toDateString();

        // Distinct people per kind of client. The store apps are told apart by system; the rest by platform alone, so
        // someone who browses on both an iPhone and an Android phone is still one phone-browser user.
        $native = DB::table('user_client_days')->where('day', '>=', $since)->where('platform', UserClient::NATIVE)
            ->select('os', DB::raw('COUNT(DISTINCT user_id) AS users'))->groupBy('os')->pluck('users', 'os');
        $others = DB::table('user_client_days')->where('day', '>=', $since)->where('platform', '!=', UserClient::NATIVE)
            ->select('platform', DB::raw('COUNT(DISTINCT user_id) AS users'))->groupBy('platform')->pluck('users', 'platform');

        $counts = [
            'android_app' => (int) ($native['android'] ?? 0),
            'ios_app' => (int) ($native['ios'] ?? 0),
            'installed_web' => (int) ($others[UserClient::PWA] ?? 0),
            'phone_browser' => (int) ($others[UserClient::MOBILE_WEB] ?? 0),
            'desktop_browser' => (int) ($others[UserClient::DESKTOP_WEB] ?? 0),
            'other' => (int) $native->except(['android', 'ios'])->sum(),
        ];

        return collect(self::GROUPS)
            ->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label, 'users' => $counts[$key]])
            ->values()
            ->all();
    }

    /**
     * People active per day per kind of client, every day of the range, including days nobody was.
     *
     * @return list<array<string, mixed>>
     */
    private function series(CarbonImmutable $from, CarbonImmutable $today): array
    {
        $rows = DB::table('user_client_days')
            ->where('day', '>=', $from->toDateString())
            ->select('day', 'platform', 'os', DB::raw('COUNT(DISTINCT user_id) AS users'))
            ->groupBy('day', 'platform', 'os')
            ->get()
            ->groupBy(fn (object $row) => CarbonImmutable::parse($row->day)->toDateString());

        $everyone = DB::table('user_client_days')
            ->where('day', '>=', $from->toDateString())
            ->select('day', DB::raw('COUNT(DISTINCT user_id) AS users'))
            ->groupBy('day')
            ->pluck('users', 'day')
            ->mapWithKeys(fn ($users, $day) => [CarbonImmutable::parse($day)->toDateString() => (int) $users]);

        $points = [];
        for ($day = $from; $day->lessThanOrEqualTo($today); $day = $day->addDay()) {
            $key = $day->toDateString();
            $point = ['day' => $key, 'total' => $everyone[$key] ?? 0] + array_fill_keys(array_keys(self::GROUPS), 0);

            foreach ($rows->get($key, collect()) as $row) {
                $point[$this->group($row->platform, $row->os)] += (int) $row->users;
            }

            $points[] = $point;
        }

        return $points;
    }

    /**
     * Which app versions people are on, per system, from the latest sighting of each native client in the last 30 days.
     *
     * @return list<array<string, mixed>>
     */
    private function versions(): array
    {
        $rows = UserClient::query()
            ->where('platform', UserClient::NATIVE)
            ->where('last_seen_at', '>=', now()->subDays(30))
            ->toBase()
            ->select('os', 'app_version', DB::raw('COUNT(*) AS users'))
            ->groupBy('os', 'app_version')
            ->get();

        return $rows->groupBy('os')->map(function (Collection $group, string $os) {
            $known = $group->whereNotNull('app_version');
            $latest = $known->pluck('app_version')->reduce(fn (?string $best, string $v) => $best === null || version_compare($v, $best, '>') ? $v : $best);
            $total = (int) $group->sum('users');
            $onLatest = $latest === null ? 0 : (int) $known->where('app_version', $latest)->sum('users');

            return [
                'os' => $os,
                'label' => $os === 'ios' ? 'iOS' : ($os === 'android' ? 'Android' : ucfirst($os)),
                'users' => $total,
                'latest' => $latest,
                'on_latest' => $onLatest,
                'unknown' => (int) $group->whereNull('app_version')->sum('users'),
                'versions' => $known
                    ->sort(fn (object $a, object $b) => version_compare($b->app_version, $a->app_version))
                    ->map(fn (object $row) => ['version' => $row->app_version, 'users' => (int) $row->users, 'is_latest' => $row->app_version === $latest])
                    ->values()
                    ->all(),
            ];
        })->sortByDesc('users')->values()->all();
    }

    /**
     * People active in the range, by the role they hold. Someone with a role in two estates counts once per role.
     *
     * @return list<array{role: string, users: int}>
     */
    private function roles(CarbonImmutable $from): array
    {
        return DB::table('user_client_days AS d')
            ->join('model_has_roles AS mr', fn ($join) => $join->on('mr.model_id', '=', 'd.user_id')->where('mr.model_type', (new User)->getMorphClass()))
            ->join('roles AS r', 'r.id', '=', 'mr.role_id')
            ->where('d.day', '>=', $from->toDateString())
            ->select('r.name AS role', DB::raw('COUNT(DISTINCT d.user_id) AS users'))
            ->groupBy('r.name')
            ->orderByDesc('users')
            ->get()
            ->map(fn (object $row) => ['role' => (string) $row->role, 'users' => (int) $row->users])
            ->all();
    }

    /**
     * The estates doing best and worst, for the overview. Small estates are left out of the quiet list.
     *
     * @return array{busiest: list<array<string, mixed>>, quietest: list<array<string, mixed>>}
     */
    private function estateHighlights(string $range): array
    {
        $rows = $this->estateRows($range);

        return [
            'busiest' => $rows->sortBy([['active', 'desc'], ['name', 'asc']])->take(5)->values()->all(),
            'quietest' => $rows->where('members', '>=', self::QUIET_MIN_MEMBERS)->sortBy([['rate', 'asc'], ['members', 'desc'], ['name', 'asc']])->take(5)->values()->all(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function estateRows(string $range): Collection
    {
        $from = CarbonImmutable::today()->subDays((self::RANGES[$range] ?? 30) - 1)->toDateString();

        $active = DB::table('user_client_days')->where('day', '>=', $from)->select('user_id')->groupBy('user_id');
        $app = DB::table('user_client_days')->where('day', '>=', $from)->where('platform', UserClient::NATIVE)->select('user_id')->groupBy('user_id');

        return DB::table('estate_users_membership AS m')
            ->join('estates AS e', 'e.id', '=', 'm.estate_id')
            ->leftJoinSub($active, 'a', 'a.user_id', '=', 'm.user_id')
            ->leftJoinSub($app, 'n', 'n.user_id', '=', 'm.user_id')
            ->where('m.status', 'accepted')
            ->select(
                'e.id',
                'e.name',
                DB::raw('COUNT(DISTINCT m.user_id) AS members'),
                DB::raw('COUNT(DISTINCT a.user_id) AS active'),
                DB::raw('COUNT(DISTINCT n.user_id) AS app_users'),
            )
            ->groupBy('e.id', 'e.name')
            ->get()
            ->map(fn (object $row) => [
                'id' => (int) $row->id,
                'name' => (string) $row->name,
                'members' => (int) $row->members,
                'active' => (int) $row->active,
                'rate' => $row->members > 0 ? round($row->active / $row->members * 100, 1) : 0.0,
                'app_users' => (int) $row->app_users,
                'app_share' => $row->active > 0 ? round($row->app_users / $row->active * 100, 1) : null,
            ]);
    }

    /**
     * People with a session touched in the last few minutes, newest first. Null unless sessions are in the database.
     *
     * @return list<array<string, mixed>>|null
     */
    private function online(): ?array
    {
        if (config('session.driver') !== 'database') {
            return null;
        }

        $since = time() - self::ONLINE_WITHIN_SECONDS;

        $sessions = DB::table(config('session.table', 'sessions'))
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', $since)
            ->select('user_id', DB::raw('MAX(last_activity) AS last_activity'))
            ->groupBy('user_id')
            ->orderByDesc('last_activity')
            ->limit(25)
            ->get();

        if ($sessions->isEmpty()) {
            return [];
        }

        $ids = $sessions->pluck('user_id');
        $names = User::query()->whereIn('id', $ids)->pluck('name', 'id');
        $clients = UserClient::query()->whereIn('user_id', $ids)->orderBy('last_seen_at')->get()->groupBy('user_id')->map->last();
        $estates = DB::table('estate_users_membership AS m')
            ->join('estates AS e', 'e.id', '=', 'm.estate_id')
            ->whereIn('m.user_id', $ids)->where('m.status', 'accepted')
            ->orderBy('e.name')
            ->get(['m.user_id', 'e.name'])
            ->groupBy('user_id')
            ->map(fn (Collection $rows) => $rows->first()->name);

        return $sessions->map(function (object $session) use ($names, $clients, $estates) {
            $client = $clients->get($session->user_id);
            $last = CarbonImmutable::createFromTimestamp((int) $session->last_activity);

            return [
                'user_id' => (int) $session->user_id,
                'name' => (string) ($names[$session->user_id] ?? 'Unknown'),
                'estate' => $estates[$session->user_id] ?? null,
                'client' => $client ? $this->group($client->platform, $client->os) : null,
                'app_version' => $client?->app_version,
                'last_active_at' => $last->toIso8601String(),
                'last_active_human' => $last->diffForHumans(),
            ];
        })->all();
    }

    private function onlineCount(): ?int
    {
        if (config('session.driver') !== 'database') {
            return null;
        }

        return (int) DB::table(config('session.table', 'sessions'))
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', time() - self::ONLINE_WITHIN_SECONDS)
            ->distinct()->count('user_id');
    }

    /**
     * @return array{level: 'ok'|'attention'|'down', message: string}
     */
    private function health(?string $firstDay, int $yesterday, float $average, CarbonImmutable $today): array
    {
        if ($firstDay === null) {
            return ['level' => 'attention', 'message' => 'Nothing has been recorded yet. Figures appear as signed-in people use Kontrol.'];
        }

        // Yesterday against the average day of the week before it. Today is left out because it is only part of a day.
        if ($average >= 10 && $yesterday < $average * 0.7) {
            $drop = (int) round((1 - $yesterday / $average) * 100);

            return ['level' => 'attention', 'message' => "Yesterday was {$drop}% quieter than the week before it."];
        }

        $since = CarbonImmutable::parse($firstDay);
        if ($since->greaterThan($today->subDays(7))) {
            return ['level' => 'ok', 'message' => 'Tracking started '.$since->format('j M').', so the history is still short.'];
        }

        return ['level' => 'ok', 'message' => 'Usage is steady.'];
    }

    /** The average number of people active per day between two days, counting days nobody was as zero. */
    private function dailyActive(CarbonImmutable $from, CarbonImmutable $to): float
    {
        $total = DB::table('user_client_days')
            ->where('day', '>=', $from->toDateString())->where('day', '<=', $to->toDateString())
            ->select('day', DB::raw('COUNT(DISTINCT user_id) AS users'))->groupBy('day')->get()->sum('users');

        return $total / max(1, $from->diffInDays($to) + 1);
    }

    private function group(string $platform, string $os): string
    {
        return match ($platform) {
            UserClient::NATIVE => match ($os) {
                'ios' => 'ios_app',
                'android' => 'android_app',
                default => 'other',
            },
            UserClient::PWA => 'installed_web',
            UserClient::MOBILE_WEB => 'phone_browser',
            UserClient::DESKTOP_WEB => 'desktop_browser',
            default => 'other',
        };
    }
}
