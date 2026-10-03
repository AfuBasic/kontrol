import axios from 'axios';
import { AlertCircle, ArrowUpRight, CornerDownRight, FileText, Gift, Loader2, PenLine, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import * as TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';

export interface ActivityEntry {
    id: string;
    headline: string;
    type: string;
    direction: string;
    status: string;
    amount: number;
    description: string | null;
    reason: string | null;
    failure_reason: string | null;
    reference_number: string;
    payment_method_label: string | null;
    resident_name: string | null;
    collection_name: string | null;
    coupon_code: string | null;
    occurred_at: string | null;
    time_ago: string | null;
}

export interface ActivityPage {
    entries: ActivityEntry[];
    next_cursor: string | null;
}

interface Props {
    initial?: ActivityPage;
    filters?: Record<string, string>;
    loading?: boolean;
    onSelect?: (id: string) => void;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

const dayKey = (iso: string | null) => (iso ? new Date(iso).toDateString() : 'unknown');

const dayLabel = (key: string) => {
    if (key === 'unknown') return 'Undated';
    const date = new Date(key);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    });
};

const clockTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : '';

type Kind = 'failed' | 'refund' | 'coupon' | 'adjust' | 'payment';

const kindOf = (entry: ActivityEntry): Kind => {
    if (entry.status === 'failed') return 'failed';
    if (entry.type.includes('refund') || entry.type.includes('reverse')) return 'refund';
    if (entry.type.includes('coupon') || entry.type.includes('discount')) return 'coupon';
    if (entry.type.includes('adjustment')) return 'adjust';
    return 'payment';
};

const KIND: Record<Kind, { label: string; tile: string; text: string; Icon: typeof ArrowUpRight }> = {
    payment: { label: 'Payment', tile: 'border-emerald-100 bg-emerald-50 text-emerald-600', text: 'text-emerald-700', Icon: ArrowUpRight },
    refund: { label: 'Refund', tile: 'border-violet-100 bg-violet-50 text-violet-600', text: 'text-violet-700', Icon: RefreshCcw },
    failed: { label: 'Failed', tile: 'border-rose-100 bg-rose-50 text-rose-600', text: 'text-rose-600', Icon: AlertCircle },
    coupon: { label: 'Coupon', tile: 'border-amber-100 bg-amber-50 text-amber-600', text: 'text-amber-700', Icon: Gift },
    adjust: { label: 'Adjustment', tile: 'border-blue-100 bg-blue-50 text-blue-600', text: 'text-blue-700', Icon: PenLine },
};

/** Money collected that day: successful payments in. Failed attempts move no money. */
const collectedFor = (entries: ActivityEntry[]) =>
    entries.reduce((sum, e) => (e.status === 'success' && e.direction === 'credit' ? sum + e.amount : sum), 0);

