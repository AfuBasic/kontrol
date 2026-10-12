import { ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, PauseIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { index as failedJobs } from '@/actions/App/Http/Controllers/Zeus/FailedJobController';
import { clear, index } from '@/actions/App/Http/Controllers/Zeus/JobHistoryController';
import ClearHistoryModal from '@/Components/Zeus/JobHistory/ClearHistoryModal';
import HealthBar from '@/Components/Zeus/JobHistory/HealthBar';
import JobCharts from '@/Components/Zeus/JobHistory/JobCharts';
import QueuePanel from '@/Components/Zeus/JobHistory/QueuePanel';
import RankedJobs from '@/Components/Zeus/JobHistory/RankedJobs';
import type { ClearScope, JobRun, Overview, Range } from '@/Components/Zeus/JobHistory/types';
import WorkerPanel from '@/Components/Zeus/JobHistory/WorkerPanel';
import StatTile from '@/Components/Zeus/StatTile';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { formatAge, formatDuration, formatWaiting, STATUS_STYLE, type RunStatus } from '@/Lib/jobs';

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Filters = { status: RunStatus | null; search: string | null; queue: string | null; range: Range; per_page: number };

type Props = {
    filters: Filters;
    runs: Paginated<JobRun>;
    overview: Overview;
    retention_days: number;
    recording: boolean;
};

const POLL_MS = 5000;
const LIVE_KEY = 'zeus.job-history.live';
const COLUMNS = 'grid-cols-[minmax(0,1.3fr)_150px_160px_70px_100px_130px]';
const RANGES: Array<{ value: Range; label: string }> = [
    { value: '1h', label: '1 hour' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
];
const RANGE_PHRASE: Record<Range, string> = { '1h': 'in the last hour', '24h': 'in 24 hours', '7d': 'in 7 days' };
const STATUS_FILTERS: Array<{ value: RunStatus | ''; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'succeeded', label: 'Succeeded' },
    { value: 'failed', label: 'Failed' },
    { value: 'retrying', label: 'Failed, will retry' },
    { value: 'running', label: 'Running' },
    { value: 'lost', label: 'Stopped midway' },
];

function readLive(): boolean {
    try {
        return window.localStorage.getItem(LIVE_KEY) !== 'off';
    } catch {
        return true;
    }
}

export default function JobHistoryIndex({ filters, runs, overview, retention_days, recording }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [live, setLive] = useState(readLive);
    const [clearing, setClearing] = useState(false);
    const [clearBusy, setClearBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const summary = overview.summary;
    const queue = summary.queue;

    function visit(changes: Partial<Filters>) {
        const next = { ...filters, ...changes };
        router.get(
            index.url(),
            {
                ...(next.status ? { status: next.status } : {}),
                ...(next.search ? { search: next.search } : {}),
                ...(next.queue ? { queue: next.queue } : {}),
                ...(next.range !== '24h' ? { range: next.range } : {}),
                ...(next.per_page !== 25 ? { per_page: next.per_page } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true },
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

    // Live refresh: re-ask for just the figures (and the first page of runs, so a page you are reading never shifts).
    // A refresh is skipped while the tab is hidden or the last one is still running, so a slow server is never piled on.
    const inFlight = useRef(false);
    const onFirstPage = runs.current_page === 1;
    useEffect(() => {
        if (!live) return;

        function refresh() {
            if (document.hidden || inFlight.current) return;
            inFlight.current = true;
            router.reload({
                only: onFirstPage ? ['overview', 'runs'] : ['overview'],
                onFinish: () => {
                    inFlight.current = false;
                },
            });
        }

        const timer = window.setInterval(refresh, POLL_MS);
        document.addEventListener('visibilitychange', refresh);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [live, onFirstPage]);

    // Ticks once a second so "updated 12 s ago" stays honest between refreshes.
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    function toggleLive() {
        const next = !live;
        setLive(next);
        try {
            window.localStorage.setItem(LIVE_KEY, next ? 'on' : 'off');
        } catch {
            // Remembering the choice is a convenience only.
        }
    }

    function confirmClear(scope: ClearScope) {
        setClearBusy(true);
        router.post(
            clear.url(),
            { scope },
            {
                preserveScroll: true,
                onSuccess: () => setClearing(false),
                onFinish: () => setClearBusy(false),
            },
        );
    }

    const narrowed = Boolean(filters.status || filters.search || filters.queue);
    const age = Math.max(0, (now - new Date(overview.generated_at).getTime()) / 1000);
    const phrase = RANGE_PHRASE[overview.range];

    return (
        <ZeusLayout>
            <Head title="Job History" />

            <div className="mx-auto max-w-6xl space-y-6 pb-24">
                <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Job History</h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-500 dark:text-slate-400">
                            What the queues are doing, live. Laravel forgets a job the moment it succeeds, so this is the only place a finished job
                            shows up.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div role="group" aria-label="Time range" className="inline-flex rounded-lg border border-slate-700 bg-slate-800/40 p-0.5">
                            {RANGES.map((range) => (
                                <button
                                    key={range.value}
                                    type="button"
                                    aria-pressed={filters.range === range.value}
                                    onClick={() => visit({ range: range.value })}
                                    className={`min-h-9 rounded-md px-3 text-sm font-semibold transition ${filters.range === range.value ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={toggleLive}
                            aria-pressed={live}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
                        >
                            {live ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                            <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`} />
                            {live ? `Live · ${formatAge(age)}` : 'Paused'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setClearing(true)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-500/40 px-3.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
                        >
                            <TrashIcon className="h-4 w-4" />
                            Clear history
                        </button>
                    </div>
                </div>

                {!recording && (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Recording is switched off (<code>JOB_HISTORY_ENABLED</code>), so nothing new is being added here.
                    </p>
                )}

                <HealthBar health={overview.health} />

                <div className="grid grid-cols-4 gap-4">
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
                        label={`Ran ${phrase}`}
                        value={summary.ran.toLocaleString()}
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

                <JobCharts series={overview.series} range={overview.range} />

                <div className="grid grid-cols-2 items-start gap-4">
                    <QueuePanel queues={overview.queues} selected={filters.queue} onSelect={(name) => visit({ queue: name })} />
                    <WorkerPanel workers={overview.workers} />
                </div>

                <RankedJobs slowest={overview.slowest} flakiest={overview.flakiest} />

                <section aria-label="Job runs">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h2 className="mr-2 text-lg font-bold text-white">Every attempt</h2>
                        <div className="relative min-w-60 flex-1 sm:max-w-xs">
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
                            onChange={(e) => visit({ status: (e.target.value || null) as RunStatus | null })}
                            className="min-h-10 min-w-44 rounded-lg border border-slate-700 bg-slate-800/40 px-3.5 text-sm text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                        >
                            {STATUS_FILTERS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="run-queue" className="sr-only">
                            Queue
                        </label>
                        <select
                            id="run-queue"
                            value={filters.queue ?? ''}
                            onChange={(e) => visit({ queue: e.target.value || null })}
                            className="min-h-10 min-w-40 rounded-lg border border-slate-700 bg-slate-800/40 px-3.5 text-sm text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                        >
                            <option value="">All queues</option>
                            {overview.queues.map((q) => (
                                <option key={q.name} value={q.name}>
                                    {q.name}
                                </option>
                            ))}
                        </select>
                        {narrowed && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    visit({ status: null, search: null, queue: null });
                                }}
                                className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

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
                                <span>Queue · worker</span>
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
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-slate-300">{run.queue ?? '—'}</p>
                                        {run.worker && (
                                            <p className="truncate text-xs text-slate-500" title={run.worker}>
                                                {run.worker}
                                            </p>
                                        )}
                                    </div>
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                        <div className="flex items-center gap-3">
                            <p>{runs.total === 0 ? 'No runs' : `Showing ${runs.from}–${runs.to} of ${runs.total.toLocaleString()}`}</p>
                            <label htmlFor="run-per-page" className="sr-only">
                                Runs per page
                            </label>
                            <select
                                id="run-per-page"
                                value={filters.per_page}
                                onChange={(e) => visit({ per_page: Number(e.target.value) })}
                                className="min-h-9 rounded-lg border border-slate-700 bg-slate-800/40 px-2.5 text-sm text-slate-300 focus:border-primary-500 focus:outline-none"
                            >
                                {[25, 50, 100].map((size) => (
                                    <option key={size} value={size}>
                                        {size} per page
                                    </option>
                                ))}
                            </select>
                        </div>
                        {runs.last_page > 1 && (
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
                        )}
                    </div>

                    <p className="mt-6 text-xs text-slate-600">
                        Kept for {retention_days} days, then cleared automatically. It stores job names, timings and the first line of any error,
                        never the job’s contents.
                    </p>
                </section>
            </div>

            <ClearHistoryModal
                isOpen={clearing}
                counts={overview.clearable}
                busy={clearBusy}
                onCancel={() => setClearing(false)}
                onConfirm={confirmClear}
            />
        </ZeusLayout>
    );
}
