import type { RunStatus } from '@/Lib/jobs';

export type JobRun = {
    id: number;
    uuid: string | null;
    job: string;
    job_class: string;
    queue: string | null;
    worker: string | null;
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

export type Range = '1h' | '24h' | '7d';

export type QueueRow = {
    name: string;
    /** False for a queue the app does not define: jobs on it have no worker unless someone started one. */
    known: boolean;
    waiting: number;
    scheduled: number;
    running: number;
    oldest_waiting_seconds: number | null;
    stalled: boolean;
    ran: number;
    failed: number;
    avg_duration_ms: number | null;
};

export type WorkerRow = {
    name: string;
    queues: string[];
    runs: number;
    failed: number;
    busy: boolean;
    last_seen_at: string;
    last_seen_human: string;
};

export type SeriesPoint = { at: string; succeeded: number; failed: number; avg_duration_ms: number | null };

export type SlowJob = { job: string; runs: number; avg_duration_ms: number; max_duration_ms: number };

export type FlakyJob = { job: string; runs: number; failed: number; failure_rate: number };

export type ClearScope = 'succeeded' | 'older' | 'all';

export type Overview = {
    range: Range;
    generated_at: string;
    summary: Summary;
    health: { level: 'ok' | 'attention' | 'down'; message: string };
    queues: QueueRow[];
    workers: WorkerRow[];
    series: SeriesPoint[];
    slowest: SlowJob[];
    flakiest: FlakyJob[];
    clearable: Record<ClearScope, number>;
};
