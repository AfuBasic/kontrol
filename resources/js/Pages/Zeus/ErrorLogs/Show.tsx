import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    EyeOff,
    RotateCcw,
    Trash2,
    Copy,
    Server,
    Globe,
    Clock,
    User,
    Building2,
    Check,
    Flame,
    FileCode,
    Terminal,
    Activity,
    Layers,
    Cpu,
} from 'lucide-react';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface ErrorDetail {
    id: number;
    fingerprint: string;
    source: 'backend' | 'frontend';
    level: string;
    exception_class: string;
    message: string;
    file: string | null;
    line: number | null;
    stack_trace: string | null;
    context: Record<string, any> | null;
    status: 'unresolved' | 'ignored' | 'resolved';
    occurrences_count: number;
    first_seen_at: string | null;
    last_seen_at: string | null;
    last_seen_human: string;
}

interface Props {
    error: ErrorDetail;
}

export default function ErrorLogsShow({ error }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopyTrace = () => {
        if (!error.stack_trace) return;
        navigator.clipboard.writeText(error.stack_trace);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleResolve = () => {
        router.patch(`/zeus/error-logs/${error.id}/resolve`, {}, { preserveScroll: true });
    };

    const handleIgnore = () => {
        router.patch(`/zeus/error-logs/${error.id}/ignore`, {}, { preserveScroll: true });
    };

    const handleReopen = () => {
        router.patch(`/zeus/error-logs/${error.id}/reopen`, {}, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (confirm('Delete this error record?')) {
            router.delete(`/zeus/error-logs/${error.id}`);
        }
    };

    const isBackend = error.source === 'backend';
    const isResolved = error.status === 'resolved';
    const isIgnored = error.status === 'ignored';

    return (
        <ZeusLayout>
            <Head title={`${error.exception_class} - Stack Trace Telemetry`} />

            <div className="space-y-6 pb-20 font-mono text-slate-200">
                {/* Header Back & Action Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/zeus/error-logs"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>cd .. &lt;return to telemetry&gt;</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {!isResolved && (
                            <button
                                type="button"
                                onClick={handleResolve}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/80 bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-xs transition hover:bg-emerald-900 active:scale-95"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>mark_resolved()</span>
                            </button>
                        )}

                        {isResolved && (
                            <button
                                type="button"
                                onClick={handleReopen}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 shadow-xs transition hover:bg-slate-800 active:scale-95"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>reopen()</span>
                            </button>
                        )}

                        {!isIgnored && !isResolved && (
                            <button
                                type="button"
                                onClick={handleIgnore}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 shadow-xs transition hover:bg-slate-800 active:scale-95"
                            >
                                <EyeOff className="h-3.5 w-3.5" />
                                <span>ignore()</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-900/60 bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-900/60 active:scale-95"
                        >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            <span>delete_entry()</span>
                        </button>
                    </div>
                </div>

                {/* Hero Exception Card */}
                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-6 shadow-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                                isBackend
                                    ? 'bg-purple-950/60 text-purple-300 ring-1 ring-purple-800/40'
                                    : 'bg-cyan-950/60 text-cyan-300 ring-1 ring-cyan-800/40'
                            }`}
                        >
                            {isBackend ? <Server className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                            <span>{isBackend ? 'PHP_EXCEPTION' : 'JS_RUNTIME_ERROR'}</span>
                        </span>

                        <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
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
                            <span className="uppercase">{error.status}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-extrabold text-slate-300">
                            {error.occurrences_count > 50 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                            <span>{error.occurrences_count}x occurrences</span>
                        </span>
                    </div>

                    <h1 className="mt-3 text-lg font-bold tracking-tight text-rose-400 sm:text-xl">
                        {error.exception_class}
                    </h1>

                    <div className="mt-3 rounded-xl border border-slate-800 bg-[#06090e] p-4 text-rose-200 text-xs leading-relaxed">
                        <code>{error.message}</code>
                    </div>

                    {error.file && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <FileCode className="h-4 w-4 text-slate-500" />
                            <span>
                                {error.file}
                                {error.line ? `:${error.line}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Telemetry and Environment Grid */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Timing and Frequency */}
                    <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-5 shadow-xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span>TIMELINE_STATS</span>
                        </div>
                        <dl className="mt-4 space-y-2.5 divide-y divide-slate-800/80 text-xs">
                            <div className="flex justify-between pt-2">
                                <dt className="text-slate-400">FIRST_SEEN</dt>
                                <dd className="font-bold text-white">
                                    {error.first_seen_at ? new Date(error.first_seen_at).toLocaleString() : 'N/A'}
                                </dd>
                            </div>
                            <div className="flex justify-between pt-2.5">
                                <dt className="text-slate-400">LAST_SEEN</dt>
                                <dd className="font-bold text-white">
                                    {error.last_seen_at ? new Date(error.last_seen_at).toLocaleString() : 'N/A'}
                                </dd>
                            </div>
                            <div className="flex justify-between pt-2.5">
                                <dt className="text-slate-400">TOTAL_REPEATS</dt>
                                <dd className="font-extrabold text-orange-400">{error.occurrences_count}</dd>
                            </div>
                            <div className="flex justify-between pt-2.5">
                                <dt className="text-slate-400">FINGERPRINT</dt>
                                <dd className="truncate max-w-[140px] text-slate-400" title={error.fingerprint || ''}>
                                    {error.fingerprint || 'N/A'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Environment and Request Context */}
                    <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-5 shadow-xl lg:col-span-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                            <Activity className="h-4 w-4 text-slate-500" />
                            <span>EXECUTION_CONTEXT</span>
                        </div>
                        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
                            <div>
                                <dt className="text-slate-500">REQUEST_URL</dt>
                                <dd className="mt-0.5 truncate font-bold text-slate-200" title={String(error.context?.url || 'N/A')}>
                                    {String(error.context?.url || 'N/A')}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">HTTP_METHOD</dt>
                                <dd className="mt-0.5 font-bold text-emerald-400">{String(error.context?.method || 'N/A')}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">CLIENT_IP</dt>
                                <dd className="mt-0.5 font-bold text-slate-200">{String(error.context?.ip || 'N/A')}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">USER_EMAIL</dt>
                                <dd className="mt-0.5 font-bold text-slate-200">{String(error.context?.user_email || 'guest@anonymous')}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">ESTATE_ID</dt>
                                <dd className="mt-0.5 font-bold text-slate-200">{String(error.context?.estate_id || 'null')}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">USER_AGENT</dt>
                                <dd className="mt-0.5 truncate text-slate-400" title={String(error.context?.user_agent || 'N/A')}>
                                    {String(error.context?.user_agent || 'N/A')}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Call Stack Panel */}
                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-bold text-white">RAW_CALL_STACK</span>
                        </div>

                        {error.stack_trace && (
                            <button
                                type="button"
                                onClick={handleCopyTrace}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 active:scale-95"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copied ? 'COPIED' : 'COPY_STACK_TRACE'}</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-4">
                        {error.stack_trace ? (
                            <pre className="max-h-[550px] overflow-auto rounded-xl bg-[#06090e] p-4 text-xs leading-relaxed text-slate-300 selection:bg-rose-900 selection:text-white">
                                {error.stack_trace}
                            </pre>
                        ) : (
                            <p className="py-8 text-center text-xs text-slate-500">No stack trace available for this event.</p>
                        )}
                    </div>
                </div>
            </div>
        </ZeusLayout>
    );
}