export default function ActivityFeed({ initial, filters = {}, loading, onSelect }: Props) {
    const [entries, setEntries] = useState<ActivityEntry[]>(initial?.entries ?? []);
    const [cursor, setCursor] = useState<string | null>(initial?.next_cursor ?? null);
    const [fetching, setFetching] = useState(false);
    const [failed, setFailed] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const fetchingRef = useRef(false);

    // A new first page (filters changed, or a refresh) replaces whatever was scrolled in.
    useEffect(() => {
        setEntries(initial?.entries ?? []);
        setCursor(initial?.next_cursor ?? null);
        setFailed(false);
    }, [initial]);

    const loadMore = useCallback(async () => {
        if (!cursor || fetchingRef.current) return;

        fetchingRef.current = true;
        setFetching(true);
        setFailed(false);

        try {
            const { data } = await axios.get<ActivityPage>(TransactionController.timeline.url({ query: { ...filters, cursor } }));
            setEntries((prev) => {
                const seen = new Set(prev.map((e) => e.id));
                return [...prev, ...data.entries.filter((e) => !seen.has(e.id))];
            });
            setCursor(data.next_cursor);
        } catch {
            setFailed(true);
        } finally {
            fetchingRef.current = false;
            setFetching(false);
        }
    }, [cursor, filters]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !cursor || failed) return;

        const observer = new IntersectionObserver((hits) => hits[0]?.isIntersecting && loadMore(), { rootMargin: '400px 0px' });
        observer.observe(node);

        return () => observer.disconnect();
    }, [cursor, failed, loadMore, entries.length]);

    const days = useMemo(() => {
        const groups: Array<{ key: string; items: ActivityEntry[] }> = [];
        for (const entry of entries) {
            const key = dayKey(entry.occurred_at);
            const last = groups[groups.length - 1];
            if (last && last.key === key) last.items.push(entry);
            else groups.push({ key, items: [entry] });
        }
        return groups;
    }, [entries]);

    if (loading || !initial) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
                    <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-800">No events found</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or dates.</p>
            </div>
        );
    }

    return (
        <div className="space-y-7">
            {days.map((day, index) => {
                // The newest day on screen is only complete once an older day (or the end of the list) follows it.
                const isComplete = index < days.length - 1 || cursor === null;
                const collected = collectedFor(day.items);

                return (
                    <section key={day.key}>
                        <div className="flex items-baseline justify-between border-b border-slate-100 px-1 py-2">
                            <h3 className="text-[11px] font-black tracking-widest text-slate-500 uppercase">{dayLabel(day.key)}</h3>
                            {isComplete && (
                                <p className="text-[11px] font-semibold text-slate-400">
                                    {day.items.length} {day.items.length === 1 ? 'event' : 'events'}
                                    <span className="ml-2 font-black text-slate-700">{formatCurrency(collected)} collected</span>
                                </p>
                            )}
                        </div>

                        <ul className="divide-y divide-slate-100">
                            {day.items.map((entry) => {
                                const kind = kindOf(entry);
                                const { Icon, tile, text, label } = KIND[kind];
                                const subline = [entry.collection_name || entry.description, entry.payment_method_label].filter(Boolean).join(' · ');

                                return (
                                    <li key={entry.id}>
                                        <button
                                            type="button"
                                            onClick={() => onSelect?.(entry.id)}
                                            className="flex w-full items-start gap-3 rounded-xl px-1 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100"
                                        >
                                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tile}`}>
                                                <Icon className="h-4 w-4" />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-baseline gap-2">
                                                    <span className="truncate text-sm font-bold text-slate-900">
                                                        {entry.resident_name || 'System action'}
                                                    </span>
                                                    {kind !== 'payment' && (
                                                        <span className={`shrink-0 text-[10px] font-black tracking-wider uppercase ${text}`}>
                                                            {label}
                                                        </span>
                                                    )}
                                                </span>
                                                {subline && (
                                                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">{subline}</span>
                                                )}

                                                {kind === 'failed' && entry.failure_reason && (
                                                    <span className="mt-1 block text-xs font-semibold text-rose-600">{entry.failure_reason}</span>
                                                )}
                                                {kind === 'coupon' && entry.coupon_code && (
                                                    <span className="mt-1 block font-mono text-[11px] font-bold text-amber-700">
                                                        {entry.coupon_code}
                                                    </span>
                                                )}
                                                {entry.reason && kind !== 'coupon' && (
                                                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                                                        <CornerDownRight className="h-3 w-3 shrink-0 text-slate-300" />
                                                        <span className="truncate">{entry.reason}</span>
                                                    </span>
                                                )}
                                            </span>

                                            <span className="shrink-0 text-right">
                                                <span
                                                    className={`block text-sm font-black tabular-nums ${
                                                        kind === 'failed'
                                                            ? 'text-slate-400 line-through'
                                                            : entry.direction === 'debit'
                                                              ? 'text-violet-700'
                                                              : 'text-slate-900'
                                                    }`}
                                                >
                                                    {entry.direction === 'debit' ? '-' : ''}
                                                    {formatCurrency(entry.amount)}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                                                    {clockTime(entry.occurred_at)}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}

            {/* Infinite scroll: the next page loads as this nears the viewport. */}
            {cursor && (
                <div ref={sentinelRef} className="flex min-h-12 items-center justify-center py-2">
                    {failed ? (
                        <button type="button" onClick={loadMore} className="text-xs font-bold text-[#1F6FDB] hover:text-blue-700">
                            Couldn't load more. Tap to retry
                        </button>
                    ) : (
                        fetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    )}
                </div>
            )}
            {!cursor && entries.length > 25 && <p className="py-2 text-center text-[11px] font-semibold text-slate-400">That's everything.</p>}
        </div>
    );
}
