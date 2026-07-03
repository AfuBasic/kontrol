import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    BadgePercent,
    Banknote,
    FileText,
    PenLine,
    RefreshCcw,
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
            color: 'text-rose-600 bg-rose-50 ring-rose-100/50',
            label: 'Failed Payment',
        };
    }
    if (entry.type.includes('refund') || entry.type.includes('reverse')) {
        return {
            icon: RefreshCcw,
            color: 'text-violet-600 bg-violet-50 ring-violet-100/50',
            label: 'Refund Issued',
        };
    }
    if (entry.type.includes('coupon') || entry.type.includes('discount')) {
        return {
            icon: BadgePercent,
            color: 'text-amber-600 bg-amber-50 ring-amber-100/50',
            label: 'Coupon Applied',
        };
    }
    if (entry.type.includes('adjustment')) {
        return {
            icon: PenLine,
            color: 'text-blue-600 bg-blue-50 ring-blue-100/50',
            label: 'Manual Adjustment',
        };
    }
    return {
        icon: entry.direction === 'debit' ? ArrowDownLeft : ArrowUpRight,
        color: 'text-emerald-600 bg-emerald-50 ring-emerald-100/50',
        label: 'Payment Received',
    };
}

export default function ActivityFeed({ entries, loading, onSelect }: Props) {
    if (loading || !entries) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-50/50 ring-1 ring-slate-100/60" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {entries.map((entry, index) => {
                const config = getStatusConfig(entry);
                const Icon = config.icon;

                return (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, ease: 'easeOut' }}
                        onClick={() => onSelect?.(entry.id)}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 transition-all hover:bg-slate-50/40 hover:shadow-md hover:shadow-slate-100/50"
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon Indicator */}
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-4 ${config.color}`}>
                                <Icon className="h-5.5 w-5.5" />
                            </div>

                            {/* Center story details */}
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-xs font-black tracking-wider text-slate-400 uppercase">
                                        {config.label}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400">{entry.time_ago}</span>
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                                    {entry.resident_name || 'System'}
                                    <span className="mx-2 text-slate-300 font-normal">·</span>
                                    <span className="font-semibold text-slate-500">{entry.collection_name || entry.description}</span>
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                    <span className="font-mono text-[11px] font-bold text-slate-400">{entry.reference_number}</span>
                                    {entry.payment_method_label && (
                                        <>
                                            <span className="text-slate-200">•</span>
                                            <span>{entry.payment_method_label}</span>
                                        </>
                                    )}
                                    {entry.coupon_code && (
                                        <>
                                            <span className="text-slate-200">•</span>
                                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">
                                                <BadgePercent className="h-3 w-3" /> {entry.coupon_code}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {entry.reason && (
                                    <p className="mt-2 text-xs text-slate-500 bg-slate-50/65 rounded-lg px-2.5 py-1.5 border border-slate-100/50 inline-block">
                                        <span className="font-bold text-slate-400">Reason:</span> {entry.reason}
                                    </p>
                                )}
                                {entry.failure_reason && (
                                    <p className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50/40 rounded-lg px-2.5 py-1.5 border border-rose-100/50 inline-block">
                                        {entry.failure_reason}
                                    </p>
                                )}
                            </div>

                            {/* Right Pricing details */}
                            <div className="shrink-0 text-right">
                                <p className="text-lg font-black text-slate-950">
                                    {entry.direction === 'debit' ? '−' : ''}
                                    {formatCurrency(entry.amount)}
                                </p>
                                <button className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-slate-600">
                                    <FileText className="h-3 w-3" /> Details
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}