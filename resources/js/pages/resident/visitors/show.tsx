import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, Shield, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccessCode, CursorPaginatedUsageLogs } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';
import resident from '@/routes/resident';

import { shareAccessCode } from '@/utils/share';

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

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(accessCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = accessCode.code;
            document.body.appendChild(textArea);
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

    const loadMore = useCallback(() => {
        if (!usageLogs.next_page_url || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.get(
            usageLogs.next_page_url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['usageLogs'],
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [usageLogs.next_page_url]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 },
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore]);

    function handleDateFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setDateFilter(value);

        router.get(
            resident.visitors.show.url(accessCode.id),
            value ? { date: value } : {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['usageLogs', 'filters'],
            },
        );
    }

    function clearDateFilter() {
        setDateFilter('');
        router.get(
            resident.visitors.show.url(accessCode.id),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['usageLogs', 'filters'],
            },
        );
    }

    const isLongLived = accessCode.type === 'long_lived';

    return (
        <ResidentLayout>
            <Head title="Access Code Details" />

            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-2 text-2xl font-semibold text-gray-900"
                >
                    Access Code
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-8 text-gray-500"
                >
                    Share this code with your visitor
                </motion.p>

                {/* Code Display */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mb-6 w-full max-w-xs"
                >
                    <div
                        className={`rounded-3xl border-2 bg-white p-8 shadow-lg ${accessCode.status === 'active' ? 'border-gray-100' : 'border-red-100 bg-red-50'}`}
                    >
                        <p
                            className={`font-mono text-5xl font-bold tracking-[0.2em] ${accessCode.status === 'active' ? 'text-gray-900' : 'text-red-400 line-through'}`}
                        >
                            {accessCode.code}
                        </p>
                        {accessCode.status !== 'active' && (
                            <p className="mt-2 text-sm font-medium tracking-widest text-red-500 uppercase">{accessCode.status}</p>
                        )}
                    </div>
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mb-8 space-y-2 text-sm text-gray-500"
                >
                    {accessCode.visitor_name && (
                        <p>
                            For: <span className="font-medium text-gray-900">{accessCode.visitor_name}</span>
                        </p>
                    )}
                    <p>
                        Type: <span className="font-medium text-gray-900">{accessCode.type === 'long_lived' ? 'Long-lived' : 'Single Use'}</span>
                    </p>
                    <p className="flex items-center justify-center gap-1.5">
                        Created via:{' '}
                        {accessCode.source === 'telegram' ? (
                            <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.285.011.436z" />
                                </svg>
                                Telegram
                            </span>
                        ) : (
                            <span className="font-medium text-gray-900">Web App</span>
                        )}
                    </p>
                    <p>
                        {accessCode.status === 'active' ? (
                            <>
                                Expires: <span className="font-medium text-amber-600">{accessCode.time_remaining}</span>
                            </>
                        ) : accessCode.status === 'used' ? (
                            <>
                                Arrived: <span className="font-medium text-blue-600">{new Date(accessCode.used_at!).toLocaleString()}</span>
                            </>
                        ) : accessCode.status === 'revoked' ? (
                            <>
                                Revoked: <span className="font-medium text-red-600">{new Date(accessCode.revoked_at!).toLocaleString()}</span>
                            </>
                        ) : (
                            <span>Expired: {new Date(accessCode.expires_at).toLocaleDateString()}</span>
                        )}
                    </p>
                    {accessCode.status !== 'active' && (
                        <p className="text-xs text-gray-400">Created: {new Date(accessCode.created_at).toLocaleDateString()}</p>
                    )}
                </motion.div>

                {/* Action Buttons */}
                {accessCode.status === 'active' && (
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
                                onClick={() => shareAccessCode(accessCode)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
                            >
                                Share
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
                                    <div className="relative flex-1">
                                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={dateFilter}
                                            onChange={handleDateFilterChange}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                                                    <Shield className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Verified by {log.verifier_name}
                                                    </p>
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
        </ResidentLayout>
    );
}
