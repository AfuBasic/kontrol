import { motion } from 'framer-motion';
import { AlertCircle, ArrowUpRight, PenLine, RefreshCcw, CornerDownRight, FileText, Gift } from 'lucide-react';
import { useState } from 'react';

interface ActivityEntry {
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

interface Props {
    entries?: ActivityEntry[];
    loading?: boolean;
    onSelect?: (id: string) => void;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

export default function ActivityFeed({ entries, loading, onSelect }: Props) {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    if (loading || !entries) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-slate-450 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                    <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-800">No events found</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or dates.</p>
            </div>
        );
    }

    // Group entries dynamically
    const grouped = entries.reduce(
        (groups, entry) => {
            const date = entry.occurred_at ? new Date(entry.occurred_at) : new Date();
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            let groupKey = 'Earlier';
            if (date.toDateString() === today.toDateString()) {
                groupKey = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                groupKey = 'Yesterday';
            } else {
                const diffTime = Math.abs(today.getTime() - date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    groupKey = 'This Week';
                } else if (diffDays <= 14) {
                    groupKey = 'Last Week';
                } else {
                    groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                }
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(entry);
            return groups;
        },
        {} as Record<string, ActivityEntry[]>,
    );

    const toggleGroup = (key: string) => {
        setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([groupTitle, items]) => {
                // Collapsed by default after one week (if not explicitly toggled)
                const isOlderThanWeek = groupTitle !== 'Today' && groupTitle !== 'Yesterday' && groupTitle !== 'This Week';
                const isExpanded = expandedGroups[groupTitle] ?? true;

                return (
                    <div key={groupTitle} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-1">
                            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{groupTitle}</h3>
                            {isOlderThanWeek && (
                                <button
                                    onClick={() => toggleGroup(groupTitle)}
                                    className="text-[9px] font-black tracking-widest text-[#1F6FDB] uppercase transition hover:text-blue-700"
                                >
                                    {isExpanded ? 'Collapse' : `Expand (${items.length})`}
                                </button>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="relative space-y-4 pl-4 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[1px] before:bg-slate-200">
                                {items.map((entry) => {
                                    const isRefund = entry.type.includes('refund') || entry.type.includes('reverse');
                                    const isFailed = entry.status === 'failed';
                                    const isCoupon = entry.type.includes('coupon') || entry.type.includes('discount');
                                    const isAdjust = entry.type.includes('adjustment');

                                    // Event-specific styled cards
                                    return (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => onSelect?.(entry.id)}
                                            className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-xs active:scale-[0.99]"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    {/* Custom Event Badge */}
                                                    {isFailed && (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
                                                            <AlertCircle className="h-4.5 w-4.5" />
                                                        </div>
                                                    )}
                                                    {isRefund && (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
                                                            <RefreshCcw className="h-4.5 w-4.5" />
                                                        </div>
                                                    )}
                                                    {isCoupon && (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
                                                            <Gift className="h-4.5 w-4.5" />
                                                        </div>
                                                    )}
                                                    {isAdjust && (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                                                            <PenLine className="h-4.5 w-4.5" />
                                                        </div>
                                                    )}
                                                    {!isFailed && !isRefund && !isCoupon && !isAdjust && (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                                                            <ArrowUpRight className="h-4.5 w-4.5" />
                                                        </div>
                                                    )}

                                                    {/* Headline & Details */}
                                                    <div>
                                                        <span
                                                            className={`text-[9px] font-black tracking-widest uppercase ${
                                                                isFailed
                                                                    ? 'text-rose-500'
                                                                    : isRefund
                                                                      ? 'text-violet-600'
                                                                      : isCoupon
                                                                        ? 'text-amber-600'
                                                                        : isAdjust
                                                                          ? 'text-blue-600'
                                                                          : 'text-emerald-600'
                                                            }`}
                                                        >
                                                            {isFailed
                                                                ? '🔴 Payment Failed'
                                                                : isRefund
                                                                  ? '↩ Refund Issued'
                                                                  : isCoupon
                                                                    ? '🏷 Coupon Applied'
                                                                    : isAdjust
                                                                      ? '✍ Manual Adjustment'
                                                                      : '🟢 Payment Received'}
                                                        </span>
                                                        <h4 className="mt-0.5 text-sm leading-tight font-extrabold text-slate-800">
                                                            {entry.resident_name || 'System Action'}
                                                        </h4>
                                                        <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                                            {entry.collection_name || entry.description || 'System accounting ledger action'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Directional Amount */}
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900">
                                                        {entry.direction === 'debit' ? '-' : ''}
                                                        {formatCurrency(entry.amount)}
                                                    </p>
                                                    <span className="text-slate-350 mt-0.5 block text-[10px] font-bold">{entry.time_ago}</span>
                                                </div>
                                            </div>

                                            {/* Contextual Extra Blocks */}
                                            {isFailed && entry.failure_reason && (
                                                <div className="rounded-xl border border-rose-100/50 bg-rose-50/50 p-2.5 text-xs leading-relaxed font-semibold text-rose-700">
                                                    Reason: {entry.failure_reason}
                                                </div>
                                            )}

                                            {isCoupon && entry.coupon_code && (
                                                <div className="flex items-center gap-2 rounded-xl border border-amber-100/50 bg-amber-50/50 p-2.5 text-xs font-bold text-amber-800">
                                                    <span>
                                                        Code:{' '}
                                                        <span className="rounded border border-amber-100 bg-white px-1 py-0.5 font-mono text-[11px]">
                                                            {entry.coupon_code}
                                                        </span>
                                                    </span>
                                                    {entry.reason && <span className="font-normal text-slate-400">({entry.reason})</span>}
                                                </div>
                                            )}

                                            {entry.reason && !isCoupon && (
                                                <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs font-medium text-slate-500">
                                                    <CornerDownRight className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>"{entry.reason}"</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
