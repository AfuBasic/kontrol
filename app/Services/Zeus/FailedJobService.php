<?php

namespace App\Services\Zeus;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Reads and acts on Laravel's failed_jobs table so the owner can retry or forget failed jobs from Zeus without a shell.
 * Retrying goes through Laravel's own queue:retry, so it behaves exactly like the command line.
 */
class FailedJobService
{
    /**
     * Jobs that send something to a person. Running one again sends it again, so they get a warning.
     *
     * @var array<int, string>
     */
    public const SENDS_MESSAGES = [
        'Illuminate\Notifications\SendQueuedNotifications',
        'Illuminate\Mail\SendQueuedMailable',
        'App\Jobs\DeliverBulkVisitorPassJob',
        'App\Jobs\NotifyBulkInviteDeliveryReportJob',
        'App\Jobs\SendSmsAlert',
    ];

    private const MAX_EXCEPTION_CHARS = 6000;

    /**
     * @return Builder
     */
    private function table()
    {
        return DB::connection(config('queue.failed.database'))->table(config('queue.failed.table'));
    }

    /**
     * @param  array{search?: string|null}  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        return $this->table()
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
     * @return array{total: int, last_24h: int, oldest_at: string|null}
     */
    public function summary(): array
    {
        $oldest = $this->table()->min('failed_at');

        return [
            'total' => $this->table()->count(),
            'last_24h' => $this->table()->where('failed_at', '>=', now()->subDay())->count(),
            'oldest_at' => $oldest ? Carbon::parse($oldest)->toIso8601String() : null,
        ];
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

        return $forgotten->count();
    }

    /**
     * Work out what a failed job really is from its stored payload (read as data, never unserialized).
     *
     * @return array{display: string, class: string}
     */
    private function identify(string $payload): array
    {
        $data = json_decode($payload, true) ?: [];
        $display = (string) ($data['displayName'] ?? 'Unknown job');
        $command = (string) ($data['data']['command'] ?? '');

        // A queued notification is always "SendQueuedNotifications"; the useful name is the notification inside it.
        $inner = $display === 'Illuminate\Notifications\SendQueuedNotifications' && preg_match('/"notification";O:\d+:"([^"]+)"/', $command, $m) ? $m[1] : null;

        return ['display' => $display, 'class' => $inner ?? $display];
    }

    /**
     * @return array<string, mixed>
     */
    private function present(object $row): array
    {
        ['display' => $display, 'class' => $class] = $this->identify((string) $row->payload);
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
            'repeats_messages' => in_array($display, self::SENDS_MESSAGES, true),
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
                'jobs' => $jobs->map(fn (object $job) => ['uuid' => $job->uuid, 'job' => $this->identify((string) $job->payload)['class']])->values()->all(),
            ])
            ->log($description);
    }
}
