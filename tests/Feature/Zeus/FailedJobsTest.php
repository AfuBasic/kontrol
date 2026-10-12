<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

beforeEach(function () {
    // The default test queue runs jobs the moment they are pushed. Retried jobs here must only be queued.
    config(['queue.default' => 'database']);

    $this->zeus = fn () => $this->withSession([config('zeus.session_key') => true]);

    $this->failJob = function (array $overrides = []): string {
        $uuid = $overrides['uuid'] ?? (string) Str::uuid();
        $class = $overrides['class'] ?? 'App\Jobs\ProcessThing';
        $payload = $overrides['payload'] ?? json_encode([
            'uuid' => $uuid,
            'displayName' => $class,
            'job' => 'Illuminate\Queue\CallQueuedHandler@call',
            'maxTries' => 3,
            'attempts' => 3,
            'data' => ['commandName' => $class, 'command' => 'O:'.strlen($class).':"'.$class.'":0:{}'],
        ]);

        DB::table('failed_jobs')->insert([
            'uuid' => $uuid,
            'connection' => 'database',
            'queue' => $overrides['queue'] ?? 'default',
            'payload' => $payload,
            'exception' => $overrides['exception'] ?? "RuntimeException: Something broke in /app/app/Jobs/ProcessThing.php:42\nStack trace:\n#0 {main}",
            'failed_at' => $overrides['failed_at'] ?? now(),
        ]);

        return $uuid;
    };
});

// ---------- Only Zeus gets in ----------

it('keeps every failed jobs route behind the Zeus session', function () {
    $uuid = ($this->failJob)();

    $this->get(route('zeus.failed-jobs.index'))->assertRedirect(route('zeus.login'));
    $this->get(route('zeus.failed-jobs.show', $uuid))->assertRedirect(route('zeus.login'));
    $this->post(route('zeus.failed-jobs.retry'), ['ids' => [$uuid]])->assertRedirect(route('zeus.login'));
    $this->post(route('zeus.failed-jobs.forget'), ['ids' => [$uuid]])->assertRedirect(route('zeus.login'));

    expect(DB::table('failed_jobs')->count())->toBe(1)->and(DB::table('jobs')->count())->toBe(0);
});

// ---------- Listing ----------

it('lists failed jobs newest first with readable names, errors and a summary', function () {
    ($this->failJob)(['class' => 'App\Jobs\Older', 'failed_at' => now()->subDays(3)]);
    ($this->failJob)(['class' => 'App\Jobs\Newest', 'failed_at' => now()->subMinute(), 'queue' => 'emails']);
    ($this->failJob)(['class' => 'App\Jobs\Middle', 'failed_at' => now()->subHours(30)]);

    ($this->zeus)()->get(route('zeus.failed-jobs.index'))
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/FailedJobs/Index')
            ->where('jobs.data', fn ($rows) => collect($rows)->pluck('job')->all() === ['Newest', 'Middle', 'Older'])
            ->where('jobs.data.0.queue', 'emails')
            ->where('jobs.data.0.error', 'RuntimeException: Something broke in /app/app/Jobs/ProcessThing.php:42')
            ->where('jobs.data.0.exception_class', 'RuntimeException')
            ->where('overview.summary.total', 3)
            ->where('overview.summary.last_24h', 1)
            ->where('overview.summary.oldest_at', fn ($v) => $v !== null)
        );
});

it('names a queued notification by the notification inside it, and warns that retrying repeats the message', function () {
    $serialized = 'O:48:"Illuminate\Notifications\SendQueuedNotifications":3:{s:11:"notifiables";O:1:"x";s:12:"notification";O:55:"App\Notifications\Admin\CollectionPublishedNotification":2:{s:10:"collection";N;}}';
    ($this->failJob)([
        'class' => 'Illuminate\Notifications\SendQueuedNotifications',
        'payload' => json_encode(['displayName' => 'Illuminate\Notifications\SendQueuedNotifications', 'data' => ['command' => $serialized]]),
    ]);
    ($this->failJob)(['class' => 'App\Jobs\RecalculateThing']);

    ($this->zeus)()->get(route('zeus.failed-jobs.index'))
        ->assertInertia(fn ($page) => $page
            ->where('jobs.data', function ($rows) {
                $byName = collect($rows)->keyBy('job');

                return $byName->has('CollectionPublishedNotification')
                    && $byName['CollectionPublishedNotification']['repeats_messages'] === true
                    && $byName['CollectionPublishedNotification']['queued_as'] === 'SendQueuedNotifications'
                    && $byName['RecalculateThing']['repeats_messages'] === false;
            })
        );
});

