<?php

namespace App\Services\Zeus;

use App\Support\QueueJobName;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Reads and acts on Laravel's failed_jobs table so the owner can retry or forget failed jobs from Zeus without a shell.
 * Retrying goes through Laravel's own queue:retry, so it behaves exactly like the command line.
 */
class FailedJobService
{
    private const MAX_EXCEPTION_CHARS = 6000;

    /** Each range: how far back it looks, and how long one bar of the chart is. */
    public const RANGES = [
        '24h' => ['seconds' => 86_400, 'bucket' => 3600],
        '7d' => ['seconds' => 604_800, 'bucket' => 86_400],
        '30d' => ['seconds' => 2_592_000, 'bucket' => 86_400],
    ];

    /** @var list<int> */
    public const PER_PAGE = [25, 50, 100];

    /** Failures read for the "what is failing" panels. More than this and the panels say they are a sample. */
    private const SAMPLE = 500;

    /** This many failures in the last hour means something is failing right now, not just waiting to be reviewed. */
    private const BURST = 10;

    /**
     * @return Builder
     */
    private function table()
    {
        return DB::connection(config('queue.failed.database'))->table(config('queue.failed.table'));
    }

    /**
     * @param  array{search?: string|null, queue?: string|null}  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        return $this->table()
            ->when($filters['queue'] ?? null, fn (Builder $query, string $queue) => $query->where('queue', $queue))
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                // "!" is the escape character (the same on every database), so a typed % or _ is just text.
                $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';
                $query->where(fn (Builder $w) => $w->whereRaw("payload LIKE ? ESCAPE '!'", [$like])->orWhereRaw("exception LIKE ? ESCAPE '!'", [$like]));
            })
            ->orderByDesc('failed_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (object $row) => $this->present($row));
    }

    /**
     * Everything the metrics above the list show. Cached for a few seconds so a page that refreshes itself, in
     * several tabs, costs about one set of queries per window.
     *
     * @return array<string, mixed>
     */
    public function overview(string $range = '7d'): array
    {
        $range = array_key_exists($range, self::RANGES) ? $range : '7d';
        $ttl = (int) config('queue.history.overview_cache_seconds', 4);

        if ($ttl <= 0) {
            return $this->buildOverview($range);
        }

        return Cache::remember("zeus:failed-jobs:overview:{$range}", $ttl, fn () => $this->buildOverview($range));
    }

    /**
     * @return array<string, mixed>
     */
    private function buildOverview(string $range): array
    {
        ['seconds' => $seconds, 'bucket' => $bucket] = self::RANGES[$range];

        $now = time();
        $total = $this->table()->count();
        $lastHour = $this->table()->where('failed_at', '>=', now()->subHour())->count();
        $inRange = $this->table()->where('failed_at', '>=', now()->subSeconds($seconds))->count();
        $before = $this->table()->where('failed_at', '>=', now()->subSeconds($seconds * 2))->where('failed_at', '<', now()->subSeconds($seconds))->count();
        $oldest = $this->table()->min('failed_at');

        // What is waiting for a decision, read from the newest failures: payloads are large, and this is a view, not a report.
        $current = $this->table()->orderByDesc('failed_at')->limit(self::SAMPLE)->get(['uuid', 'queue', 'payload', 'exception', 'failed_at'])
            ->map(function (object $row): array {
                ['display' => $display, 'class' => $class] = QueueJobName::identify((string) $row->payload);
                $firstLine = Str::before((string) $row->exception, "\n");

                return [
                    'job' => class_basename($class),
                    'queue' => (string) $row->queue,
                    'exception_class' => Str::contains($firstLine, ':') ? Str::before($firstLine, ':') : null,
                    'error' => Str::limit($firstLine, 160),
                    'repeats_messages' => QueueJobName::sendsMessages($display),
                    'failed_at' => Carbon::parse($row->failed_at),
                ];
            });

        $summary = [
            'total' => $total,
            'in_range' => $inRange,
            'before_range' => $before,
            'last_hour' => $lastHour,
            // Kept so existing readers of the old figure still work.
            'last_24h' => $this->table()->where('failed_at', '>=', now()->subDay())->count(),
            'oldest_at' => $oldest ? Carbon::parse($oldest)->toIso8601String() : null,
            'repeat_risk' => $current->where('repeats_messages', true)->count(),
            'sampled' => $total > self::SAMPLE,
        ];

        return [
            'range' => $range,
            'generated_at' => Carbon::createFromTimestamp($now)->toIso8601String(),
            'summary' => $summary,
            'health' => $this->health($summary),
            'series' => $this->series($now, $seconds, $bucket),
            'causes' => $this->causes($current),
            'queues' => $current->groupBy('queue')
                ->map(fn (Collection $group, string $name) => ['name' => $name, 'count' => $group->count()])
                ->sortByDesc('count')->values()->all(),
        ];
    }

    /**
     * Failures per bar, oldest first, including bars where nothing failed.
     *
     * @return list<array{at: string, failed: int}>
     */
    private function series(int $now, int $seconds, int $bucket): array
    {
        $buckets = intdiv($seconds, $bucket);
        $first = intdiv($now, $bucket) * $bucket - ($buckets - 1) * $bucket;

        $counts = $this->table()
            ->where('failed_at', '>=', Carbon::createFromTimestamp($first))
            ->limit(20_000)
            ->pluck('failed_at')
            ->countBy(fn ($at) => intdiv((int) strtotime((string) $at) - $first, $bucket));

        return collect(range(0, $buckets - 1))->map(fn (int $i) => [
            'at' => Carbon::createFromTimestamp($first + $i * $bucket)->toIso8601String(),
            'failed' => (int) ($counts[$i] ?? 0),
        ])->all();
    }

