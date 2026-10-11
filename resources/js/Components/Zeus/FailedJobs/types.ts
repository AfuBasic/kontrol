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

export type Summary = { total: number; last_24h: number; oldest_at: string | null };
