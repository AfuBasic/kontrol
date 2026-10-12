import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { forget, index, retry } from '@/actions/App/Http/Controllers/Zeus/FailedJobController';
import ConfirmActionModal, { type PendingAction } from '@/Components/Zeus/FailedJobs/ConfirmActionModal';
import CausesPanel from '@/Components/Zeus/FailedJobs/CausesPanel';
import FailedJobModal from '@/Components/Zeus/FailedJobs/FailedJobModal';
import FailureChart from '@/Components/Zeus/FailedJobs/FailureChart';
import QueueBreakdown from '@/Components/Zeus/FailedJobs/QueueBreakdown';
import type { FailedJob, Overview, Paginated, Range } from '@/Components/Zeus/FailedJobs/types';
import HealthBar from '@/Components/Zeus/JobHistory/HealthBar';
import LiveButton from '@/Components/Zeus/LiveButton';
import StatTile from '@/Components/Zeus/StatTile';
import TabBar from '@/Components/Zeus/TabBar';
import useLiveReload from '@/Hooks/useLiveReload';
import ZeusLayout from '@/Layouts/ZeusLayout';

type Tab = 'overview' | 'jobs';

type Filters = { search: string | null; queue: string | null; range: Range; tab: Tab; per_page: number };

type Props = {
    filters: Filters;
    /** Only sent on the "Failed jobs" tab. */
    jobs: Paginated<FailedJob> | null;
    overview: Overview;
    limits: { max_at_once: number };
};

const RANGES: Array<{ value: Range; label: string }> = [
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
];
const RANGE_PHRASE: Record<Range, string> = { '24h': 'in 24 hours', '7d': 'in 7 days', '30d': 'in 30 days' };

/** "up 3 on the 7 days before", "down 2 …", or nothing when there is no change to speak of. */
function trend(now: number, before: number, range: Range): string {
    const period = RANGES.find((r) => r.value === range)?.label ?? '';
    if (now === before) return before === 0 ? 'Quiet' : `Same as the ${period} before`;
    const change = Math.abs(now - before);

    return `${now > before ? 'Up' : 'Down'} ${change} on the ${period} before`;
}

const COLUMNS = 'grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1.6fr)_110px_130px_132px]';

function ago(iso: string | null): string {
    if (!iso) return '—';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    return days <= 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
}

