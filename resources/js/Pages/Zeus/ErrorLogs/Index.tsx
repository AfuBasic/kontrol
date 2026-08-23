import { Head, Link, router } from '@inertiajs/react';
import { Terminal, Search, Trash2, CheckCircle2, EyeOff, RotateCcw, AlertCircle, Server, Globe, Flame, Clock, ArrowUpRight, Cpu } from 'lucide-react';
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
            router.post(
                '/zeus/error-logs/clear-all',
                {},
                {
                    onFinish: () => setIsClearingAll(false),
                },
            );
        }
    };

    const handleClearResolved = () => {
        if (confirm('Clear all resolved and ignored error logs?')) {
            setIsClearingResolved(true);
            router.post(
                '/zeus/error-logs/clear-resolved',
                {},
                {
                    onFinish: () => setIsClearingResolved(false),
                },
            );
        }
    };

    return (
        <ZeusLayout>
            <Head title="System Telemetry & Error Logs - Zeus" />

            <div className="space-y-6 pb-20 font-mono">
                {/* Top IDE Banner */}
                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-5 shadow-2xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Terminal Header Info */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                                </div>
                                <span className="text-xs text-slate-500">|</span>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                    <Terminal className="h-3.5 w-3.5" />
                                    <span className="font-bold tracking-tight">kontrol://observability.telemetry</span>
                                </div>
                            </div>
                            <h1 className="font-sans text-xl font-bold tracking-tight text-white sm:text-2xl">System Exception & Crash Center</h1>
                            <p className="font-sans text-xs text-slate-400">
                                Unified real-time telemetry across PHP execution environments and React client runtimes.
                            </p>
                        </div>

                        {/* Top Controls */}
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleClearResolved}
                                disabled={isClearingResolved}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span>{isClearingResolved ? 'Flushing...' : 'Flush Resolved'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={isClearingAll}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-900/50 bg-rose-950/40 px-3.5 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-900/60 active:scale-95 disabled:opacity-50"
                            >
                                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                                <span>{isClearingAll ? 'Purging All...' : 'Purge All Logs'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* IDE Stats Telemetry Panel */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Unresolved */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1117] p-4 transition-all hover:border-slate-700">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-semibold tracking-wider text-rose-400 uppercase">ERRORS.UNRESOLVED</span>
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                        </div>
                        <p className="mt-2 text-3xl font-black tracking-tight text-white">{metrics.unresolved_count}</p>
                        <div className="mt-2 flex items-center gap-1 font-sans text-[11px] text-slate-500">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-rose-500" />
                            <span>Active unhandled exceptions</span>
                        </div>
                    </div>

                    {/* Past 24 Hours */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1117] p-4 transition-all hover:border-slate-700">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase">TIMELINE.24H_DELTA</span>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="mt-2 text-3xl font-black tracking-tight text-white">{metrics.last_24h_count}</p>
                        <p className="mt-2 font-sans text-[11px] text-slate-500">Recorded in last 24h cycle</p>
                    </div>

                    {/* Source Split */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1117] p-4 transition-all hover:border-slate-700">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">RUNTIME.BREAKDOWN</span>
                            <Cpu className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <div>
                                <span className="text-2xl font-bold text-purple-400">{metrics.backend_count}</span>
                                <span className="ml-1 text-[10px] text-slate-500">PHP</span>
                            </div>
                            <span className="text-slate-700">/</span>
                            <div>
                                <span className="text-2xl font-bold text-cyan-400">{metrics.frontend_count}</span>
                                <span className="ml-1 text-[10px] text-slate-500">JS</span>
                            </div>
                        </div>
                        <p className="mt-2 font-sans text-[11px] text-slate-500">Backend vs Client runtime</p>
                    </div>

                    {/* Top Repeater */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1117] p-4 transition-all hover:border-slate-700">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[11px] font-semibold tracking-wider text-orange-400 uppercase">TOP_INCIDENT.FREQ</span>
                            <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        <p className="mt-2 truncate text-sm font-bold text-orange-300" title={metrics.top_repeater_class}>
                            {metrics.top_repeater_class}
                        </p>
                        <p className="mt-2 font-sans text-[11px] text-slate-500">
                            {metrics.top_repeater_occurrences > 0 ? `${metrics.top_repeater_occurrences} occurrences logged` : 'No repeats logged'}
                        </p>
                    </div>
                </div>

                {/* Filter and Command Toolbar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0d1117] p-3 shadow-xl lg:flex-row lg:items-center lg:justify-between">
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {[
                            { id: 'all', label: 'ALL_STATUS' },
                            { id: 'unresolved', label: 'UNRESOLVED' },
                            { id: 'ignored', label: 'IGNORED' },
                            { id: 'resolved', label: 'RESOLVED' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(tab.id);
                                    applyFilters(tab.id, undefined, undefined);
                                }}
                                className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
                                    statusFilter === tab.id
                                        ? 'bg-slate-800 text-white shadow-xs ring-1 ring-slate-700'
                                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}

                        <div className="mx-1 h-4 w-px bg-slate-800" />

                        {[
                            { id: 'all', label: 'ALL_SOURCES' },
                            { id: 'backend', label: 'PHP_BACKEND' },
                            { id: 'frontend', label: 'JS_CLIENT' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    setSourceFilter(s.id);
                                    applyFilters(undefined, s.id, undefined);
                                }}
                                className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
                                    sourceFilter === s.id
                                        ? 'bg-indigo-950 text-indigo-300 ring-1 ring-indigo-800'
                                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]" noValidate>
                        <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="grep --filter (class, file, message)..."
                            className="w-full rounded-xl border border-slate-800 bg-[#090d13] py-2 pr-4 pl-9 text-xs text-slate-200 placeholder:text-slate-600 focus:border-slate-700 focus:bg-[#06090e] focus:outline-none"
                        />
                    </form>
                </div>

                {/* Log Stream Output */}
                {errors.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-[#0d1117] p-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/40 text-emerald-400 ring-1 ring-emerald-900/50">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-white">0 Exceptions Detected</h3>
                        <p className="mt-1 max-w-sm font-sans text-xs text-slate-500">
                            No logs currently matching the active filters. Telemetry queue is clear.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {errors.data.map((log) => {
                            const isBackend = log.source === 'backend';
                            const isResolved = log.status === 'resolved';
                            const isIgnored = log.status === 'ignored';

                            return (
                                <div
                                    key={log.id}
                                    className={`group relative overflow-hidden rounded-xl border transition-all duration-150 ${
                                        isResolved
                                            ? 'border-slate-800/60 bg-[#090d13]/60 opacity-60'
                                            : isIgnored
                                              ? 'border-slate-800/80 bg-[#090d13]/80 opacity-75'
                                              : 'border-slate-800 bg-[#0d1117] hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        {/* Main Details */}
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                {/* Source Tag */}
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold ${
                                                        isBackend
                                                            ? 'bg-purple-950/60 text-purple-300 ring-1 ring-purple-800/40'
                                                            : 'bg-cyan-950/60 text-cyan-300 ring-1 ring-cyan-800/40'
                                                    }`}
                                                >
                                                    {isBackend ? <Server className="h-3 w-3" /> : <Globe className="h-3 w-3 text-cyan-400" />}
                                                    <span>{isBackend ? 'PHP' : 'JS'}</span>
                                                </span>

                                                {/* Status Tag */}
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold ${
                                                        isResolved
                                                            ? 'bg-emerald-950/50 text-emerald-400 ring-1 ring-emerald-900/40'
                                                            : isIgnored
                                                              ? 'bg-slate-800 text-slate-400'
                                                              : 'bg-rose-950/60 text-rose-400 ring-1 ring-rose-900/40'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            isResolved ? 'bg-emerald-400' : isIgnored ? 'bg-slate-500' : 'bg-rose-500'
                                                        }`}
                                                    />
                                                    <span className="uppercase">{log.status}</span>
                                                </span>

                                                {/* Count Pill */}
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-extrabold ${
                                                        log.occurrences_count > 50
                                                            ? 'bg-orange-950 text-orange-400 ring-1 ring-orange-900'
                                                            : 'bg-slate-800 text-slate-300'
                                                    }`}
                                                >
                                                    {log.occurrences_count > 50 && <Flame className="h-3 w-3 text-orange-500" />}
                                                    <span>{log.occurrences_count}x</span>
                                                </span>

                                                {/* Timestamp with Clock */}
                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                    <Clock className="h-3 w-3 text-slate-500" />
                                                    <span>
                                                        {log.last_seen_at
                                                            ? `${new Date(log.last_seen_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${new Date(log.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                                                            : log.last_seen_human}
                                                    </span>
                                                    <span className="text-slate-600">({log.last_seen_human})</span>
                                                </span>
                                            </div>

                                            {/* Exception Class & Message */}
                                            <div>
                                                <span className="text-xs font-bold text-rose-400">{log.exception_class}</span>
                                                <p className="mt-0.5 line-clamp-1 font-mono text-xs text-slate-300">{log.message}</p>
                                            </div>

                                            {/* File & Line location */}
                                            {log.file && (
                                                <p className="truncate font-mono text-[11px] text-slate-500">
                                                    {log.file}
                                                    {log.line ? `:${log.line}` : ''}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions Toolbar */}
                                        <div className="flex shrink-0 items-center gap-1.5 pt-2 sm:pt-0">
                                            <Link
                                                href={`/zeus/error-logs/${log.id}`}
                                                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700 active:scale-95"
                                            >
                                                <span>inspect_trace()</span>
                                                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                                            </Link>

                                            {!isResolved && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleResolve(log.id)}
                                                    title="Resolve Exception"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-emerald-800 hover:bg-emerald-950/40 hover:text-emerald-400 active:scale-95"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            {isResolved && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReopen(log.id)}
                                                    title="Reopen Exception"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white active:scale-95"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            {!isIgnored && !isResolved && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleIgnore(log.id)}
                                                    title="Ignore Exception"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white active:scale-95"
                                                >
                                                    <EyeOff className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(log.id)}
                                                title="Delete Record"
                                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 transition hover:border-rose-900 hover:bg-rose-950/40 hover:text-rose-400 active:scale-95"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {errors.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
                        <p>
                            INDEX [{errors.from}..{errors.to}] OF {errors.total}
                        </p>

                        <div className="flex items-center gap-2">
                            {errors.prev_page_url && (
                                <Link
                                    href={errors.prev_page_url}
                                    preserveState
                                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 transition hover:bg-slate-800"
                                >
                                    &lt; PREV
                                </Link>
                            )}
                            {errors.next_page_url && (
                                <Link
                                    href={errors.next_page_url}
                                    preserveState
                                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 transition hover:bg-slate-800"
                                >
                                    NEXT &gt;
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ZeusLayout>
    );
}
