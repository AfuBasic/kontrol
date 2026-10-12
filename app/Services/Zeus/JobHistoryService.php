<?php

namespace App\Services\Zeus;

use App\Models\JobRun;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class JobHistoryService
{
    /** Jobs that have been due this long without being picked up point at a stopped worker. */
    public const STALLED_AFTER_SECONDS = 300;

    public const STATUSES = ['succeeded', 'failed', 'retrying', 'running', 'lost'];

    /**
     * @param  array{status?: string|null, search?: string|null}  $filters
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
     * The last 24 hours in numbers, and what is waiting in the queue right now.
     *
     * @return array{ran: int, succeeded: int, failed: int, retrying: int, success_rate: float|null, avg_duration_ms: int|null, queue: array<string, mixed>|null}
     */
    public function summary(): array
    {
        $since = now()->subDay();
        $counts = JobRun::query()
            ->where('started_at', '>=', $since)
            ->whereIn('status', [JobRun::SUCCEEDED, JobRun::FAILED, JobRun::RETRYING])
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $succeeded = (int) ($counts[JobRun::SUCCEEDED] ?? 0);
        $failed = (int) ($counts[JobRun::FAILED] ?? 0);
        $retrying = (int) ($counts[JobRun::RETRYING] ?? 0);
        $ran = $succeeded + $failed + $retrying;
        $average = JobRun::query()->where('started_at', '>=', $since)->where('status', JobRun::SUCCEEDED)->avg('duration_ms');

        return [
            'ran' => $ran,
            'succeeded' => $succeeded,
            'failed' => $failed,
            'retrying' => $retrying,
            'success_rate' => $ran > 0 ? round($succeeded / $ran * 100, 1) : null,
            'avg_duration_ms' => $average !== null ? (int) round((float) $average) : null,
            'queue' => $this->queueState(),
        ];
    }

    /**
     * What the queue table holds right now: the work still to do. Null unless the queue is the database one.
     *
     * @return array{waiting: int, scheduled: int, running: int, oldest_waiting_seconds: int|null, stalled: bool}|null
     */
    public function queueState(): ?array
    {
        if (config('queue.default') !== 'database') {
            return null;
        }

        $jobs = fn () => DB::connection(config('queue.connections.database.connection'))->table(config('queue.connections.database.table', 'jobs'));
        $now = time();

        $waiting = $jobs()->whereNull('reserved_at')->where('available_at', '<=', $now);
        $oldestDue = (clone $waiting)->min('available_at');
        $oldestSeconds = $oldestDue !== null ? max(0, $now - (int) $oldestDue) : null;

        return [
            'waiting' => (clone $waiting)->count(),
            'scheduled' => $jobs()->whereNull('reserved_at')->where('available_at', '>', $now)->count(),
            'running' => $jobs()->whereNotNull('reserved_at')->count(),
            'oldest_waiting_seconds' => $oldestSeconds,
            'stalled' => $oldestSeconds !== null && $oldestSeconds > self::STALLED_AFTER_SECONDS,
        ];
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
            'attempt' => $run->attempt,
            'status' => $lost ? 'lost' : $run->status,
            'started_at' => $run->started_at->toIso8601String(),
            'started_human' => $run->started_at->diffForHumans(),
            'duration_ms' => $run->duration_ms,
            'error' => $run->error,
        ];
    }
}
