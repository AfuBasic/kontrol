import type { RunStatus } from '@/Lib/jobs';

export type JobRun = {
    id: number;
    uuid: string | null;
    job: string;
    job_class: string;
    queue: string | null;
    attempt: number;
    status: RunStatus;
    started_at: string;
    started_human: string;
    duration_ms: number | null;
    error: string | null;
};

export type QueueState = {
    waiting: number;
    scheduled: number;
    running: number;
    oldest_waiting_seconds: number | null;
    stalled: boolean;
};

export type Summary = {
    ran: number;
    succeeded: number;
    failed: number;
    retrying: number;
    success_rate: number | null;
    avg_duration_ms: number | null;
    queue: QueueState | null;
};
