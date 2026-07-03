import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, BadgePercent, PenLine, RefreshCcw } from 'lucide-react';

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
    time_ago: string | null;
}

interface Props {
    entries?: ActivityEntry[];
    loading?: boolean;
    onSelect?: (id: string) => void;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

function iconForEntry(entry: ActivityEntry) {
    if (entry.status === 'failed' || entry.type.includes('failed')) return AlertTriangle;
    if (entry.type.includes('refund') || entry.direction === 'debit') return RefreshCcw;
    if (entry.type.includes('coupon') || entry.type.includes('discount')) return BadgePercent;
    if (entry.type.includes('adjustment') || entry.type.includes('waiver')) return PenLine;
    return entry.direction === 'debit' ? ArrowDownLeft : ArrowUpRight;
}

function toneForEntry(entry: ActivityEntry) {
    if (entry.status === 'failed' || entry.type.includes('failed')) return 'text-rose-600 bg-rose-50';
    if (entry.type.includes('refund') || entry.direction === 'debit') return 'text-violet-600 bg-violet-50';
    if (entry.type.includes('coupon') || entry.type.includes('discount')) return 'text-amber-600 bg-amber-50';
    if (entry.type.includes('adjustment')) return 'text-slate-600 bg-slate-50';
    return 'text-emerald-600 bg-emerald-50';
}

export default function ActivityFeed({ entries, loading, onSelect }: Props) {
    if (loading || !entries) {
        return (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse bg-slate-50/50 px-5" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
            <div className="divide-y divide-slate-100">
                {entries.map((entry, index) => {
                    const Icon = iconForEntry(entry);
                    const tone = toneForEntry(entry);

                    return (
                        <motion.button
                            key={entry.id}
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => onSelect?.(entry.id)}
                            className="group flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80"
                        >
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="font-semibold text-slate-900">{entry.headline}</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {entry.direction === 'debit' ? '−' : ''}
                                        {formatCurrency(entry.amount)}
                                    </p>
                                </div>
                                {entry.resident_name && (
                                    <p className="mt-0.5 text-sm text-slate-600">{entry.resident_name}</p>
                                )}
                                <p className="mt-0.5 text-sm text-slate-500">
                                    {entry.collection_name || entry.description}
                                    {entry.coupon_code && (
                                        <span className="ml-1 font-medium text-amber-700">{entry.coupon_code}</span>
                                    )}
                                </p>
                                {entry.reason && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        <span className="font-medium text-slate-400">Reason:</span> {entry.reason}
                                    </p>
                                )}
                                {entry.failure_reason && (
                                    <p className="mt-1 text-xs text-rose-600">{entry.failure_reason}</p>
                                )}
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-xs text-slate-400">{entry.time_ago}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}