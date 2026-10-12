<?php

use App\Models\JobRun;
use App\Support\QueueJobName;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

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
            ->where('summary.ran', 4)
            ->where('summary.succeeded', 2)
            ->where('summary.failed', 1)
            ->where('summary.retrying', 1)
            ->where('summary.success_rate', 50)
            ->where('summary.avg_duration_ms', 200)
        );
});

it('reports what is waiting in the queue right now, and flags a stalled worker', function () {
    ($this->queueRow)(['available_at' => time() - 20]);
    ($this->queueRow)(['available_at' => time() - 600]);          // due for ten minutes: nobody is picking it up
    ($this->queueRow)(['available_at' => time() + 3600]);          // scheduled for later
    ($this->queueRow)(['reserved_at' => time() - 5, 'available_at' => time() - 5]); // running now

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.queue.waiting', 2)
            ->where('summary.queue.scheduled', 1)
            ->where('summary.queue.running', 1)
            ->where('summary.queue.oldest_waiting_seconds', fn ($s) => $s >= 599 && $s <= 605)
            ->where('summary.queue.stalled', true)
        );
});

it('does not call the queue stalled when the oldest waiting job is recent, or the queue is empty', function () {
    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page->where('summary.queue.waiting', 0)->where('summary.queue.stalled', false)->where('summary.queue.oldest_waiting_seconds', fn ($s) => $s === null));

    ($this->queueRow)(['available_at' => time() - 30]);

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page->where('summary.queue.waiting', 1)->where('summary.queue.stalled', false));
});

it('has no queue figures when the queue is not the database one', function () {
    config(['queue.default' => 'sync']);

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page->where('summary.queue', fn ($q) => $q === null));
});

it('lists runs newest first and tells a job still running from one whose worker stopped', function () {
    ($this->run_)(['job_name' => 'Older', 'started_at' => now()->subHours(2)]);
    ($this->run_)(['job_name' => 'Newest', 'started_at' => now()->subMinute()]);
    ($this->run_)(['job_name' => 'Busy', 'status' => 'running', 'finished_at' => null, 'duration_ms' => null, 'started_at' => now()->subMinutes(2)]);
    ($this->run_)(['job_name' => 'Abandoned', 'status' => 'running', 'finished_at' => null, 'duration_ms' => null, 'started_at' => now()->subMinutes(40)]);

    ($this->zeus)()->get(route('zeus.job-history.index'))
        ->assertInertia(fn ($page) => $page
            ->where('runs.data', fn ($rows) => collect($rows)->pluck('job')->all() === ['Newest', 'Busy', 'Abandoned', 'Older']
                && collect($rows)->firstWhere('job', 'Busy')['status'] === 'running'
                && collect($rows)->firstWhere('job', 'Abandoned')['status'] === 'lost')
        );

    ($this->zeus)()->get(route('zeus.job-history.index', ['status' => 'lost']))
        ->assertInertia(fn ($page) => $page->where('runs.data', fn ($rows) => collect($rows)->pluck('job')->all() === ['Abandoned']));
    ($this->zeus)()->get(route('zeus.job-history.index', ['status' => 'running']))
        ->assertInertia(fn ($page) => $page->where('runs.data', fn ($rows) => collect($rows)->pluck('job')->all() === ['Busy']));
});

it('filters by status and searches by job or error, treating wildcards as plain text', function () {
    ($this->run_)(['job_name' => 'SendInvoice', 'status' => 'failed', 'error' => 'RuntimeException: SMTP timed out']);
    ($this->run_)(['job_name' => 'Recalculate', 'status' => 'failed', 'error' => 'LogicException: 100% broken']);
    ($this->run_)(['job_name' => 'Fine', 'status' => 'succeeded']);

    $count = fn (array $query) => ($this->zeus)()->get(route('zeus.job-history.index', $query))->viewData('page')['props']['runs']['total'];

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

    $page = fn (int $n) => collect(($this->zeus)()->get(route('zeus.job-history.index', ['page' => $n]))->viewData('page')['props']['runs']['data'])->pluck('id');

    expect($page(1))->toHaveCount(25)->and($page(2))->toHaveCount(5)->and($page(1)->merge($page(2))->unique())->toHaveCount(30);
});

it('gives a failed run the job id so it can be found on the Failed Jobs page', function () {
    $run = ($this->run_)(['status' => 'failed', 'error' => 'RuntimeException: x']);

    ($this->zeus)()->get(route('zeus.job-history.index'))
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
