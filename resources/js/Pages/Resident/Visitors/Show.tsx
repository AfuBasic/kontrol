import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, Shield, User, Copy, Share2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import PassCard from '@/Components/Resident/PassCard';
import resident from '@/routes/resident';
import type { AccessCode, CursorPaginatedUsageLogs } from '@/types/access-code';
import { shareAccessCode } from '@/Utils/share';

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
        router.visit(usageLogs.next_page_url, {
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
    const isEvent = accessCode.type === 'event';
    const isExpired = accessCode.expires_at ? new Date(accessCode.expires_at) < new Date() : false;

    const getPeakArrivalTime = () => {
        if (!usageLogs.data || usageLogs.data.length === 0) return null;

        const hourCounts: Record<number, number> = {};
        usageLogs.data.forEach((log) => {
            const date = new Date(log.verified_at);
            const hour = date.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        let peakHour = -1;
        let maxCount = 0;
        Object.entries(hourCounts).forEach(([hourStr, count]) => {
            const countNum = count as number;
            if (countNum > maxCount) {
                maxCount = countNum;
                peakHour = parseInt(hourStr, 10);
            }
        });

        if (peakHour === -1) return null;

        const startString = `${peakHour % 12 || 12} ${peakHour >= 12 ? 'PM' : 'AM'}`;
        const endHour = (peakHour + 1) % 24;
        const endString = `${endHour % 12 || 12} ${endHour >= 12 ? 'PM' : 'AM'}`;
        return `${startString} - ${endString}`;
    };

    const peakTime = getPeakArrivalTime();

    return (
        <>
            <Head title="Access Code Details" />

            <div className="flex min-h-[60vh] flex-col items-center justify-center py-6">
                <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-start gap-8 md:grid-cols-12">
                    {/* Left Column: Pass card & Actions (cols: 5 on md+) */}
                    <div className="flex w-full flex-col items-center text-center md:col-span-5">
                        {/* Title (Mobile only) */}
                        <div className="mb-6 text-center md:hidden">
                            <h1 className="text-2xl font-black text-gray-900">Visitor Pass Details</h1>
                            <p className="mt-1 text-sm font-bold text-gray-400">Manage visitor credentials and track gate activity</p>
                        </div>

                        {/* Pass Card Display */}
                        <div ref={cardRef} className="mb-6 w-full max-w-sm px-2">
                            <PassCard pass={accessCode} qrUrl={`kontrol://pass/${accessCode.pass_uuid}?token=${accessCode.qr_token}`} />
                        </div>

                        {/* Action Buttons */}
                        {(accessCode.status === 'active' || accessCode.status === 'scheduled') && !isExpired && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="flex w-full max-w-sm flex-col gap-3 px-2"
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
                                        <Copy className="h-4 w-4" />
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        disabled={sharing}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-75 ${
                                            shareCopied
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {sharing ? (
                                            <>
                                                <svg
                                                    className="h-5 w-5 animate-spin text-gray-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Preparing...
                                            </>
                                        ) : shareCopied ? (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Share2 className="h-4 w-4" />
                                                Share
                                            </>
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
                    </div>

                    {/* Right Column: Info and Usage Logs (cols: 7 on md+) */}
                    <div className="flex w-full flex-col items-center justify-start space-y-6 px-2 text-center md:col-span-7 md:items-stretch md:text-left">
                        {/* Title (Tablet/Desktop only) */}
                        <div className="hidden md:block">
                            <h1 className="text-3xl leading-tight font-black text-gray-900">Visitor Pass Details</h1>
                            <p className="mt-2 text-sm font-bold text-gray-400">Manage visitor credentials and track gate activity</p>
                        </div>

                        {/* Source and status details */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:max-w-none"
                        >
                            <p className="text-xs font-bold text-slate-400">
                                Created via:{' '}
                                {accessCode.source === 'telegram' ? (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-blue-600">Telegram</span>
                                ) : (
                                    <span className="font-extrabold text-gray-900">Mobile App</span>
                                )}
                            </p>
                        </motion.div>

                        {/* Event Pass Statistics Card */}
                        {isEvent && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="w-full max-w-sm rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-sm md:max-w-none"
                            >
                                <h3 className="mb-4 text-base font-black text-slate-900">Event Pass Statistics</h3>
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs font-bold text-slate-400">Total Check-Ins</p>
                                        <p className="mt-1 text-3xl font-black text-slate-900">{accessCode.uses_count ?? 0}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs font-bold text-slate-400">Guest Limit</p>
                                        <p className="mt-1 text-3xl font-black text-slate-900">{accessCode.guest_limit ?? '∞'}</p>
                                    </div>
                                </div>

                                {accessCode.guest_limit && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Capacity Utilized</span>
                                            <span>{Math.min(Math.round(((accessCode.uses_count ?? 0) / accessCode.guest_limit) * 100), 100)}%</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(((accessCode.uses_count ?? 0) / accessCode.guest_limit) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-1 text-right text-[11px] font-bold text-slate-400">
                                            {Math.max(accessCode.guest_limit - (accessCode.uses_count ?? 0), 0)} slots remaining
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                                    {peakTime && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-slate-400">Peak Check-in Hour</span>
                                            <span className="font-black text-slate-900">{peakTime}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-400">Pass Type</span>
                                        <span className="font-black text-slate-900 capitalize">Event / Group</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Static verified card for single use passes that are used */}
                        {!isLongLived && accessCode.status === 'used' && (
                            <div className="w-full max-w-sm rounded-[2rem] border border-emerald-100 bg-emerald-50/50 p-6 text-left shadow-sm md:max-w-none">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-emerald-950">Pass Verified</h4>
                                        <p className="mt-0.5 text-xs font-semibold text-emerald-700/80">
                                            Used {accessCode.used_at ? formatDistanceToNow(new Date(accessCode.used_at), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Usage History for Long-Lived & Event Codes */}
                        {(isLongLived || isEvent) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.5 }}
                                className="w-full max-w-sm md:max-w-none"
                            >
                                <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                                            <Clock className="h-5 w-5 text-gray-400" />
                                            Usage History
                                        </h2>
                                    </div>

                                    {/* Date Filter */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="relative min-w-0 flex-1">
                                                <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={dateFilter}
                                                    onChange={(e) => handleDateFilterChange(e.target.value)}
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
                                                <div
                                                    key={log.id}
                                                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                                                >
                                                    {/* Check In Row */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                                                                <Shield className="h-4 w-4" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-black text-slate-800">Checked In</p>
                                                                <p className="text-[11px] font-bold text-slate-400">
                                                                    Verified by {log.verifier_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-slate-700">
                                                                {new Date(log.verified_at).toLocaleTimeString(undefined, {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400">
                                                                {formatDistanceToNow(new Date(log.verified_at), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Check Out Row / Still in Estate Status */}
                                                    {(log.checked_out_at || !isEvent) &&
                                                        (log.checked_out_at ? (
                                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-100 text-slate-500">
                                                                        <Clock className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className="text-sm font-black text-slate-800">Checked Out</p>
                                                                        <p className="text-[11px] font-bold text-slate-400">
                                                                            Recorded by {log.checkout_verifier_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-black text-slate-700">
                                                                        {new Date(log.checked_out_at).toLocaleTimeString(undefined, {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-slate-400">
                                                                        {formatDistanceToNow(new Date(log.checked_out_at), { addSuffix: true })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-amber-600">
                                                                <span className="flex items-center gap-1.5 text-xs font-black tracking-wider uppercase">
                                                                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                                                    Still in estate
                                                                </span>
                                                            </div>
                                                        ))}
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
                                            <p className="mt-2 text-sm font-medium text-gray-500">
                                                {dateFilter ? 'No usage found for this date' : 'No usage history yet'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Footer Back Button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.6 }}
                            className="w-full pt-4 text-center md:text-left"
                        >
                            <Link href="/resident/home" className="text-sm font-bold text-gray-500 hover:text-gray-700">
                                Back to Home
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