it('searches by job name or error, treating wildcards as plain text', function () {
    ($this->failJob)(['class' => 'App\Jobs\SendInvoice', 'exception' => "RuntimeException: SMTP timed out\n#0"]);
    ($this->failJob)(['class' => 'App\Jobs\Other', 'exception' => "LogicException: 100% broken\n#0"]);
    ($this->failJob)(['class' => 'App\Jobs\Third', 'exception' => "LogicException: fine\n#0"]);

    $count = fn (string $search) => ($this->zeus)()->get(route('zeus.failed-jobs.index', ['search' => $search]))->viewData('page')['props']['jobs']['total'];

    expect($count('SendInvoice'))->toBe(1)
        ->and($count('SMTP'))->toBe(1)
        ->and($count('100%'))->toBe(1)
        ->and($count('%'))->toBe(1)
        ->and($count('nothing matches this'))->toBe(0);
});

it('pages through many failed jobs without repeating one', function () {
    foreach (range(1, 30) as $i) {
        ($this->failJob)(['class' => "App\\Jobs\\Job{$i}", 'failed_at' => now()->subSeconds(60 - $i)]);
    }

    $page = fn (int $n) => collect(($this->zeus)()->get(route('zeus.failed-jobs.index', ['page' => $n]))->viewData('page')['props']['jobs']['data'])->pluck('uuid');

    expect($page(1))->toHaveCount(25)
        ->and($page(2))->toHaveCount(5)
        ->and($page(1)->merge($page(2))->unique())->toHaveCount(30);
});

it('shows one failed job with its full error, and 404s for one that is gone', function () {
    $uuid = ($this->failJob)(['exception' => "RuntimeException: Boom\nStack trace:\n#0 /app/x.php(1): doThing()\n#1 {main}"]);

    ($this->zeus)()->getJson(route('zeus.failed-jobs.show', $uuid))
        ->assertOk()
        ->assertJsonPath('uuid', $uuid)
        ->assertJsonPath('job', 'ProcessThing')
        ->assertJsonPath('exception', "RuntimeException: Boom\nStack trace:\n#0 /app/x.php(1): doThing()\n#1 {main}");

    ($this->zeus)()->getJson(route('zeus.failed-jobs.show', (string) Str::uuid()))->assertNotFound();
});

// ---------- Retry ----------

it('puts selected jobs back on the queue and takes them off the failed list, leaving the others alone', function () {
    $a = ($this->failJob)(['class' => 'App\Jobs\A']);
    $b = ($this->failJob)(['class' => 'App\Jobs\B']);
    $untouched = ($this->failJob)(['class' => 'App\Jobs\C']);

    ($this->zeus)()->post(route('zeus.failed-jobs.retry'), ['ids' => [$a, $b]])
        ->assertSessionHas('success', 'Put 2 jobs back on the queue.');

    expect(DB::table('jobs')->count())->toBe(2)
        ->and(DB::table('failed_jobs')->pluck('uuid')->all())->toBe([$untouched]);
});

it('says so plainly when the chosen jobs are already gone, and queues nothing', function () {
    ($this->zeus)()->post(route('zeus.failed-jobs.retry'), ['ids' => [(string) Str::uuid()]])
        ->assertSessionHas('error');

    expect(DB::table('jobs')->count())->toBe(0);
});

it('logs who retried which jobs', function () {
    $uuid = ($this->failJob)(['class' => 'App\Jobs\Logged']);

    ($this->zeus)()->post(route('zeus.failed-jobs.retry'), ['ids' => [$uuid]]);

    $log = Activity::where('description', 'Failed jobs retried')->first();
    expect($log)->not->toBeNull()
        ->and($log->getExtraProperty('actor'))->toBe('zeus')
        ->and($log->getExtraProperty('jobs'))->toBe([['uuid' => $uuid, 'job' => 'App\Jobs\Logged']]);
});

