<?php

use App\Models\JobRun;
use App\Support\QueueJobName;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

class JobHistoryOkJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void {}
}

class JobHistoryBoomJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $backoff = 0;

    public function handle(): void
    {
        throw new RuntimeException("Boom happened\nsecond line that must not be stored");
    }
}

beforeEach(function () {
    config(['queue.default' => 'database', 'queue.history.enabled' => true]);

    $this->zeus = fn () => $this->withSession([config('zeus.session_key') => true]);
    $this->work = fn () => $this->artisan('queue:work', ['--once' => true])->run();

    $this->run_ = fn (array $overrides = []) => JobRun::create([
        'job_uuid' => (string) Str::uuid(),
        'job_class' => 'App\Jobs\ProcessThing',
        'job_name' => 'ProcessThing',
        'queue' => 'default',
        'connection' => 'database',
        'attempt' => 1,
        'status' => 'succeeded',
        'started_at' => now(),
        'finished_at' => now(),
        'duration_ms' => 100,
        ...$overrides,
    ]);

    $this->queueRow = fn (array $overrides = []) => DB::table('jobs')->insert([
        'queue' => 'default',
        'payload' => '{}',
        'attempts' => 0,
        'reserved_at' => null,
        'available_at' => time() - 10,
        'created_at' => time() - 10,
        ...$overrides,
    ]);
});

// ---------- Recording: the whole point ----------

it('remembers a job that ran even though Laravel deletes its row from the queue the moment it succeeds', function () {
    dispatch(new JobHistoryOkJob);
    expect(DB::table('jobs')->count())->toBe(1);

    ($this->work)();

    expect(DB::table('jobs')->count())->toBe(0);

    $run = JobRun::sole();
    expect($run->job_name)->toBe('JobHistoryOkJob')
        ->and($run->status)->toBe('succeeded')
        ->and($run->attempt)->toBe(1)
        ->and($run->queue)->toBe('default')
        ->and($run->connection)->toBe('database')
        ->and($run->job_uuid)->not->toBeNull()
        ->and($run->finished_at)->not->toBeNull()
        ->and($run->duration_ms)->toBeGreaterThanOrEqual(0)
        ->and($run->error)->toBeNull();
});

it('records a failing job as retrying and then failed, keeping only the first line of the error', function () {
    dispatch(new JobHistoryBoomJob);

    ($this->work)();
    ($this->work)();

    $runs = JobRun::orderBy('attempt')->get();
    expect($runs)->toHaveCount(2)
        ->and($runs[0]->attempt)->toBe(1)->and($runs[0]->status)->toBe('retrying')
        ->and($runs[1]->attempt)->toBe(2)->and($runs[1]->status)->toBe('failed')
        ->and($runs[1]->error)->toBe('RuntimeException: Boom happened')
        ->and($runs[1]->error)->not->toContain('second line')
        ->and($runs[0]->job_uuid)->toBe($runs[1]->job_uuid)
        ->and(DB::table('failed_jobs')->where('uuid', $runs[1]->job_uuid)->exists())->toBeTrue();
});

it('never stores the job payload', function () {
    expect(Schema::hasColumn('job_runs', 'payload'))->toBeFalse();

    dispatch(new JobHistoryOkJob);
    ($this->work)();

    expect(json_encode(JobRun::sole()->getAttributes()))->not->toContain('commandName')->not->toContain('serialize');
});

it('records nothing when history is switched off', function () {
    config(['queue.history.enabled' => false]);

    dispatch(new JobHistoryOkJob);
    ($this->work)();

    expect(JobRun::count())->toBe(0)->and(DB::table('jobs')->count())->toBe(0);
});

it('lets the job run normally even when its history cannot be written', function () {
    Schema::drop('job_runs');

    dispatch(new JobHistoryOkJob);
    ($this->work)();

    expect(DB::table('jobs')->count())->toBe(0)->and(DB::table('failed_jobs')->count())->toBe(0);
});

// ---------- Naming ----------

