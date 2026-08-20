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
            <Head title={`${error.exception_class} - Error Details`} />

            <div className="space-y-6 pb-16">
                {/* Back Button & Header Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/zeus/error-logs"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to all error logs</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {!isResolved && (
                            <button
                                type="button"
                                onClick={handleResolve}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Mark Resolved</span>
                            </button>
                        )}

                        {isResolved && (
                            <button
                                type="button"
                                onClick={handleReopen}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Reopen Issue</span>
                            </button>
                        )}

                        {!isIgnored && !isResolved && (
                            <button
                                type="button"
                                onClick={handleIgnore}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
                            >
                                <EyeOff className="h-3.5 w-3.5" />
                                <span>Ignore</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Record</span>
                        </button>
                    </div>
                </div>

                {/* Hero Error Banner Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${
                                isBackend
                                    ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-500/20'
                                    : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/20'
                            }`}
                        >
                            {isBackend ? <Server className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                            <span>{isBackend ? 'Backend PHP Exception' : 'Frontend Client JS Error'}</span>
                        </span>

                        <span
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${
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
                            <span className="capitalize">{error.status}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700">
                            {error.occurrences_count > 50 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                            <span>{error.occurrences_count} total occurrences</span>
                        </span>
                    </div>

                    <h1 className="mt-4 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                        {error.exception_class}
                    </h1>

                    <div className="mt-3 rounded-2xl bg-slate-900 p-4 text-rose-300 font-mono text-sm leading-relaxed">
                        {error.message}
                    </div>

                    {error.file && (
                        <div className="mt-4 flex items-center gap-2 text-xs font-mono font-medium text-slate-500">
                            <FileCode className="h-4 w-4 text-slate-400" />
                            <span>
                                {error.file}
                                {error.line ? ` : line ${error.line}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Context and Metadata Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Timing & Occurrences */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>Timeline & Frequency</span>
                        </h3>
                        <dl className="mt-4 space-y-3 divide-y divide-slate-100 text-xs">
                            <div className="flex justify-between pt-2">
                                <dt className="font-medium text-slate-500">First Seen</dt>
                                <dd className="font-bold text-slate-900">{error.first_seen_at ? new Date(error.first_seen_at).toLocaleString() : 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between pt-3">
                                <dt className="font-medium text-slate-500">Last Seen</dt>
                                <dd className="font-bold text-slate-900">{error.last_seen_at ? new Date(error.last_seen_at).toLocaleString() : 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between pt-3">
                                <dt className="font-medium text-slate-500">Occurrences</dt>
                                <dd className="font-extrabold text-slate-900">{error.occurrences_count}</dd>
                            </div>
                            <div className="flex justify-between pt-3">
                                <dt className="font-medium text-slate-500">Fingerprint</dt>
                                <dd className="truncate max-w-[160px] font-mono text-slate-600" title={error.fingerprint}>
                                    {error.fingerprint}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Request Context */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <Activity className="h-4 w-4 text-slate-400" />
                            <span>Request / User Context</span>
                        </h3>
                        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
                            <div>
                                <dt className="font-medium text-slate-500">URL</dt>
                                <dd className="mt-0.5 truncate font-mono font-bold text-slate-900" title={error.context?.url || 'N/A'}>
                                    {error.context?.url || 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">HTTP Method</dt>
                                <dd className="mt-0.5 font-mono font-bold text-slate-900">{error.context?.method || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">IP Address</dt>
                                <dd className="mt-0.5 font-mono font-bold text-slate-900">{error.context?.ip || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">User Email</dt>
                                <dd className="mt-0.5 font-bold text-slate-900">{error.context?.user_email || 'Guest / Unauthenticated'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Estate ID</dt>
                                <dd className="mt-0.5 font-bold text-slate-900">{error.context?.estate_id || 'None'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">User Agent</dt>
                                <dd className="mt-0.5 truncate font-mono text-slate-600" title={error.context?.user_agent || 'N/A'}>
                                    {error.context?.user_agent || 'N/A'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Stack Trace Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Stack Trace</h3>
                            <p className="text-xs font-medium text-slate-400">Complete raw execution call stack</p>
                        </div>

                        {error.stack_trace && (
                            <button
                                type="button"
                                onClick={handleCopyTrace}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copied ? 'Copied!' : 'Copy Stack Trace'}</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-4">
                        {error.stack_trace ? (
                            <pre className="max-h-[500px] overflow-auto rounded-2xl bg-slate-950 p-5 font-mono text-xs leading-relaxed text-slate-200">
                                {error.stack_trace}
                            </pre>
                        ) : (
                            <p className="py-8 text-center text-xs font-medium text-slate-400">No stack trace recorded for this error.</p>
                        )}
                    </div>
                </div>
            </div>
        </ZeusLayout>
    );
}
