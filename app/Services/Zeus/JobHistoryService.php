<?php

namespace App\Services\Zeus;

use App\Models\JobRun;
use App\Support\Queues;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class JobHistoryService
{
    /** Jobs that have been due this long without being picked up point at a stopped worker. */
    public const STALLED_AFTER_SECONDS = 300;

    public const STATUSES = ['succeeded', 'failed', 'retrying', 'running', 'lost'];

    /** @var list<int> */
    public const PER_PAGE = [25, 50, 100];

    /** Each range: how far back it looks, and how long one bar of the charts is. */
    public const RANGES = [
        '1h' => ['seconds' => 3600, 'bucket' => 60],
        '24h' => ['seconds' => 86_400, 'bucket' => 3600],
        '7d' => ['seconds' => 604_800, 'bucket' => 86_400],
    ];

    public const CLEAR_SCOPES = ['succeeded', 'older', 'all'];

    /** "Older" in the clear menu means older than this many days. */
    public const CLEAR_OLDER_THAN_DAYS = 7;

    /**
     * @param  array{status?: string|null, search?: string|null, queue?: string|null}  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        $lostBefore = now()->subMinutes(JobRun::LOST_AFTER_MINUTES);

        return JobRun::query()
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => match ($status) {
                // "running" and "lost" are the same stored status, told apart by how long ago it started.
                'running' => $q->where('status', JobRun::RUNNING)->where('started_at', '>=', $lostBefore),
                'lost' => $q->where('status', JobRun::RUNNING)->where('started_at', '<', $lostBefore),
                default => $q->where('status', $status),
            })
            ->when($filters['queue'] ?? null, fn (Builder $q, string $queue) => $q->where('queue', $queue))
            ->when($filters['search'] ?? null, function (Builder $q, string $search) {
                // "!" is the escape character (the same on every database), so a typed % or _ is just text.
                $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';
                $q->where(fn (Builder $w) => $w->whereRaw("job_name LIKE ? ESCAPE '!'", [$like])->orWhereRaw("error LIKE ? ESCAPE '!'", [$like]));
            })
            ->orderByDesc('started_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (JobRun $run) => $this->present($run, $lostBefore));
    }

    /**
     * Everything the operations view shows, for one range. Cached for a few seconds so a page that polls every
     * five seconds, in several tabs, costs the database about one set of queries per window.
     *
     * @return array<string, mixed>
     */
    public function overview(string $range = '24h'): array
    {
        $range = array_key_exists($range, self::RANGES) ? $range : '24h';
        $ttl = (int) config('queue.history.overview_cache_seconds', 4);

        if ($ttl <= 0) {
            return $this->buildOverview($range);
        }

        return Cache::remember("zeus:job-history:overview:{$range}", $ttl, fn () => $this->buildOverview($range));
    }

    /**
     * What the queue table holds right now, as one total. Null unless the queue is the database one.
     *
     * @return array{waiting: int, scheduled: int, running: int, oldest_waiting_seconds: int|null, stalled: bool}|null
     */
    public function queueState(): ?array
    {
        $perQueue = $this->pendingByQueue();

        if ($perQueue === null) {
            return null;
        }

        $oldest = $perQueue->pluck('oldest_waiting_seconds')->filter(fn ($s) => $s !== null)->max();

        return [
            'waiting' => (int) $perQueue->sum('waiting'),
            'scheduled' => (int) $perQueue->sum('scheduled'),
            'running' => (int) $perQueue->sum('running'),
            'oldest_waiting_seconds' => $oldest,
            'stalled' => $oldest !== null && $oldest > self::STALLED_AFTER_SECONDS,
        ];
    }

    /**
     * How many rows each clear option would remove, for the confirmation. A run that is still going is never
     * counted, so clearing cannot erase something a worker is writing to right now.
     *
     * @return array{succeeded: int, older: int, all: int}
     */
    public function clearable(): array
    {
        return [
            'succeeded' => $this->clearQuery('succeeded')->count(),
            'older' => $this->clearQuery('older')->count(),
            'all' => $this->clearQuery('all')->count(),
        ];
    }

    /**
     * Delete history rows. Only the history is touched: the queue, failed jobs and the jobs themselves are not.
     */
    public function clear(string $scope): int
    {
        $deleted = $this->clearQuery($scope)->delete();

        foreach (array_keys(self::RANGES) as $range) {
            Cache::forget("zeus:job-history:overview:{$range}");
        }

        return $deleted;
    }

    /**
     * @return Builder<JobRun>
     */
    private function clearQuery(string $scope): Builder
    {
        $lostBefore = now()->subMinutes(JobRun::LOST_AFTER_MINUTES);

        return JobRun::query()
            // Never a run that is still going. One whose worker stopped (lost) is just old history.
            ->where(fn (Builder $q) => $q->where('status', '!=', JobRun::RUNNING)->orWhere('started_at', '<', $lostBefore))
            ->when($scope === 'succeeded', fn (Builder $q) => $q->where('status', JobRun::SUCCEEDED))
            ->when($scope === 'older', fn (Builder $q) => $q->where('started_at', '<', now()->subDays(self::CLEAR_OLDER_THAN_DAYS)));
    }

    /**
     * @return array<string, mixed>
     */
    private function buildOverview(string $range): array
    {
        ['seconds' => $seconds, 'bucket' => $bucket] = self::RANGES[$range];

        $now = time();
        $buckets = intdiv($seconds, $bucket);
        $firstBucket = intdiv($now, $bucket) * $bucket - ($buckets - 1) * $bucket;
        $lostBefore = $now - JobRun::LOST_AFTER_MINUTES * 60;

        // One lean read of the window; everything below is worked out from it in memory.
        $rows = JobRun::query()
            ->where('started_at', '>=', CarbonImmutable::createFromTimestamp($firstBucket))
            ->toBase()
            ->get(['job_name', 'queue', 'worker', 'status', 'duration_ms', 'started_at'])
            ->map(function (object $row): object {
                $row->ts = (int) strtotime((string) $row->started_at);

                return $row;
            });

        $finished = $rows->whereIn('status', [JobRun::SUCCEEDED, JobRun::FAILED, JobRun::RETRYING]);
        $succeeded = $finished->where('status', JobRun::SUCCEEDED);
        $average = $succeeded->whereNotNull('duration_ms')->avg('duration_ms');

        $summary = [
            'ran' => $finished->count(),
            'succeeded' => $succeeded->count(),
            'failed' => $finished->where('status', JobRun::FAILED)->count(),
            'retrying' => $finished->where('status', JobRun::RETRYING)->count(),
            'success_rate' => $finished->isNotEmpty() ? round($succeeded->count() / $finished->count() * 100, 1) : null,
            'avg_duration_ms' => $average !== null ? (int) round((float) $average) : null,
            'queue' => $this->queueState(),
        ];

        $queues = $this->queues($finished);
        $lost = $rows->where('status', JobRun::RUNNING)->filter(fn (object $r) => $r->ts < $lostBefore)->count();

        return [
            'range' => $range,
            'generated_at' => CarbonImmutable::createFromTimestamp($now)->toIso8601String(),
            'summary' => $summary,
            'health' => $this->health($summary, $queues, $lost),
            'queues' => $queues,
            'workers' => $this->workers($rows, $lostBefore),
            'series' => $this->series($finished, $firstBucket, $bucket, $buckets),
            'slowest' => $this->slowest($succeeded),
            'flakiest' => $this->flakiest($finished),
            'clearable' => $this->clearable(),
        ];
    }

    /**
     * One entry per bar of the charts, oldest first, including bars where nothing ran.
     *
     * @param  Collection<int, object>  $finished
     * @return list<array{at: string, succeeded: int, failed: int, avg_duration_ms: int|null}>
     */
    private function series(Collection $finished, int $first, int $bucket, int $buckets): array
    {
        $grouped = $finished->groupBy(fn (object $r) => intdiv($r->ts - $first, $bucket));

        return collect(range(0, $buckets - 1))->map(function (int $i) use ($grouped, $first, $bucket) {
            $group = $grouped->get($i, collect());
            $worked = $group->where('status', JobRun::SUCCEEDED);
            $average = $worked->whereNotNull('duration_ms')->avg('duration_ms');

            return [
                'at' => CarbonImmutable::createFromTimestamp($first + $i * $bucket)->toIso8601String(),
                'succeeded' => $worked->count(),
                'failed' => $group->where('status', '!=', JobRun::SUCCEEDED)->count(),
                'avg_duration_ms' => $average !== null ? (int) round((float) $average) : null,
            ];
        })->all();
    }

    /**
     * Every queue worth showing: the ones the app defines (even when idle) and any other that has jobs or history,
     * which is how a queue no worker reads gets noticed.
     *
     * @param  Collection<int, object>  $finished
     * @return list<array<string, mixed>>
     */
    private function queues(Collection $finished): array
    {
        $pending = $this->pendingByQueue();
        $names = collect(Queues::ALL)
            ->merge($pending?->keys() ?? [])
            ->merge($finished->pluck('queue')->filter())
            ->unique()
            ->values();

        return $names->map(function (string $name) use ($pending, $finished) {
            $mine = $finished->where('queue', $name);
            $worked = $mine->where('status', JobRun::SUCCEEDED)->whereNotNull('duration_ms');
            $state = $pending?->get($name);
            $oldest = $state['oldest_waiting_seconds'] ?? null;

            return [
                'name' => $name,
                'known' => in_array($name, Queues::ALL, true),
                'waiting' => $state['waiting'] ?? 0,
                'scheduled' => $state['scheduled'] ?? 0,
                'running' => $state['running'] ?? 0,
                'oldest_waiting_seconds' => $oldest,
                'stalled' => $oldest !== null && $oldest > self::STALLED_AFTER_SECONDS,
                'ran' => $mine->count(),
                'failed' => $mine->where('status', '!=', JobRun::SUCCEEDED)->count(),
                'avg_duration_ms' => $worked->isNotEmpty() ? (int) round((float) $worked->avg('duration_ms')) : null,
            ];
        })->all();
    }

    /**
     * The workers seen in this window, from the runs they recorded. A worker shows up after its first job.
     *
     * @param  Collection<int, object>  $rows
     * @return list<array<string, mixed>>
     */
    private function workers(Collection $rows, int $lostBefore): array
    {
        return $rows->whereNotNull('worker')
            ->groupBy('worker')
            ->map(function (Collection $group, string $worker) use ($lostBefore) {
                $last = (int) $group->max('ts');
                $finished = $group->where('status', '!=', JobRun::RUNNING);

                return [
                    'name' => $worker,
                    'queues' => $group->pluck('queue')->filter()->unique()->sort()->values()->all(),
                    'runs' => $finished->count(),
                    'failed' => $finished->where('status', '!=', JobRun::SUCCEEDED)->count(),
                    'busy' => $group->where('status', JobRun::RUNNING)->contains(fn (object $r) => $r->ts >= $lostBefore),
                    'last_seen_at' => CarbonImmutable::createFromTimestamp($last)->toIso8601String(),
                    'last_seen_human' => CarbonImmutable::createFromTimestamp($last)->diffForHumans(),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, object>  $succeeded
     * @return list<array{job: string, runs: int, avg_duration_ms: int, max_duration_ms: int}>
     */
    private function slowest(Collection $succeeded): array
    {
        return $succeeded->whereNotNull('duration_ms')
            ->groupBy('job_name')
            ->map(fn (Collection $group, string $job) => [
                'job' => $job,
                'runs' => $group->count(),
                'avg_duration_ms' => (int) round((float) $group->avg('duration_ms')),
                'max_duration_ms' => (int) $group->max('duration_ms'),
            ])
            ->sortByDesc('avg_duration_ms')
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, object>  $finished
     * @return list<array{job: string, runs: int, failed: int, failure_rate: float}>
     */
    private function flakiest(Collection $finished): array
    {
        return $finished->groupBy('job_name')
            ->map(function (Collection $group, string $job) {
                $failures = $group->where('status', '!=', JobRun::SUCCEEDED)->count();

                return [
                    'job' => $job,
                    'runs' => $group->count(),
                    'failed' => $failures,
                    'failure_rate' => round($failures / $group->count() * 100, 1),
                ];
            })
            ->filter(fn (array $job) => $job['failed'] > 0)
            ->sortBy([['failure_rate', 'desc'], ['failed', 'desc']])
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * One line that says whether to worry, so the page can answer "is it fine?" before showing any number.
     *
     * @param  array<string, mixed>  $summary
     * @param  list<array<string, mixed>>  $queues
     * @return array{level: 'ok'|'attention'|'down', message: string}
     */
    private function health(array $summary, array $queues, int $lost): array
    {
        $stalled = collect($queues)->firstWhere('stalled', true);
        if ($stalled) {
            return ['level' => 'down', 'message' => "Jobs on the {$stalled['name']} queue are waiting and nothing is picking them up."];
        }

        $orphan = collect($queues)->first(fn (array $queue) => ! $queue['known'] && $queue['waiting'] > 0);
        if ($orphan) {
            return ['level' => 'attention', 'message' => "Jobs are waiting on a queue called {$orphan['name']}, which no worker reads."];
        }

        if ($summary['success_rate'] !== null && $summary['success_rate'] < 90) {
            return ['level' => 'attention', 'message' => 'More than one in ten attempts failed in this period.'];
        }

        if ($lost > 0) {
            return ['level' => 'attention', 'message' => $lost === 1 ? 'A job stopped midway, which usually means a worker was restarted.' : "{$lost} jobs stopped midway, which usually means a worker was restarted."];
        }

        return ['level' => 'ok', 'message' => 'Queues are moving and nothing is stuck.'];
    }

    /**
     * The queue table grouped by queue name. Null unless the queue is the database one.
     *
     * @return Collection<string, array{waiting: int, scheduled: int, running: int, oldest_waiting_seconds: int|null}>|null
     */
    private function pendingByQueue(): ?Collection
    {
        if (config('queue.default') !== 'database') {
            return null;
        }

        $now = time();
        $table = DB::connection(config('queue.connections.database.connection'))->table(config('queue.connections.database.table', 'jobs'));

        return $table
            ->selectRaw(
                'queue,
                SUM(CASE WHEN reserved_at IS NULL AND available_at <= ? THEN 1 ELSE 0 END) AS waiting,
                SUM(CASE WHEN reserved_at IS NULL AND available_at > ? THEN 1 ELSE 0 END) AS scheduled,
                SUM(CASE WHEN reserved_at IS NOT NULL THEN 1 ELSE 0 END) AS running,
                MIN(CASE WHEN reserved_at IS NULL AND available_at <= ? THEN available_at END) AS oldest',
                [$now, $now, $now],
            )
            ->groupBy('queue')
            ->get()
            ->mapWithKeys(fn (object $row) => [(string) $row->queue => [
                'waiting' => (int) $row->waiting,
                'scheduled' => (int) $row->scheduled,
                'running' => (int) $row->running,
                'oldest_waiting_seconds' => $row->oldest !== null ? max(0, $now - (int) $row->oldest) : null,
            ]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(JobRun $run, CarbonInterface $lostBefore): array
    {
        $lost = $run->status === JobRun::RUNNING && $run->started_at->lt($lostBefore);

        return [
            'id' => $run->id,
            'uuid' => $run->job_uuid,
            'job' => $run->job_name,
            'job_class' => $run->job_class,
            'queue' => $run->queue,
            'worker' => $run->worker,
            'attempt' => $run->attempt,
            'status' => $lost ? 'lost' : $run->status,
            'started_at' => $run->started_at->toIso8601String(),
            'started_human' => $run->started_at->diffForHumans(),
            'duration_ms' => $run->duration_ms,
            'error' => $run->error,
        ];
    }
}
