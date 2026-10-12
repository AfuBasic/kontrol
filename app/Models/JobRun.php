<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

/**
 * One attempt of one queued job. Names and timings only, never the payload.
 *
 * @property int $id
 * @property string|null $job_uuid
 * @property string $job_class
 * @property string $job_name
 * @property string|null $queue
 * @property string|null $connection
 * @property string|null $worker
 * @property int $attempt
 * @property 'running'|'succeeded'|'retrying'|'failed' $status
 * @property CarbonImmutable $started_at
 * @property CarbonImmutable|null $finished_at
 * @property int|null $duration_ms
 * @property string|null $error
 */
class JobRun extends Model
{
    use Prunable;

    public const RUNNING = 'running';

    public const SUCCEEDED = 'succeeded';

    public const RETRYING = 'retrying';

    public const FAILED = 'failed';

    /** A run still marked "running" after this many minutes belongs to a worker that stopped. */
    public const LOST_AFTER_MINUTES = 15;

    public $timestamps = false;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'finished_at' => 'immutable_datetime',
            'attempt' => 'integer',
            'duration_ms' => 'integer',
        ];
    }

    /**
     * Old history is cleared by the daily model:prune.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        return static::query()->where('started_at', '<', now()->subDays((int) config('queue.history.retention_days', 14)));
    }
}
