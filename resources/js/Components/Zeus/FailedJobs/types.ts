export type FailedJob = {
    uuid: string;
    /** The job (or, for a queued notification, the notification) in plain words. */
    job: string;
    job_class: string;
    /** What the queue ran it as, for example SendQueuedNotifications. */
    queued_as: string;
    queue: string | null;
    connection: string | null;
    error: string;
    exception_class: string | null;
    failed_at: string;
    failed_human: string;
    /** Running it again would send something to someone again. */
    repeats_messages: boolean;
};

export type FailedJobDetail = FailedJob & { exception: string };

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type Range = '24h' | '7d' | '30d';

export type Summary = {
    /** Failed jobs waiting for a decision. */
    total: number;
    in_range: number;
    /** Failures in the period of the same length just before this one, for the trend. */
    before_range: number;
    last_hour: number;
    last_24h: number;
    oldest_at: string | null;
    /** Failed jobs that would message someone again if retried. */
    repeat_risk: number;
    /** More failures exist than the cause and queue panels read. */
    sampled: boolean;
};

export type Cause = {
    job: string;
    exception_class: string | null;
    error: string;
    count: number;
    queues: string[];
    repeats_messages: boolean;
    last_failed_human: string;
};

export type Overview = {
    range: Range;
    generated_at: string;
    summary: Summary;
    health: { level: 'ok' | 'attention' | 'down'; message: string };
    series: Array<{ at: string; failed: number }>;
    causes: Cause[];
    queues: Array<{ name: string; count: number }>;
};