it('names a queued notification by the notification inside it, and flags jobs that send messages', function () {
    $serialized = 'O:48:"Illuminate\Notifications\SendQueuedNotifications":3:{s:12:"notification";O:55:"App\Notifications\Admin\CollectionPublishedNotification":0:{}}';
    $payload = ['displayName' => 'Illuminate\Notifications\SendQueuedNotifications', 'data' => ['command' => $serialized]];

    expect(QueueJobName::identify($payload))->toBe(['display' => 'Illuminate\Notifications\SendQueuedNotifications', 'class' => 'App\Notifications\Admin\CollectionPublishedNotification'])
        ->and(QueueJobName::identify(json_encode(['displayName' => 'App\Jobs\Plain'])))->toBe(['display' => 'App\Jobs\Plain', 'class' => 'App\Jobs\Plain'])
        ->and(QueueJobName::identify('not json'))->toBe(['display' => 'Unknown job', 'class' => 'Unknown job'])
        ->and(QueueJobName::sendsMessages('Illuminate\Notifications\SendQueuedNotifications'))->toBeTrue()
        ->and(QueueJobName::sendsMessages('App\Jobs\Plain'))->toBeFalse();
});

// ---------- The page ----------

it('keeps the job history behind the Zeus session', function () {
    $this->get(route('zeus.job-history.index'))->assertRedirect(route('zeus.login'));
});

it('summarises the last 24 hours: counts, success rate and average time of the jobs that worked', function () {
    ($this->run_)(['duration_ms' => 100]);
    ($this->run_)(['duration_ms' => 300]);
    ($this->run_)(['status' => 'failed', 'duration_ms' => 50]);
    ($this->run_)(['status' => 'retrying', 'duration_ms' => 50]);
    ($this->run_)(['status' => 'running', 'finished_at' => null, 'duration_ms' => null]);
    ($this->run_)(['started_at' => now()->subHours(30)]); // too old to count

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/JobHistory/Index')
            ->where('overview.summary.ran', 4)
            ->where('overview.summary.succeeded', 2)
            ->where('overview.summary.failed', 1)
            ->where('overview.summary.retrying', 1)
            ->where('overview.summary.success_rate', 50)
            ->where('overview.summary.avg_duration_ms', 200)
        );
});

it('reports what is waiting in the queue right now, and flags a stalled worker', function () {
    ($this->queueRow)(['available_at' => time() - 20]);
    ($this->queueRow)(['available_at' => time() - 600]);          // due for ten minutes: nobody is picking it up
    ($this->queueRow)(['available_at' => time() + 3600]);          // scheduled for later
    ($this->queueRow)(['reserved_at' => time() - 5, 'available_at' => time() - 5]); // running now

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page
            ->where('overview.summary.queue.waiting', 2)
            ->where('overview.summary.queue.scheduled', 1)
            ->where('overview.summary.queue.running', 1)
            ->where('overview.summary.queue.oldest_waiting_seconds', fn ($s) => $s >= 599 && $s <= 605)
            ->where('overview.summary.queue.stalled', true)
        );
});

it('does not call the queue stalled when the oldest waiting job is recent, or the queue is empty', function () {
    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page->where('overview.summary.queue.waiting', 0)->where('overview.summary.queue.stalled', false)->where('overview.summary.queue.oldest_waiting_seconds', fn ($s) => $s === null));

    ($this->queueRow)(['available_at' => time() - 30]);

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page->where('overview.summary.queue.waiting', 1)->where('overview.summary.queue.stalled', false));
});

it('has no queue figures when the queue is not the database one', function () {
    config(['queue.default' => 'sync']);

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page->where('overview.summary.queue', fn ($q) => $q === null));
});

it('lists runs newest first and tells a job still running from one whose worker stopped', function () {
    ($this->run_)(['job_name' => 'Older', 'started_at' => now()->subHours(2)]);
    ($this->run_)(['job_name' => 'Newest', 'started_at' => now()->subMinute()]);
    ($this->run_)(['job_name' => 'Busy', 'status' => 'running', 'finished_at' => null, 'duration_ms' => null, 'started_at' => now()->subMinutes(2)]);
    ($this->run_)(['job_name' => 'Abandoned', 'status' => 'running', 'finished_at' => null, 'duration_ms' => null, 'started_at' => now()->subMinutes(40)]);

    ($this->zeus)()->get(route('zeus.job-history.index', ['tab' => 'runs']))
        ->assertInertia(fn ($page) => $page
            ->where('runs.data', fn ($rows) => collect($rows)->pluck('job')->all() === ['Newest', 'Busy', 'Abandoned', 'Older']
                && collect($rows)->firstWhere('job', 'Busy')['status'] === 'running'
                && collect($rows)->firstWhere('job', 'Abandoned')['status'] === 'lost')
        );

    ($this->zeus)()->get(route('zeus.job-history.index', ['tab' => 'runs', 'status' => 'lost']))
        ->assertInertia(fn ($page) => $page->where('runs.data', fn ($rows) => collect($rows)->pluck('job')->all() === ['Abandoned']));
    ($this->zeus)()->get(route('zeus.job-history.index', ['tab' => 'runs', 'status' => 'running']))
        ->assertInertia(fn ($page) => $page->where('runs.data', fn ($rows) => collect($rows)->pluck('job')->all() === ['Busy']));
});

