import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Bug,
    Search,
    Trash2,
    CheckCircle2,
    EyeOff,
    RotateCcw,
    AlertTriangle,
    Activity,
    Server,
    Globe,
    Flame,
    Clock,
    ChevronRight,
    ArrowUpRight,
} from 'lucide-react';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface ErrorItem {
    id: number;
    fingerprint: string;
    source: 'backend' | 'frontend';
    level: string;
    exception_class: string;
    message: string;
    file: string | null;
    line: number | null;
    status: 'unresolved' | 'ignored' | 'resolved';
    occurrences_count: number;
    first_seen_at: string | null;
    last_seen_at: string | null;
    last_seen_human: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    errors: PaginatedData<ErrorItem>;
    filters: {
        status: string;
        source: string;
        search: string;
    };
    metrics: {
        unresolved_count: number;
        last_24h_count: number;
        backend_count: number;
        frontend_count: number;
        top_repeater_class: string;
        top_repeater_occurrences: number;
    };
}

export default function ErrorLogsIndex({ errors, filters, metrics }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [sourceFilter, setSourceFilter] = useState(filters.source || 'all');
    const [isClearingAll, setIsClearingAll] = useState(false);
    const [isClearingResolved, setIsClearingResolved] = useState(false);

    const applyFilters = (newStatus?: string, newSource?: string, newSearch?: string) => {
        router.get(
            '/zeus/error-logs',
            {
                status: newStatus !== undefined ? newStatus : statusFilter,
                source: newSource !== undefined ? newSource : sourceFilter,
                search: newSearch !== undefined ? newSearch : search,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(undefined, undefined, search);
    };

    const handleResolve = (id: number) => {
        router.patch(`/zeus/error-logs/${id}/resolve`, {}, { preserveScroll: true });
    };

    const handleIgnore = (id: number) => {
        router.patch(`/zeus/error-logs/${id}/ignore`, {}, { preserveScroll: true });
    };

    const handleReopen = (id: number) => {
        router.patch(`/zeus/error-logs/${id}/reopen`, {}, { preserveScroll: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this error record?')) {
            router.delete(`/zeus/error-logs/${id}`, { preserveScroll: true });
        }
    };

    const handleClearAll = () => {
        if (confirm('Are you sure you want to permanently clear ALL error logs? This cannot be undone.')) {
            setIsClearingAll(true);
            router.post('/zeus/error-logs/clear-all', {}, {
                onFinish: () => setIsClearingAll(false),
            });
        }
    };

    const handleClearResolved = () => {
        if (confirm('Clear all resolved and ignored error logs?')) {
            setIsClearingResolved(true);
            router.post('/zeus/error-logs/clear-resolved', {}, {
                onFinish: () => setIsClearingResolved(false),
            });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <ZeusLayout>
            <Head title="System Error Logs - Zeus" />

            <div className="space-y-8 pb-16">
                {/* Header Strip & Bulk Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
                                <Bug className="h-5 w-5" />
                            </span>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Error Logs & Observability</h1>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Real-time exception tracking across backend runtime and frontend client errors with 7-day rolling retention.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleClearResolved}
                            disabled={isClearingResolved}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>{isClearingResolved ? 'Clearing...' : 'Clear Resolved'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={isClearingAll}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{isClearingAll ? 'Clearing All...' : 'Clear All Logs'}</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Unresolved count */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unresolved Issues</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                <AlertTriangle className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{metrics.unresolved_count}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">Active incidents needing review</p>
                    </div>

                    {/* 24h Activity */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Past 24 Hours</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Clock className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{metrics.last_24h_count}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">Errors registered today</p>
                    </div>

                    {/* Breakdown */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Source Split</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Activity className="h-4 w-4" />
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-3">
                            <div>
                                <span className="text-xl font-black text-slate-900">{metrics.backend_count}</span>
                                <span className="ml-1 text-[11px] font-bold text-slate-400">Backend</span>
                            </div>
                            <span className="text-slate-300">/</span>
                            <div>
                                <span className="text-xl font-black text-slate-900">{metrics.frontend_count}</span>
                                <span className="ml-1 text-[11px] font-bold text-slate-400">Client JS</span>
                            </div>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-400">Active unresolved breakdown</p>
                    </div>

                    {/* Most Repeated */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Frequency</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                <Flame className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-3 truncate text-base font-black tracking-tight text-slate-900" title={metrics.top_repeater_class}>
                            {metrics.top_repeater_class}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                            {metrics.top_repeater_occurrences > 0 ? `${metrics.top_repeater_occurrences} total occurrences` : 'No repeats'}
                        </p>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[
                            { id: 'all', label: 'All Status' },
                            { id: 'unresolved', label: 'Unresolved' },
                            { id: 'ignored', label: 'Ignored' },
                            { id: 'resolved', label: 'Resolved' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(tab.id);
                                    applyFilters(tab.id, undefined, undefined);
                                }}
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                    statusFilter === tab.id
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}

                        <div className="mx-1 h-5 w-px bg-slate-200" />

                        {/* Source Filter */}
                        {[
                            { id: 'all', label: 'All Sources' },
                            { id: 'backend', label: 'Backend PHP' },
                            { id: 'frontend', label: 'Frontend JS' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    setSourceFilter(s.id);
                                    applyFilters(undefined, s.id, undefined);
                                }}
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                    sourceFilter === s.id
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
                        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search class, message or file..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                        />
                    </form>
                </div>

                {/* Error Log Records List */}
                {errors.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">All clear! No errors found</h3>
                        <p className="mt-1 max-w-sm text-xs font-medium text-slate-400">
                            There are currently no recorded errors matching your active filters.
                        </p>
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                        {errors.data.map((log) => {
                            const isBackend = log.source === 'backend';
                            const isResolved = log.status === 'resolved';
                            const isIgnored = log.status === 'ignored';

                            return (
                                <motion.div
                                    key={log.id}
                                    variants={itemVariants}
                                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md ${
                                        isResolved
                                            ? 'border-slate-200/70 bg-slate-50/50 opacity-75'
                                            : isIgnored
                                              ? 'border-slate-200/80 bg-slate-50/80 opacity-85'
                                              : 'border-slate-200 bg-white shadow-xs'
                                    }`}
                                >
                                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                        {/* Main Error Info */}
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Source Badge */}
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                                        isBackend
                                                            ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-500/20'
                                                            : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/20'
                                                    }`}
                                                >
                                                    {isBackend ? <Server className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                                    <span>{isBackend ? 'Backend' : 'Client JS'}</span>
                                                </span>

                                                {/* Status Badge */}
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                                        isResolved
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : isIgnored
                                                              ? 'bg-slate-200/60 text-slate-700'
                                                              : 'bg-rose-50 text-rose-700'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            isResolved ? 'bg-emerald-500' : isIgnored ? 'bg-slate-400' : 'bg-rose-500'
                                                        }`}
                                                    />
                                                    <span className="capitalize">{log.status}</span>
                                                </span>

                                                {/* Occurrences Counter */}
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                                                        log.occurrences_count > 50
                                                            ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-500/20'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {log.occurrences_count > 50 && <Flame className="h-3 w-3 text-orange-500" />}
                                                    <span>{log.occurrences_count}x</span>
                                                </span>

                                                {/* Last Seen Timestamp */}
                                                <span className="text-[11px] font-medium text-slate-400">
                                                    Last seen {log.last_seen_human}
                                                </span>
                                            </div>

                                            {/* Exception Class & Message */}
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black tracking-tight text-slate-900">
                                                    {log.exception_class}
                                                </h4>
                                                <p className="line-clamp-2 text-xs font-mono font-medium text-slate-600">
                                                    {log.message}
                                                </p>
                                            </div>

                                            {/* File & Line location */}
                                            {log.file && (
                                                <p className="truncate text-[11px] font-mono text-slate-400">
                                                    {log.file}
                                                    {log.line ? `:${log.line}` : ''}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions Group */}
                                        <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                                            {/* Details link */}
                                            <Link
                                                href={`/zeus/error-logs/${log.id}`}
                                                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
                                            >
                                                <span>View Trace</span>
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Link>

                                            {/* Quick Resolve Button */}
                                            {!isResolved && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleResolve(log.id)}
                                                    title="Mark Resolved"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Reopen Button */}
                                            {isResolved && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReopen(log.id)}
                                                    title="Reopen"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Quick Ignore Button */}
                                            {!isIgnored && !isResolved && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleIgnore(log.id)}
                                                    title="Ignore Error"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                                >
                                                    <EyeOff className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Delete record */}
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(log.id)}
                                                title="Delete Log"
                                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Pagination Controls */}
                {errors.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                        <p className="text-xs font-medium text-slate-500">
                            Showing <span className="font-bold text-slate-900">{errors.from}</span> to{' '}
                            <span className="font-bold text-slate-900">{errors.to}</span> of{' '}
                            <span className="font-bold text-slate-900">{errors.total}</span> errors
                        </p>

                        <div className="flex items-center gap-2">
                            {errors.prev_page_url && (
                                <Link
                                    href={errors.prev_page_url}
                                    preserveState
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
                                >
                                    Previous
                                </Link>
                            )}
                            {errors.next_page_url && (
                                <Link
                                    href={errors.next_page_url}
                                    preserveState
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ZeusLayout>
    );
}