// ---------- Forget ----------

it('removes jobs from the failed list without queueing them, and logs it', function () {
    $gone = ($this->failJob)(['class' => 'App\Jobs\Gone']);
    $kept = ($this->failJob)();

    ($this->zeus)()->post(route('zeus.failed-jobs.forget'), ['ids' => [$gone]])
        ->assertSessionHas('success', 'Removed 1 failed job.');

    expect(DB::table('failed_jobs')->pluck('uuid')->all())->toBe([$kept])
        ->and(DB::table('jobs')->count())->toBe(0)
        ->and(Activity::where('description', 'Failed jobs forgotten')->exists())->toBeTrue();
});

// ---------- Validation ----------

it('rejects an empty, malformed or oversized selection', function (array $ids) {
    ($this->failJob)();

    ($this->zeus)()->post(route('zeus.failed-jobs.retry'), ['ids' => $ids])->assertSessionHasErrors();
    ($this->zeus)()->post(route('zeus.failed-jobs.forget'), ['ids' => $ids])->assertSessionHasErrors();

    expect(DB::table('failed_jobs')->count())->toBe(1)->and(DB::table('jobs')->count())->toBe(0);
})->with([
    'nothing chosen' => [[]],
    'not a uuid' => [['1; DROP TABLE failed_jobs']],
    'too many' => [fn () => array_map(fn () => (string) Str::uuid(), range(1, 101))],
]);

it('prunes old failed jobs on a schedule', function () {
    $events = collect(app(Schedule::class)->events())->pluck('command')->implode("\n");

    expect($events)->toContain('queue:prune-failed');
});

// ---------- The metrics ----------

it('counts failures in the chosen range and the range before it, so a trend can be shown', function () {
    ($this->failJob)(['failed_at' => now()->subHours(2)]);
    ($this->failJob)(['failed_at' => now()->subHours(30)]);
    ($this->failJob)(['failed_at' => now()->subDays(3)]);
    ($this->failJob)(['failed_at' => now()->subDays(10)]);

    $summary = fn (string $range) => ($this->zeus)()->get(route('zeus.failed-jobs.index', ['range' => $range]))->viewData('page')['props']['overview']['summary'];

    expect($summary('24h'))->toMatchArray(['total' => 4, 'in_range' => 1, 'before_range' => 1])
        ->and($summary('7d'))->toMatchArray(['in_range' => 3, 'before_range' => 1])
        ->and($summary('30d')['in_range'])->toBe(4);

    ($this->zeus)()->get(route('zeus.failed-jobs.index', ['range' => 'forever']))->assertSessionHasErrors('range');
});

it('charts failures per bar, empty bars included, oldest first', function () {
    ($this->failJob)(['failed_at' => now()->subMinutes(5)]);
    ($this->failJob)(['failed_at' => now()->subMinutes(6)]);
    ($this->failJob)(['failed_at' => now()->subDays(2)]);

    $series = fn (string $range) => ($this->zeus)()->get(route('zeus.failed-jobs.index', ['range' => $range]))->viewData('page')['props']['overview']['series'];

    expect($series('24h'))->toHaveCount(24)
        ->and(collect($series('24h'))->sum('failed'))->toBe(2)
        ->and($series('7d'))->toHaveCount(7)
        ->and(collect($series('7d'))->sum('failed'))->toBe(3)
        ->and($series('30d'))->toHaveCount(30)
        ->and(collect($series('7d'))->pluck('at')->all())->toBe(collect($series('7d'))->pluck('at')->sort()->values()->all());
});