it('filters by status and searches by job or error, treating wildcards as plain text', function () {
    ($this->run_)(['job_name' => 'SendInvoice', 'status' => 'failed', 'error' => 'RuntimeException: SMTP timed out']);
    ($this->run_)(['job_name' => 'Recalculate', 'status' => 'failed', 'error' => 'LogicException: 100% broken']);
    ($this->run_)(['job_name' => 'Fine', 'status' => 'succeeded']);

    $count = fn (array $query) => ($this->zeus)()->get(route('zeus.job-history.index', [...$query, 'tab' => 'runs']))->viewData('page')['props']['runs']['total'];

    expect($count([]))->toBe(3)
        ->and($count(['status' => 'failed']))->toBe(2)
        ->and($count(['status' => 'succeeded']))->toBe(1)
        ->and($count(['search' => 'SendInvoice']))->toBe(1)
        ->and($count(['search' => 'SMTP']))->toBe(1)
        ->and($count(['search' => '100%']))->toBe(1)
        ->and($count(['search' => '%']))->toBe(1)
        ->and($count(['status' => 'failed', 'search' => 'Recalculate']))->toBe(1);

    ($this->zeus)()->get(route('zeus.job-history.index', ['status' => 'exploded']))->assertSessionHasErrors('status');
});

it('pages through many runs without repeating one', function () {
    foreach (range(1, 30) as $i) {
        ($this->run_)(['job_name' => "Job{$i}", 'started_at' => now()->subSeconds(100 - $i)]);
    }

    $page = fn (int $n) => collect(($this->zeus)()->get(route('zeus.job-history.index', ['tab' => 'runs', 'page' => $n]))->viewData('page')['props']['runs']['data'])->pluck('id');

    expect($page(1))->toHaveCount(25)->and($page(2))->toHaveCount(5)->and($page(1)->merge($page(2))->unique())->toHaveCount(30);
});

it('gives a failed run the job id so it can be found on the Failed Jobs page', function () {
    $run = ($this->run_)(['status' => 'failed', 'error' => 'RuntimeException: x']);

    ($this->zeus)()->get(route('zeus.job-history.index', ['tab' => 'runs']))
        ->assertInertia(fn ($page) => $page->where('runs.data.0.uuid', $run->job_uuid)->where('runs.data.0.status', 'failed'));
});

// ---------- Clean-up ----------

it('clears history older than the retention period and keeps the rest', function () {
    config(['queue.history.retention_days' => 14]);
    $old = ($this->run_)(['started_at' => now()->subDays(15)]);
    $edge = ($this->run_)(['started_at' => now()->subDays(13)]);
    $new = ($this->run_)();

    $this->artisan('model:prune', ['--model' => [JobRun::class]])->assertExitCode(0);

    expect(JobRun::pluck('id')->sort()->values()->all())->toBe(collect([$edge->id, $new->id])->sort()->values()->all())
        ->and(JobRun::find($old->id))->toBeNull();
});

it('prunes job history on the daily schedule', function () {
    $events = collect(app(Schedule::class)->events())->map(fn ($e) => $e->command)->implode("\n");

    expect($events)->toContain('model:prune')->and($events)->toContain('JobRun');
});

// ---------- The operations view ----------

it('records which worker ran an attempt', function () {
    putenv('SUPERVISOR_PROCESS_NAME=worker-heavy_00');

    dispatch(new JobHistoryOkJob);
    ($this->work)();

    putenv('SUPERVISOR_PROCESS_NAME');

    expect(JobRun::query()->value('worker'))->toBe('worker-heavy_00');
});

