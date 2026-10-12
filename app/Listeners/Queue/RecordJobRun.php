<?php

namespace App\Listeners\Queue;

use App\Models\JobRun;
use App\Support\QueueJobName;
use Illuminate\Contracts\Queue\Job;
use Illuminate\Queue\Events\JobExceptionOccurred;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Str;
use Throwable;

/**
 * Writes one job_runs row per attempt as the queue worker reports it. Recording is strictly best effort: if a
 * history row cannot be written, the job itself must carry on untouched.
 */
class RecordJobRun
{
    public function processing(JobProcessing $event): void
    {
        $this->guard(function () use ($event) {
            $job = $event->job;
            $name = QueueJobName::identify($job->payload());

            JobRun::create([
                'job_uuid' => $this->uuid($job),
                'job_class' => Str::limit($name['class'], 250, ''),
                'job_name' => Str::limit(class_basename($name['class']), 150, ''),
                'queue' => $job->getQueue(),
                'connection' => $event->connectionName,
                'attempt' => $job->attempts(),
                'status' => JobRun::RUNNING,
                'started_at' => now(),
            ]);
        });
    }

    public function processed(JobProcessed $event): void
    {
        $this->finish($event->job, JobRun::SUCCEEDED);
    }

    /**
     * An exception was thrown, and the job will be tried again. On the last attempt Laravel reports the job as failed
     * first and this event second, so a job that has already failed for good must not be marked "retrying".
     */
    public function exception(JobExceptionOccurred $event): void
    {
        if ($event->job->hasFailed()) {
            return;
        }

        $this->finish($event->job, JobRun::RETRYING, $event->exception);
    }

    public function failed(JobFailed $event): void
    {
        $this->finish($event->job, JobRun::FAILED, $event->exception);
    }

    private function finish(Job $job, string $status, ?Throwable $exception = null): void
    {
        $this->guard(function () use ($job, $status, $exception) {
            // The row this attempt opened. Found by the job's id and attempt number, so no state is kept in the worker.
            $uuid = $this->uuid($job);
            $run = $uuid
                ? JobRun::query()->where('job_uuid', $uuid)->where('attempt', $job->attempts())->latest('id')->first()
                : null;

            // A job can fail before it is ever "processing" (for example when it cannot be loaded): record that too.
            if (! $run) {
                $name = QueueJobName::identify($job->payload());
                $run = new JobRun([
                    'job_uuid' => $this->uuid($job),
                    'job_class' => Str::limit($name['class'], 250, ''),
                    'job_name' => Str::limit(class_basename($name['class']), 150, ''),
                    'queue' => $job->getQueue(),
                    'attempt' => $job->attempts(),
                    'started_at' => now(),
                ]);
            }

            $finishedAt = now();
            $run->fill([
                'status' => $status,
                'finished_at' => $finishedAt,
                'duration_ms' => (int) max(0, $run->started_at->diffInMilliseconds($finishedAt, true)),
                'error' => $exception ? Str::limit(Str::before($exception::class.': '.$exception->getMessage(), "\n"), 300, '') : null,
            ])->save();
        });
    }

    private function uuid(Job $job): ?string
    {
        return $job->uuid() ?: ($job->payload()['uuid'] ?? null);
    }

    private function guard(callable $record): void
    {
        if (! config('queue.history.enabled')) {
            return;
        }

        try {
            $record();
        } catch (Throwable $e) {
            report($e);
        }
    }
}
