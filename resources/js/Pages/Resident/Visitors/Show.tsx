import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, Shield, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import resident from '@/routes/resident';
import type { AccessCode, CursorPaginatedUsageLogs } from '@/types/access-code';
import { shareAccessCode } from '@/Utils/share';
import PassCard from '@/Components/Resident/PassCard';

type Props = {
    accessCode: AccessCode;
    usageLogs: CursorPaginatedUsageLogs;
    filters: {
        date: string | null;
    };
};

export default function CodeShow({ accessCode, usageLogs, filters }: Props) {
    const [copied, setCopied] = useState(false);
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const cardRef = useRef<HTMLDivElement>(null);

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(accessCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = accessCode.code;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    }

    function revokeCode() {
        if (confirm('Are you sure you want to revoke this code? It will no longer be valid.')) {
            router.delete(resident.visitors.destroy.url(accessCode.id));
        }
    }

    const loadMoreLogs = useCallback(() => {
        if (!usageLogs.next_page_url || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.reload({
            url: usageLogs.next_page_url,
            preserveState: true,
            preserveScroll: true,
            only: ['usageLogs', 'filters'],
            onFinish: () => {
                isLoadingMore.current = false;
            },
        });
    }, [usageLogs.next_page_url]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreLogs();
                }
            },
            { rootMargin: '100px' },
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMoreLogs]);

    function handleDateFilterChange(val: string) {
        setDateFilter(val);
        router.reload({
            data: { date: val },
            preserveState: true,
            preserveScroll: true,
            only: ['usageLogs', 'filters'],
        });
    }

    function clearDateFilter() {
        handleDateFilterChange('');
    }

    const [shareCopied, setShareCopied] = useState(false);
    const [sharing, setSharing] = useState(false);

    async function handleShare() {
        if (sharing) return;
        setSharing(true);
        try {
            const result = await shareAccessCode(accessCode, cardRef.current);
            if (result?.method === 'copy' && result.success) {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 3000);
            }
        } finally {
            setSharing(false);
        }
    }

    const isLongLived = accessCode.type === 'long_lived';
    const isExpired = accessCode.expires_at ? new Date(accessCode.expires_at) < new Date() : false;

    return (
        <>
            <Head title="Access Code Details" />

            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-2 text-2xl font-black text-gray-900"
                >
                    Visitor Pass Details
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-8 text-sm font-bold text-gray-400"
                >
                    Manage visitor credentials and track gate activity
                </motion.p>

                {/* Pass Card Display */}
                <div ref={cardRef} className="mb-6 w-full max-w-sm px-2">
                    <PassCard
                        pass={accessCode}
                        qrUrl={`kontrol://pass/${accessCode.pass_uuid}?token=${accessCode.qr_token}`}
                    />
                </div>

                {/* Source and status details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mb-8 space-y-1 text-xs font-bold text-slate-400"
                >
                    <p className="flex items-center justify-center gap-1.5">
                        Created via:{' '}
                        {accessCode.source === 'telegram' ? (
                            <span className="inline-flex items-center gap-1 font-extrabold text-blue-600">
                                Telegram
                            </span>
                        ) : (
                            <span className="font-extrabold text-gray-900">Mobile App</span>
                        )}
                    </p>
                </motion.div>

                {/* Action Buttons */}
                {accessCode.status === 'active' && !isExpired && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="flex w-full max-w-xs flex-col gap-3"
                    >
                        <div className="flex w-full gap-3">
                            <button
                                onClick={copyCode}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                                    copied
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                             <button
                                onClick={handleShare}
                                disabled={sharing}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none ${
                                    shareCopied
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {sharing ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Preparing...
                                    </>
                                ) : shareCopied ? (
                                    'Copied!'
                                ) : (
                                    'Share'
                                )}
                            </button>
                        </div>

                        <button
                            onClick={revokeCode}
                            className="w-full rounded-xl py-3 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                            Revoke Code
                        </button>
                    </motion.div>
                )}

                {/* Usage History for Long-Lived Codes */}
                {isLongLived && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="mt-10 w-full max-w-md"
                    >
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <Clock className="h-5 w-5 text-gray-400" />
                                    Usage History
                                </h2>
                            </div>

                            {/* Date Filter */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 min-w-0">
                                        <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={dateFilter}
                                            onChange={handleDateFilterChange}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm text-gray-700 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    {dateFilter && (
                                        <button
                                            onClick={clearDateFilter}
                                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Usage List */}
                            {usageLogs.data.length > 0 ? (
                                <div className="space-y-3">
                                    {usageLogs.data.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                                                    <Shield className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-gray-900">Verified by {log.verifier_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(log.verified_at).toLocaleDateString(undefined, {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-700">
                                                    {new Date(log.verified_at).toLocaleTimeString(undefined, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatDistanceToNow(new Date(log.verified_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Load More */}
                                    {usageLogs.next_page_url && (
                                        <div ref={loadMoreRef} className="flex justify-center pt-4">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <User className="mx-auto h-10 w-10 text-gray-200" />
                                    <p className="mt-2 text-sm text-gray-500">
                                        {dateFilter ? 'No usage found for this date' : 'No usage history yet'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.6 }} className="mt-8">
                    <Link href="/resident/home" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        </>
    );
}