it('charts the chosen range in bars, empty ones included, oldest first', function () {
    ($this->run_)(['started_at' => now()->subMinutes(2), 'duration_ms' => 200]);
    ($this->run_)(['started_at' => now()->subMinutes(3), 'duration_ms' => 400]);
    ($this->run_)(['status' => 'failed', 'started_at' => now()->subMinutes(2)]);
    ($this->run_)(['started_at' => now()->subHours(3)]);

    $series = fn (string $range) => ($this->zeus)()->get(route('zeus.job-history.index', ['range' => $range]))->viewData('page')['props']['overview']['series'];

    expect($series('1h'))->toHaveCount(60)
        ->and(collect($series('1h'))->sum('succeeded'))->toBe(2)   // the 3-hour-old run is outside the hour
        ->and(collect($series('1h'))->sum('failed'))->toBe(1)
        ->and($series('24h'))->toHaveCount(24)
        ->and(collect($series('24h'))->sum('succeeded'))->toBe(3)
        ->and($series('7d'))->toHaveCount(7)
        ->and(collect($series('24h'))->pluck('at')->all())->toBe(collect($series('24h'))->pluck('at')->sort()->values()->all());
});

it('adds the figures of a range, not always the last 24 hours', function () {
    ($this->run_)(['started_at' => now()->subMinutes(10)]);
    ($this->run_)(['started_at' => now()->subHours(5)]);
    ($this->run_)(['started_at' => now()->subDays(3)]);

    $ran = fn (string $range) => ($this->zeus)()->get(route('zeus.job-history.index', ['range' => $range]))->viewData('page')['props']['overview']['summary']['ran'];

    expect($ran('1h'))->toBe(1)->and($ran('24h'))->toBe(2)->and($ran('7d'))->toBe(3);

    ($this->zeus)()->get(route('zeus.job-history.index', ['range' => 'forever']))->assertSessionHasErrors('range');
});

