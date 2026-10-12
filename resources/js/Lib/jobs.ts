/** How long a job took: "850 ms", "4.2 s", "2 min 5 s". */
export function formatDuration(ms: number | null): string {
    if (ms === null) return '—';
    if (ms < 1000) return `${ms} ms`;

    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1).replace(/\.0$/, '')} s`;

    const minutes = Math.floor(seconds / 60);
    const rest = Math.round(seconds % 60);
    return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

/** How long something has been waiting: "12 seconds", "4 minutes", "3 hours". */
export function formatWaiting(seconds: number | null): string {
    if (seconds === null) return 'Nothing waiting';

    const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
    if (seconds < 60) return plural(seconds, 'second');
    if (seconds < 3600) return plural(Math.floor(seconds / 60), 'minute');
    if (seconds < 86_400) return plural(Math.floor(seconds / 3600), 'hour');
    return plural(Math.floor(seconds / 86_400), 'day');
}

export type RunStatus = 'succeeded' | 'failed' | 'retrying' | 'running' | 'lost';

/** The words and colours for a run's status. "lost" is a run whose worker stopped before it finished. */
export const STATUS_STYLE: Record<RunStatus, { label: string; chip: string }> = {
    succeeded: { label: 'Succeeded', chip: 'bg-emerald-500/15 text-emerald-300' },
    failed: { label: 'Failed', chip: 'bg-rose-500/15 text-rose-300' },
    retrying: { label: 'Failed, will retry', chip: 'bg-amber-500/15 text-amber-200' },
    running: { label: 'Running', chip: 'bg-sky-500/15 text-sky-300' },
    lost: { label: 'Stopped midway', chip: 'bg-orange-500/15 text-orange-300' },
};

/** The label under one chart bar: a clock time for the hour and day views, a weekday and date for the week. */
export function formatBucket(iso: string, range: '1h' | '24h' | '7d'): string {
    const date = new Date(iso);

    return range === '7d'
        ? date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
        : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** "just now", "12 s ago", "3 min ago": how old the live figures are. */
export function formatAge(seconds: number): string {
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${Math.floor(seconds)} s ago`;

    return `${Math.floor(seconds / 60)} min ago`;
}
