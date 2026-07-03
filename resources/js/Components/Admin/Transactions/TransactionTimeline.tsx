import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, BadgePercent, PenLine, RefreshCcw } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface TimelineEntry {
    id: string;
    type: string;
    type_label: string;
    direction: string;
    status: string;
    amount: number;
    description: string | null;
    reason: string | null;
    reference_number: string;
    payment_method_label: string | null;
    resident_name: string | null;
    collection_name: string | null;
    coupon_code: string | null;
    created_by_name: string | null;
    created_at: string;
}

interface Props {
    entries?: TimelineEntry[];
    loading?: boolean;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

const formatTime = (dateString: string) => {
    const date = parseISO(dateString);
    const dayLabel = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d');
    return `${dayLabel} · ${format(date, 'h:mm a')}`;
};

function iconForType(type: string, direction: string) {
    if (type.includes('refund') || type === 'reversed_payment') return RefreshCcw;
    if (type.includes('coupon') || type.includes('discount')) return BadgePercent;
    if (type.includes('adjustment') || type.includes('waiver')) return PenLine;
    return direction === 'debit' ? ArrowDownLeft : ArrowUpRight;
}

function toneForType(type: string, direction: string) {
    if (type.includes('failed')) return 'border-rose-200 bg-rose-50 text-rose-700';
    if (type.includes('refund') || direction === 'debit') return 'border-violet-200 bg-violet-50 text-violet-700';
    if (type.includes('coupon') || type.includes('discount')) return 'border-amber-200 bg-amber-50 text-amber-700';
    if (type.includes('adjustment')) return 'border-slate-200 bg-slate-50 text-slate-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

export default function TransactionTimeline({ entries, loading }: Props) {
    if (loading || !entries) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No financial activity yet. Transactions will appear here as money moves through the estate.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {entries.map((entry, index) => {
                const Icon = iconForType(entry.type, entry.direction);
                const tone = toneForType(entry.type, entry.direction);

                return (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.4 }}
                        className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-[#1F6FDB]/20 hover:shadow-md"
                    >
                        <div className="flex items-start gap-3">
                            <div className={`rounded-xl border p-2.5 ${tone}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-slate-900">{entry.type_label}</p>
                                        {entry.resident_name && <p className="text-sm text-slate-600">{entry.resident_name}</p>}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(entry.amount)}</p>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    {entry.collection_name || entry.description}
                                    {entry.coupon_code && ` · ${entry.coupon_code}`}
                                </p>
                                {entry.reason && <p className="mt-1 text-xs text-slate-500">Reason: {entry.reason}</p>}
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                    <span>{formatTime(entry.created_at)}</span>
                                    {entry.payment_method_label && <span>{entry.payment_method_label}</span>}
                                    <span>Receipt {entry.reference_number}</span>
                                    {entry.created_by_name && <span>by {entry.created_by_name}</span>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}