it('splits the queue by queue name, including queues the app does not define', function () {
    ($this->queueRow)(['queue' => 'critical', 'available_at' => time() - 10]);
    ($this->queueRow)(['queue' => 'heavy', 'available_at' => time() - 20]);
    ($this->queueRow)(['queue' => 'heavy', 'available_at' => time() + 600]);
    ($this->queueRow)(['queue' => 'ghost', 'available_at' => time() - 10]);
    ($this->run_)(['queue' => 'heavy', 'duration_ms' => 3000]);
    ($this->run_)(['queue' => 'heavy', 'status' => 'failed']);

    $queues = collect(($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['props']['overview']['queues'])->keyBy('name');

    expect($queues->keys()->all())->toContain('critical', 'payments', 'mail', 'heavy', 'default', 'ghost')
        ->and($queues['critical']['waiting'])->toBe(1)
        ->and($queues['heavy']['waiting'])->toBe(1)
        ->and($queues['heavy']['scheduled'])->toBe(1)
        ->and($queues['heavy']['ran'])->toBe(2)
        ->and($queues['heavy']['failed'])->toBe(1)
        ->and($queues['heavy']['avg_duration_ms'])->toBe(3000)
        ->and($queues['mail']['waiting'])->toBe(0)
        ->and($queues['ghost']['known'])->toBeFalse()
        ->and($queues['heavy']['known'])->toBeTrue();
});

it('says whether to worry: fine, a queue nobody reads, a stuck queue, or too many failures', function () {
    $health = fn () => ($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['props']['overview']['health'];

    expect($health()['level'])->toBe('ok');

    ($this->queueRow)(['queue' => 'ghost', 'available_at' => time() - 10]);
    expect($health()['level'])->toBe('attention')->and($health()['message'])->toContain('ghost');

    DB::table('jobs')->delete();
    foreach (range(1, 2) as $i) {
        ($this->run_)();
    }
    foreach (range(1, 2) as $i) {
        ($this->run_)(['status' => 'failed']);
    }
    expect($health()['level'])->toBe('attention')->and($health()['message'])->toContain('failed');

    ($this->queueRow)(['queue' => 'mail', 'available_at' => time() - 900]);
    expect($health()['level'])->toBe('down')->and($health()['message'])->toContain('mail');
});

it('lists the workers seen, what they ran, and whether one is busy now', function () {
    ($this->run_)(['worker' => 'worker-heavy_00', 'queue' => 'heavy']);
    ($this->run_)(['worker' => 'worker-heavy_00', 'queue' => 'heavy', 'status' => 'failed']);
    ($this->run_)(['worker' => 'worker-heavy_00', 'queue' => 'heavy', 'status' => 'running', 'finished_at' => null, 'duration_ms' => null]);
    ($this->run_)(['worker' => 'worker-mail_00', 'queue' => 'mail', 'started_at' => now()->subHours(2)]);
    ($this->run_)(['worker' => null]);

    $workers = collect(($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['props']['overview']['workers'])->keyBy('name');

    expect($workers->keys()->all())->toBe(['worker-heavy_00', 'worker-mail_00'])
        ->and($workers['worker-heavy_00']['runs'])->toBe(2)
        ->and($workers['worker-heavy_00']['failed'])->toBe(1)
        ->and($workers['worker-heavy_00']['busy'])->toBeTrue()
        ->and($workers['worker-heavy_00']['queues'])->toBe(['heavy'])
        ->and($workers['worker-mail_00']['busy'])->toBeFalse();
});

it('ranks the slowest jobs by average time, and the flakiest by how often they fail', function () {
    ($this->run_)(['job_name' => 'Slow', 'duration_ms' => 9000]);
    ($this->run_)(['job_name' => 'Slow', 'duration_ms' => 3000]);
    ($this->run_)(['job_name' => 'Quick', 'duration_ms' => 20]);
    ($this->run_)(['job_name' => 'Flaky']);
    ($this->run_)(['job_name' => 'Flaky', 'status' => 'failed']);
    ($this->run_)(['job_name' => 'Solid']);

    $overview = ($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['props']['overview'];

    expect(collect($overview['slowest'])->first())->toMatchArray(['job' => 'Slow', 'runs' => 2, 'avg_duration_ms' => 6000, 'max_duration_ms' => 9000])
        ->and(collect($overview['flakiest'])->pluck('job')->all())->toBe(['Flaky'])
        ->and($overview['flakiest'][0]['failure_rate'])->toBe(50.0);
});

it('filters runs by queue and pages by 25, 50 or 100', function () {
    ($this->run_)(['job_name' => 'OnHeavy', 'queue' => 'heavy']);
    ($this->run_)(['job_name' => 'OnMail', 'queue' => 'mail']);
    foreach (range(1, 60) as $i) {
        ($this->run_)(['started_at' => now()->subSeconds(500 + $i)]);
    }

    $runs = fn (array $query) => ($this->zeus)()->get(route('zeus.job-history.index', [...$query, 'tab' => 'runs']))->viewData('page')['props']['runs'];

    expect(collect($runs(['queue' => 'heavy'])['data'])->pluck('job')->all())->toBe(['OnHeavy'])
        ->and($runs([])['data'])->toHaveCount(25)
        ->and($runs(['per_page' => 50])['data'])->toHaveCount(50)
        ->and($runs(['per_page' => 100])['data'])->toHaveCount(62);

    ($this->zeus)()->get(route('zeus.job-history.index', ['per_page' => 7]))->assertSessionHasErrors('per_page');
});

it('answers a live refresh of only the figures and the first page of runs', function () {
    ($this->run_)();

    $version = ($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['version'];

    ($this->zeus)()->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Inertia-Partial-Component' => 'Zeus/JobHistory/Index',
        'X-Inertia-Partial-Data' => 'overview,runs',
    ])->get(route('zeus.job-history.index', ['tab' => 'runs']))
        ->assertOk()
        ->assertJsonPath('props.overview.summary.ran', 1)
        ->assertJsonMissingPath('props.recording');
});

it('reuses the figures for a few seconds when caching is on, and not otherwise', function () {
    config(['queue.history.overview_cache_seconds' => 30]);
    Cache::flush();
    $ran = fn () => ($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['props']['overview']['summary']['ran'];

    ($this->run_)();
    expect($ran())->toBe(1);

    ($this->run_)();
    expect($ran())->toBe(1);

    config(['queue.history.overview_cache_seconds' => 0]);
    expect($ran())->toBe(2);
});

// ---------- Clearing ----------

it('counts what each clear option would remove, never counting a run still going', function () {
    ($this->run_)();
    ($this->run_)();
    ($this->run_)(['status' => 'failed']);
    ($this->run_)(['started_at' => now()->subDays(9)]);
    ($this->run_)(['status' => 'running', 'finished_at' => null, 'duration_ms' => null, 'started_at' => now()->subMinute()]);
    ($this->run_)(['status' => 'running', 'finished_at' => null, 'duration_ms' => null, 'started_at' => now()->subHour()]); // lost: counts as history

    $clearable = ($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['props']['overview']['clearable'];

    expect($clearable)->toBe(['succeeded' => 3, 'older' => 1, 'all' => 5]);
});

it('clears only succeeded runs and leaves failures to investigate', function () {
    ($this->run_)();
    ($this->run_)();
    $failed = ($this->run_)(['status' => 'failed']);

    ($this->zeus)()->post(route('zeus.job-history.clear'), ['scope' => 'succeeded'])->assertRedirect()->assertSessionHas('success');

    expect(JobRun::query()->pluck('id')->all())->toBe([$failed->id]);
});

it('clears runs older than a week, and nothing newer', function () {
    $recent = ($this->run_)(['started_at' => now()->subDays(2)]);
    ($this->run_)(['started_at' => now()->subDays(8)]);
    ($this->run_)(['status' => 'failed', 'started_at' => now()->subDays(10)]);

    ($this->zeus)()->post(route('zeus.job-history.clear'), ['scope' => 'older'])->assertRedirect();

    expect(JobRun::query()->pluck('id')->all())->toBe([$recent->id]);
});

it('clears everything except a run that is still going, and leaves the queue and failed jobs alone', function () {
    ($this->run_)();
    ($this->run_)(['status' => 'failed']);
    $running = ($this->run_)(['status' => 'running', 'finished_at' => null, 'duration_ms' => null, 'started_at' => now()->subSeconds(30)]);
    ($this->queueRow)(['available_at' => time()]);
    DB::table('failed_jobs')->insert(['uuid' => (string) Str::uuid(), 'connection' => 'database', 'queue' => 'default', 'payload' => '{}', 'exception' => 'x', 'failed_at' => now()]);

    ($this->zeus)()->post(route('zeus.job-history.clear'), ['scope' => 'all'])->assertRedirect();

    expect(JobRun::query()->pluck('id')->all())->toBe([$running->id])
        ->and(DB::table('jobs')->count())->toBe(1)
        ->and(DB::table('failed_jobs')->count())->toBe(1);
});

it('records who cleared what in the activity log, and refuses anything unknown', function () {
    ($this->run_)();
    ($this->run_)();

    ($this->zeus)()->post(route('zeus.job-history.clear'), ['scope' => 'all']);

    $entry = Activity::query()->where('description', 'Job history cleared')->latest('id')->first();
    expect($entry->log_name)->toBe('zeus')
        ->and($entry->properties->all())->toMatchArray(['actor' => 'zeus', 'scope' => 'all', 'deleted' => 2]);

    ($this->zeus)()->post(route('zeus.job-history.clear'), ['scope' => 'everything'])->assertSessionHasErrors('scope');
    ($this->zeus)()->post(route('zeus.job-history.clear'))->assertSessionHasErrors('scope');
});

it('keeps clearing behind the Zeus session', function () {
    ($this->run_)();

    $this->post(route('zeus.job-history.clear'), ['scope' => 'all'])->assertRedirect(route('zeus.login'));

    expect(JobRun::query()->count())->toBe(1);
});

it('shows a cleared history straight away even when figures are cached', function () {
    config(['queue.history.overview_cache_seconds' => 60]);
    Cache::flush();
    ($this->run_)();

    $ran = fn () => ($this->zeus)()->get(route('zeus.job-history.index'))->viewData('page')['props']['overview']['summary']['ran'];
    expect($ran())->toBe(1);

    ($this->zeus)()->post(route('zeus.job-history.clear'), ['scope' => 'all']);

    expect($ran())->toBe(0);
});

it('opens on the overview without reading the list, and reads it only on the runs tab', function () {
    ($this->run_)();

    $props = fn (array $query) => ($this->zeus)()->get(route('zeus.job-history.index', $query))->viewData('page')['props'];

    expect($props([])['runs'] ?? null)->toBeNull()
        ->and($props([])['filters']['tab'])->toBe('overview')
        ->and($props(['tab' => 'runs'])['runs']['total'])->toBe(1);

    ($this->zeus)()->get(route('zeus.job-history.index', ['tab' => 'nonsense']))->assertSessionHasErrors('tab');
});