export default function FailedJobsIndex({ filters, jobs, overview }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [opened, setOpened] = useState<FailedJob | null>(null);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [busy, setBusy] = useState(false);

    const summary = overview.summary;
    const rows = useMemo(() => jobs?.data ?? [], [jobs]);
    const allOnPage = rows.length > 0 && rows.every((row) => selected.has(row.uuid));
    const byId = useMemo(() => new Map(rows.map((row) => [row.uuid, row])), [rows]);

    // Selections never outlive the page they were made on.
    useEffect(() => setSelected(new Set()), [jobs?.current_page, filters.search, filters.queue]);

    function visit(changes: Partial<Filters>) {
        const next = { ...filters, ...changes };
        router.get(
            index.url(),
            {
                ...(next.search ? { search: next.search } : {}),
                ...(next.queue ? { queue: next.queue } : {}),
                ...(next.range !== '7d' ? { range: next.range } : {}),
                ...(next.tab !== 'overview' ? { tab: next.tab } : {}),
                ...(next.per_page !== 25 ? { per_page: next.per_page } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    // Live refresh: the figures, and the first page of the list so a page you are reading never shifts.
    const { live, toggle: toggleLive } = useLiveReload({
        storageKey: 'zeus.failed-jobs.live',
        only: filters.tab === 'jobs' && (jobs?.current_page ?? 1) === 1 ? ['overview', 'jobs'] : ['overview'],
        intervalMs: 10_000,
    });

    // Search as you type, once typing pauses.
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        const handle = window.setTimeout(() => {
            if ((filters.search ?? '') !== search.trim()) {
                visit({ search: search.trim() || null });
            }
        }, 350);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function toggle(uuid: string) {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    }

    function ask(kind: PendingAction['kind'], ids: string[]) {
        setPending({ kind, ids, repeatsMessages: ids.filter((id) => byId.get(id)?.repeats_messages).length });
    }

    function confirm() {
        if (!pending) return;
        const action = pending.kind === 'retry' ? retry : forget;
        setBusy(true);
        router.post(
            action.url(),
            { ids: pending.ids },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPending(null);
                    setOpened(null);
                    setSelected(new Set());
                },
                onFinish: () => setBusy(false),
            },
        );
    }

    const chosen = [...selected];
    const narrowed = Boolean(filters.search || filters.queue);
    const phrase = RANGE_PHRASE[overview.range];

    return (
        <ZeusLayout>
            <Head title="Failed Jobs" />

            <div className="mx-auto max-w-6xl pb-24">
                <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Failed Jobs</h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-500 dark:text-slate-400">
                            Queue jobs that gave up. Retry the ones that should run again, and forget the rest.
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
                        <LiveButton live={live} onToggle={toggleLive} generatedAt={overview.generated_at} />
                    </div>
                </div>

                <div className="mt-6">
                    <HealthBar health={overview.health} />
                </div>

                <div className="mt-6 grid grid-cols-4 gap-4">
                    <StatTile
                        label="Waiting for a decision"
                        value={summary.total.toLocaleString()}
                        tone={summary.total > 0 ? 'text-white' : 'text-emerald-300'}
                        sub={summary.total > 0 ? 'Retry or forget each one' : 'Nothing is stuck'}
                    />
                    <StatTile
                        label={`Failed ${phrase}`}
                        value={summary.in_range.toLocaleString()}
                        tone={summary.in_range > 0 ? 'text-rose-300' : 'text-emerald-300'}
                        sub={trend(summary.in_range, summary.before_range, overview.range)}
                    />
                    <StatTile
                        label="Would message people again"
                        value={summary.repeat_risk.toLocaleString()}
                        tone={summary.repeat_risk > 0 ? 'text-amber-200' : 'text-emerald-300'}
                        sub={summary.repeat_risk > 0 ? 'Retrying these sends emails or alerts again' : 'Safe to retry'}
                    />
                    <StatTile
                        label="Oldest failure"
                        value={ago(summary.oldest_at)}
                        tone="text-white"
                        sub="Failures older than 30 days are cleared automatically"
                    />
                </div>

                <div className="mt-6">
                    <TabBar
                        label="Failed jobs sections"
                        active={filters.tab}
                        onChange={(tab) => visit({ tab })}
                        tabs={[
                            { id: 'overview', label: 'Overview' },
                            { id: 'jobs', label: 'Failed jobs', badge: summary.total },
                        ]}
                    />
                </div>

                {filters.tab === 'overview' && (
                    <>
                        <div className="mt-6 grid grid-cols-3 items-start gap-4">
                            <div className="col-span-2">
                                <FailureChart series={overview.series} range={overview.range} />
                            </div>
                            <QueueBreakdown
                                queues={overview.queues}
                                selected={filters.queue}
                                onSelect={(queue) => visit(queue ? { queue, tab: 'jobs' } : { queue: null })}
                            />
                        </div>

                        <div className="mt-6">
                            <CausesPanel
                                causes={overview.causes}
                                sampled={summary.sampled}
                                onShow={(job) => {
                                    setSearch(job);
                                    visit({ search: job, tab: 'jobs' });
                                }}
                            />
                        </div>
                    </>
                )}

                {filters.tab === 'jobs' && jobs && (
                    <>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <div className="relative min-w-60 flex-1 sm:max-w-md">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                <label htmlFor="failed-search" className="sr-only">
                                    Search failed jobs
                                </label>
                                <input
                                    id="failed-search"
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search job or error"
                                    className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-800/40 py-2 pr-3.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                                />
                            </div>

                            <label htmlFor="failed-queue" className="sr-only">
                                Queue
                            </label>
                            <select
                                id="failed-queue"
                                value={filters.queue ?? ''}
                                onChange={(e) => visit({ queue: e.target.value || null })}
                                className="min-h-10 min-w-40 rounded-lg border border-slate-700 bg-slate-800/40 px-3.5 text-sm text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                            >
                                <option value="">All queues</option>
                                {overview.queues.map((queue) => (
                                    <option key={queue.name} value={queue.name}>
                                        {queue.name}
                                    </option>
                                ))}
                            </select>
                            {narrowed && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        visit({ search: null, queue: null });
                                    }}
                                    className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
                                >
                                    Clear filters
                                </button>
                            )}

                            <div className="ml-auto flex items-center gap-2">
                                {chosen.length > 0 && <span className="mr-1 text-sm text-slate-400">{chosen.length} selected</span>}
                                <button
                                    type="button"
                                    disabled={chosen.length === 0}
                                    onClick={() => ask('retry', chosen)}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                    Retry selected
                                </button>
                                <button
                                    type="button"
                                    disabled={chosen.length === 0}
                                    onClick={() => ask('forget', chosen)}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                    Forget selected
                                </button>
                            </div>
                        </div>

                        <section aria-label="Failed jobs" className="mt-4">
                            {rows.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
                                    <CheckCircleIcon className="mx-auto h-10 w-10 text-emerald-400/70" />
                                    <p className="mt-3 text-base font-semibold text-white">
                                        {narrowed ? 'No failed jobs match these filters' : 'No failed jobs'}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {narrowed ? 'Try a different word, or clear the filters.' : 'Everything that was queued has run.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-[#0f1423]">
                                    <div
                                        className={`grid items-center gap-4 border-b border-slate-800/70 bg-black/10 px-5 py-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase ${COLUMNS}`}
                                    >
                                        <input
                                            type="checkbox"
                                            aria-label="Select every job on this page"
                                            checked={allOnPage}
                                            onChange={() => setSelected(allOnPage ? new Set() : new Set(rows.map((row) => row.uuid)))}
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                                        />
                                        <span>Job</span>
                                        <span>Error</span>
                                        <span>Queue</span>
                                        <span>Failed</span>
                                        <span className="text-right">Actions</span>
                                    </div>

                                    {rows.map((job) => (
                                        <div
                                            key={job.uuid}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setOpened(job)}
                                            onKeyDown={(e) => {
                                                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    setOpened(job);
                                                }
                                            }}
                                            aria-label={`View ${job.job}`}
                                            className={`grid cursor-pointer items-center gap-4 border-b border-slate-800/60 px-5 py-3.5 transition last:border-b-0 hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none ${COLUMNS} ${selected.has(job.uuid) ? 'bg-primary-500/[0.06]' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${job.job}`}
                                                checked={selected.has(job.uuid)}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={() => toggle(job.uuid)}
                                                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-white" title={job.job_class}>
                                                    {job.job}
                                                </p>
                                                {job.repeats_messages && (
                                                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                                                        <ExclamationTriangleIcon className="h-3 w-3" />
                                                        Retry may repeat messages
                                                    </p>
                                                )}
                                            </div>

                                            <p className="line-clamp-2 text-xs break-words text-slate-400" title={job.error}>
                                                {job.error}
                                            </p>

                                            <p className="truncate text-sm text-slate-300">{job.queue ?? '—'}</p>

                                            <p
                                                className="inline-flex items-center gap-1.5 text-sm text-slate-400"
                                                title={new Date(job.failed_at).toLocaleString()}
                                            >
                                                <ClockIcon className="h-4 w-4 shrink-0" />
                                                {job.failed_human.replace(' ago', '')}
                                            </p>

                                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <IconButton label={`View ${job.job}`} onClick={() => setOpened(job)}>
                                                    <EyeIcon className="h-5 w-5" />
                                                </IconButton>
                                                <IconButton label={`Retry ${job.job}`} onClick={() => ask('retry', [job.uuid])}>
                                                    <ArrowPathIcon className="h-5 w-5" />
                                                </IconButton>
                                                <IconButton label={`Forget ${job.job}`} onClick={() => ask('forget', [job.uuid])} danger>
                                                    <TrashIcon className="h-5 w-5" />
                                                </IconButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                                <div className="flex items-center gap-3">
                                    <p>{jobs.total === 0 ? 'No failed jobs' : `Showing ${jobs.from}–${jobs.to} of ${jobs.total.toLocaleString()}`}</p>
                                    <label htmlFor="failed-per-page" className="sr-only">
                                        Jobs per page
                                    </label>
                                    <select
                                        id="failed-per-page"
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
                                {jobs.last_page > 1 && (
                                    <div className="flex items-center gap-2">
                                        {jobs.prev_page_url && (
                                            <Link
                                                href={jobs.prev_page_url}
                                                preserveScroll
                                                className="rounded-lg border border-slate-700 px-3.5 py-2 font-semibold text-slate-300 transition hover:bg-white/5"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {jobs.next_page_url && (
                                            <Link
                                                href={jobs.next_page_url}
                                                preserveScroll
                                                className="rounded-lg border border-slate-700 px-3.5 py-2 font-semibold text-slate-300 transition hover:bg-white/5"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>

            <FailedJobModal
                job={opened}
                onClose={() => setOpened(null)}
                onRetry={(job) => ask('retry', [job.uuid])}
                onForget={(job) => ask('forget', [job.uuid])}
            />
            <ConfirmActionModal pending={pending} busy={busy} onCancel={() => setPending(null)} onConfirm={confirm} />
        </ZeusLayout>
    );
}

function IconButton({
    label,
    onClick,
    danger = false,
    children,
}: {
    label: string;
    onClick: () => void;
    danger?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label.split(' ')[0]}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 ${danger ? 'hover:text-rose-300' : 'hover:text-white'}`}
        >
            {children}
        </button>
    );
}