    /**
     * Failures grouped by what broke: the same job failing with the same kind of error is one cause, however many times.
     *
     * @param  Collection<int, array<string, mixed>>  $current
     * @return list<array<string, mixed>>
     */
    private function causes(Collection $current): array
    {
        return $current->groupBy(fn (array $row) => $row['job'].'|'.($row['exception_class'] ?? ''))
            ->map(function (Collection $group): array {
                $latest = $group->sortByDesc('failed_at')->first();

                return [
                    'job' => $latest['job'],
                    'exception_class' => $latest['exception_class'],
                    'error' => $latest['error'],
                    'count' => $group->count(),
                    'queues' => $group->pluck('queue')->unique()->sort()->values()->all(),
                    'repeats_messages' => (bool) $latest['repeats_messages'],
                    'last_failed_human' => $latest['failed_at']->diffForHumans(),
                ];
            })
            ->sortByDesc('count')
            ->take(6)
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $summary
     * @return array{level: 'ok'|'attention'|'down', message: string}
     */
    private function health(array $summary): array
    {
        if ($summary['last_hour'] >= self::BURST) {
            return ['level' => 'down', 'message' => "{$summary['last_hour']} jobs failed in the last hour. Something is failing right now."];
        }

        if ($summary['last_hour'] > 0) {
            $n = $summary['last_hour'];

            return ['level' => 'attention', 'message' => ($n === 1 ? '1 job' : "{$n} jobs").' failed in the last hour.'];
        }

        if ($summary['total'] > 0) {
            $n = $summary['total'];

            return ['level' => 'attention', 'message' => ($n === 1 ? '1 failed job is' : "{$n} failed jobs are").' waiting for a decision. Nothing new has failed in the last hour.'];
        }

        return ['level' => 'ok', 'message' => 'Nothing is stuck. Every job that was queued has run.'];
    }

    /**
     * One failed job with its full error, for the detail view.
     *
     * @return array<string, mixed>|null
     */
    public function detail(string $uuid): ?array
    {
        $row = $this->table()->where('uuid', $uuid)->first();

        return $row ? [...$this->present($row), 'exception' => Str::limit((string) $row->exception, self::MAX_EXCEPTION_CHARS, "\n… (shortened)")] : null;
    }

    /**
     * Put failed jobs back on the queue. Returns how many went back and how many could not be found.
     *
     * @param  array<int, string>  $uuids
     * @return array{retried: int, missing: int}
     */
    public function retry(array $uuids): array
    {
        $jobs = $this->table()->whereIn('uuid', $uuids)->get(['uuid', 'payload']);
        $found = $jobs->pluck('uuid')->all();

        if ($found === []) {
            return ['retried' => 0, 'missing' => count($uuids)];
        }

        Artisan::call('queue:retry', ['id' => $found]);

        // queue:retry removes a job from the failed table once it is back on the queue, so what is gone was retried.
        $stillFailed = $this->table()->whereIn('uuid', $found)->pluck('uuid')->all();
        $retriedJobs = $jobs->reject(fn (object $job) => in_array($job->uuid, $stillFailed, true));

        $this->log('Failed jobs retried', $retriedJobs);
        $this->forgetOverview();

        return ['retried' => $retriedJobs->count(), 'missing' => count($uuids) - count($found)];
    }

    /**
     * Remove failed jobs without running them again.
     *
     * @param  array<int, string>  $uuids
     */
    public function forget(array $uuids): int
    {
        $jobs = $this->table()->whereIn('uuid', $uuids)->get(['uuid', 'payload']);
        $forgotten = $jobs->filter(fn (object $job) => app('queue.failer')->forget($job->uuid));

        $this->log('Failed jobs forgotten', $forgotten);
        $this->forgetOverview();

        return $forgotten->count();
    }

    /** What was just retried or forgotten must show in the figures straight away, not after the cache expires. */
    private function forgetOverview(): void
    {
        foreach (array_keys(self::RANGES) as $range) {
            Cache::forget("zeus:failed-jobs:overview:{$range}");
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function present(object $row): array
    {
        ['display' => $display, 'class' => $class] = QueueJobName::identify((string) $row->payload);
        $firstLine = Str::before((string) $row->exception, "\n");
        $failedAt = Carbon::parse($row->failed_at);

        return [
            'uuid' => $row->uuid,
            'job' => class_basename($class),
            'job_class' => $class,
            'queued_as' => class_basename($display),
            'queue' => $row->queue,
            'connection' => $row->connection,
            'error' => Str::limit($firstLine, 300),
            'exception_class' => Str::contains($firstLine, ':') ? Str::before($firstLine, ':') : null,
            'failed_at' => $failedAt->toIso8601String(),
            'failed_human' => $failedAt->diffForHumans(),
            'repeats_messages' => QueueJobName::sendsMessages($display),
        ];
    }

    /**
     * @param  Collection<int, object>  $jobs
     */
    private function log(string $description, Collection $jobs): void
    {
        if ($jobs->isEmpty()) {
            return;
        }

        activity('zeus')
            ->withProperties([
                'actor' => 'zeus',
                'jobs' => $jobs->map(fn (object $job) => ['uuid' => $job->uuid, 'job' => QueueJobName::identify((string) $job->payload)['class']])->values()->all(),
            ])
            ->log($description);
    }
}
