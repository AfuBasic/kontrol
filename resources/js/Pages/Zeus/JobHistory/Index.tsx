import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { index as failedJobs } from '@/actions/App/Http/Controllers/Zeus/FailedJobController';
import { index } from '@/actions/App/Http/Controllers/Zeus/JobHistoryController';
import type { JobRun, Summary } from '@/Components/Zeus/JobHistory/types';
import StatTile from '@/Components/Zeus/StatTile';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { formatDuration, formatWaiting, STATUS_STYLE, type RunStatus } from '@/Lib/jobs';

type Paginated<T> = {
    data: T[];
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    filters: { status: RunStatus | null; search: string | null };
    runs: Paginated<JobRun>;
    summary: Summary;
    retention_days: number;
    recording: boolean;
};

const COLUMNS = 'grid-cols-[minmax(0,1.3fr)_110px_160px_70px_100px_130px]';
const STATUS_FILTERS: Array<{ value: RunStatus | ''; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'succeeded', label: 'Succeeded' },
    { value: 'failed', label: 'Failed' },
    { value: 'retrying', label: 'Failed, will retry' },
    { value: 'running', label: 'Running' },
    { value: 'lost', label: 'Stopped midway' },
];

export default function JobHistoryIndex({ filters, runs, summary, retention_days, recording }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const queue = summary.queue;

    function visit(changes: Partial<{ status: string | null; search: string | null }>) {
        const next = { status: filters.status, search: filters.search, ...changes };
        router.get(
            index.url(),
            { ...(next.status ? { status: next.status } : {}), ...(next.search ? { search: next.search } : {}) },
            { preserveState: true, replace: true },
        );
    }

    // Search as you type, once typing pauses.
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        const handle = window.setTimeout(() => {
            if ((filters.search ?? '') !== search.trim()) visit({ search: search.trim() || null });
        }, 350);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const narrowed = Boolean(filters.status || filters.search);

    return (
        <ZeusLayout>
            <Head title="Job History" />

            <div className="mx-auto max-w-6xl pb-24">
                <div className="pt-4">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Job History</h1>
                    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                        Every attempt the queue has made. Laravel forgets a job the moment it succeeds, so this is the only place a finished job shows
                        up.
                    </p>
                </div>

                {!recording && (
                    <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Recording is switched off (<code>JOB_HISTORY_ENABLED</code>), so nothing new is being added here.
                    </p>
                )}

                {queue?.stalled && (
                    <div className="mt-5 flex gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                        <p>
                            <span className="font-semibold">Jobs are waiting longer than they should.</span> The oldest has been ready for{' '}
                            {formatWaiting(queue.oldest_waiting_seconds)} and nothing has picked it up. The queue worker may have stopped.
                        </p>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-4 gap-4">
                    <StatTile
                        label="Waiting now"
                        value={queue ? String(queue.waiting) : '—'}
                        tone={queue?.stalled ? 'text-rose-300' : queue && queue.waiting > 0 ? 'text-amber-200' : 'text-emerald-300'}
                        sub={
                            queue
                                ? queue.waiting === 0
                                    ? 'Nothing is queued'
                                    : `Oldest ready for ${formatWaiting(queue.oldest_waiting_seconds)}`
                                : 'Not the database queue'
                        }
                    />
                    <StatTile
                        label="Ran in 24 hours"
                        value={String(summary.ran)}
                        sub={
                            queue
                                ? `${queue.running} running now · ${queue.scheduled} scheduled for later`
                                : `${summary.failed + summary.retrying} failed attempts`
                        }
                    />
                    <StatTile
                        label="Success rate"
                        value={summary.success_rate === null ? '—' : `${summary.success_rate}%`}
                        tone={
                            summary.success_rate === null
                                ? 'text-slate-400'
                                : summary.success_rate >= 98
                                  ? 'text-emerald-300'
                                  : summary.success_rate >= 90
                                    ? 'text-amber-200'
                                    : 'text-rose-300'
                        }
                        sub={summary.ran === 0 ? 'Nothing has run yet' : `${summary.failed + summary.retrying} of ${summary.ran} attempts failed`}
                    />
                    <StatTile label="Average time" value={formatDuration(summary.avg_duration_ms)} sub="Of the jobs that succeeded" />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-60 flex-1 sm:max-w-sm">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <label htmlFor="run-search" className="sr-only">
                            Search job or error
                        </label>
                        <input
                            id="run-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search job or error"
                            className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-800/40 py-2 pr-3.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                        />
                    </div>
                    <label htmlFor="run-status" className="sr-only">
                        Status
                    </label>
                    <select
                        id="run-status"
                        value={filters.status ?? ''}
                        onChange={(e) => visit({ status: e.target.value || null })}
                        className="min-h-10 min-w-48 rounded-lg border border-slate-700 bg-slate-800/40 px-3.5 text-sm text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                    >
                        {STATUS_FILTERS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {narrowed && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                visit({ status: null, search: null });
                            }}
                            className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <section aria-label="Job runs" className="mt-4">
                    {runs.data.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
                            <p className="text-base font-semibold text-white">{narrowed ? 'No runs match these filters' : 'No jobs recorded yet'}</p>
                            <p className="mt-1 text-sm text-slate-400">
                                {narrowed
                                    ? 'Try a different word, or clear the filters.'
                                    : 'History starts from the moment this was switched on. Jobs that ran before then cannot be shown.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-[#0f1423]">
                            <div
                                className={`grid items-center gap-4 border-b border-slate-800/70 bg-black/10 px-5 py-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase ${COLUMNS}`}
                            >
                                <span>Job</span>
                                <span>Queue</span>
                                <span>Status</span>
                                <span>Try</span>
                                <span className="text-right">Took</span>
                                <span className="text-right">Started</span>
                            </div>

                            {runs.data.map((run) => (
                                <div
                                    key={run.id}
                                    className={`grid items-start gap-4 border-b border-slate-800/60 px-5 py-3.5 last:border-b-0 ${COLUMNS}`}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white" title={run.job_class}>
                                            {run.job}
                                        </p>
                                        {run.error && (
                                            <p className="mt-0.5 line-clamp-2 text-xs break-words text-slate-500" title={run.error}>
                                                {run.error}
                                            </p>
                                        )}
                                        {run.status === 'failed' && run.uuid && (
                                            <Link
                                                href={failedJobs.url({ query: { search: run.uuid } })}
                                                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-300 hover:text-primary-200"
                                            >
                                                Open in Failed Jobs
                                                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                            </Link>
                                        )}
                                    </div>
                                    <p className="truncate text-sm text-slate-300">{run.queue ?? '—'}</p>
                                    <div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[run.status].chip}`}
                                        >
                                            {STATUS_STYLE[run.status].label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 tabular-nums">{run.attempt}</p>
                                    <p className="text-right text-sm text-slate-300 tabular-nums">
                                        {run.status === 'running' ? '…' : formatDuration(run.duration_ms)}
                                    </p>
                                    <p className="text-right text-sm text-slate-400" title={new Date(run.started_at).toLocaleString()}>
                                        {run.started_human}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {runs.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                            <p>
                                Showing {runs.from}–{runs.to} of {runs.total}
                            </p>
                            <div className="flex items-center gap-2">
                                {runs.prev_page_url && (
                                    <Link
                                        href={runs.prev_page_url}
                                        preserveScroll
                                        className="rounded-lg border border-slate-700 px-3.5 py-2 font-semibold text-slate-300 transition hover:bg-white/5"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {runs.next_page_url && (
                                    <Link
                                        href={runs.next_page_url}
                                        preserveScroll
                                        className="rounded-lg border border-slate-700 px-3.5 py-2 font-semibold text-slate-300 transition hover:bg-white/5"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    <p className="mt-6 text-xs text-slate-600">
                        Kept for {retention_days} days, then cleared automatically. It stores job names, timings and the first line of any error,
                        never the job’s contents.
                    </p>
                </section>
            </div>
        </ZeusLayout>
    );
}
