import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    BadgePercent,
    PenLine,
    RefreshCcw,
    CornerDownRight,
    Clock
} from 'lucide-react';

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

function getStatusConfig(entry: ActivityEntry) {
    if (entry.status === 'failed') {
        return {
            icon: AlertCircle,
            color: 'text-rose-500 bg-rose-50 border-rose-100/50',
            label: 'Payment Failed',
        };
    }
    if (entry.status === 'pending') {
        return {
            icon: Clock,
            color: 'text-amber-500 bg-amber-50 border-amber-100/50',
            label: 'Payment Pending',
        };
    }
    if (entry.type.includes('refund') || entry.type.includes('reverse')) {
        return {
            icon: RefreshCcw,
            color: 'text-violet-500 bg-violet-50 border-violet-100/50',
            label: 'Refund Issued',
        };
    }
    if (entry.type.includes('coupon') || entry.type.includes('discount')) {
        return {
            icon: BadgePercent,
            color: 'text-indigo-500 bg-indigo-50 border-indigo-100/50',
            label: 'Discount Applied',
        };
    }
    if (entry.type.includes('adjustment')) {
        return {
            icon: PenLine,
            color: 'text-blue-500 bg-blue-50 border-blue-100/50',
            label: 'Manual Adjustment',
        };
    }
    return {
        icon: entry.direction === 'debit' ? ArrowDownLeft : ArrowUpRight,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-100/50',
        label: 'Payment Received',
    };
}

export default function ActivityFeed({ entries, loading, onSelect }: Props) {
    if (loading || !entries) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-50/70 border border-slate-100" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return null;
    }

    // Group entries dynamically by Day
    const grouped = entries.reduce((groups, entry) => {
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
            groupKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(entry);
        return groups;
    }, {} as Record<string, ActivityEntry[]>);

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([groupTitle, items]) => (
                <div key={groupTitle} className="space-y-3">
                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase pl-2">
                        {groupTitle}
                    </h3>
                    <div className="space-y-2">
                        {items.map((entry, index) => {
                            const config = getStatusConfig(entry);
                            const Icon = config.icon;

                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    onClick={() => onSelect?.(entry.id)}
                                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100/70 bg-white p-4.5 transition-all hover:border-slate-200 hover:shadow-xs active:scale-[0.99] cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Minimal Circle Status Icon */}
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${config.color}`}>
                                            <Icon className="h-4.5 w-4.5" />
                                        </div>

                                        {/* Content details */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase leading-none">
                                                    {config.label}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[10px] font-bold text-slate-400">{entry.time_ago}</span>
                                            </div>
                                            <h4 className="mt-1 text-sm font-extrabold text-slate-900 leading-tight truncate">
                                                {entry.resident_name || 'System Account'}
                                                {entry.collection_name && (
                                                    <>
                                                        <span className="mx-1.5 font-normal text-slate-300">/</span>
                                                        <span className="font-semibold text-slate-500">{entry.collection_name}</span>
                                                    </>
                                                )}
                                            </h4>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-semibold text-slate-400">
                                                <span className="font-mono text-slate-400">{entry.reference_number}</span>
                                                {entry.payment_method_label && (
                                                    <>
                                                        <span className="text-slate-200">•</span>
                                                        <span>{entry.payment_method_label}</span>
                                                    </>
                                                )}
                                                {entry.coupon_code && (
                                                    <>
                                                        <span className="text-slate-200">•</span>
                                                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 py-0.5 text-amber-700">
                                                            🏷 {entry.coupon_code}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {entry.reason && (
                                                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                                                    <CornerDownRight className="h-3 w-3 text-slate-300" />
                                                    <span>{entry.reason}</span>
                                                </div>
                                            )}
                                            {entry.failure_reason && (
                                                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-rose-500 font-bold">
                                                    <CornerDownRight className="h-3 w-3 text-rose-200" />
                                                    <span>{entry.failure_reason}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Amount details */}
                                    <div className="shrink-0 text-right">
                                        <p className="text-base font-black text-slate-900">
                                            {entry.direction === 'debit' ? '−' : ''}
                                            {formatCurrency(entry.amount)}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}