it('groups failures by what broke, biggest first, and flags causes that message people', function () {
    foreach (range(1, 3) as $i) {
        ($this->failJob)(['class' => 'App\Jobs\ChargeThing', 'exception' => "GuzzleHttp\\Exception\\ConnectException: timed out {$i}\n#0 {main}"]);
    }
    ($this->failJob)(['class' => 'App\Jobs\ChargeThing', 'exception' => "RuntimeException: bad card\n#0 {main}"]);
    ($this->failJob)(['class' => 'App\Jobs\SendSmsAlert', 'queue' => 'critical', 'exception' => "RuntimeException: sms down\n#0 {main}"]);

    $overview = ($this->zeus)()->get(route('zeus.failed-jobs.index'))->viewData('page')['props']['overview'];
    $causes = collect($overview['causes']);

    expect($causes)->toHaveCount(3)
        ->and($causes[0])->toMatchArray(['job' => 'ChargeThing', 'count' => 3, 'exception_class' => 'GuzzleHttp\Exception\ConnectException', 'repeats_messages' => false])
        ->and($causes->firstWhere('job', 'SendSmsAlert'))->toMatchArray(['count' => 1, 'repeats_messages' => true, 'queues' => ['critical']])
        ->and($overview['summary']['repeat_risk'])->toBe(1)
        ->and(collect($overview['queues'])->pluck('count', 'name')->all())->toBe(['default' => 4, 'critical' => 1]);
});

it('names a queued notification by the notification inside it when grouping', function () {
    ($this->failJob)([
        'payload' => json_encode([
            'uuid' => (string) Str::uuid(),
            'displayName' => 'Illuminate\Notifications\SendQueuedNotifications',
            'data' => ['command' => 'O:48:"Illuminate\Notifications\SendQueuedNotifications":1:{s:12:"notification";O:35:"App\Notifications\InvoicePaidNotice":0:{}}'],
        ]),
    ]);

    expect(($this->zeus)()->get(route('zeus.failed-jobs.index'))->viewData('page')['props']['overview']['causes'][0]['job'])->toBe('InvoicePaidNotice');
});

it('says whether to worry: fine, waiting for a decision, failing now, or failing in a burst', function () {
    $health = fn () => ($this->zeus)()->get(route('zeus.failed-jobs.index'))->viewData('page')['props']['overview']['health'];

    expect($health()['level'])->toBe('ok');

    ($this->failJob)(['failed_at' => now()->subDays(2)]);
    expect($health()['level'])->toBe('attention')->and($health()['message'])->toContain('waiting for a decision');

    ($this->failJob)(['failed_at' => now()->subMinutes(5)]);
    expect($health()['level'])->toBe('attention')->and($health()['message'])->toContain('last hour');

    foreach (range(1, 9) as $i) {
        ($this->failJob)(['failed_at' => now()->subMinutes(10)]);
    }
    expect($health()['level'])->toBe('down');
});

it('filters the list by queue and pages by 25, 50 or 100', function () {
    foreach (range(1, 60) as $i) {
        ($this->failJob)(['queue' => $i <= 3 ? 'critical' : 'default', 'failed_at' => now()->subMinutes($i)]);
    }

    $jobs = fn (array $query) => ($this->zeus)()->get(route('zeus.failed-jobs.index', $query))->viewData('page')['props']['jobs'];

    expect($jobs(['queue' => 'critical'])['total'])->toBe(3)
        ->and($jobs([])['data'])->toHaveCount(25)
        ->and($jobs(['per_page' => 50])['data'])->toHaveCount(50)
        ->and($jobs(['per_page' => 100])['data'])->toHaveCount(60);

    ($this->zeus)()->get(route('zeus.failed-jobs.index', ['per_page' => 7]))->assertSessionHasErrors('per_page');
});

it('answers a live refresh of only the figures and the list', function () {
    ($this->failJob)();
    $version = ($this->zeus)()->get(route('zeus.failed-jobs.index'))->viewData('page')['version'];

    ($this->zeus)()->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Inertia-Partial-Component' => 'Zeus/FailedJobs/Index',
        'X-Inertia-Partial-Data' => 'overview,jobs',
    ])->get(route('zeus.failed-jobs.index'))
        ->assertOk()
        ->assertJsonPath('props.overview.summary.total', 1)
        ->assertJsonMissingPath('props.limits');
});

it('shows a retry or forget in the figures straight away even when they are cached', function () {
    config(['queue.history.overview_cache_seconds' => 60]);
    Cache::flush();
    $uuid = ($this->failJob)();

    $total = fn () => ($this->zeus)()->get(route('zeus.failed-jobs.index'))->viewData('page')['props']['overview']['summary']['total'];
    expect($total())->toBe(1);

    ($this->zeus)()->post(route('zeus.failed-jobs.forget'), ['ids' => [$uuid]]);

    expect($total())->toBe(0);
});
