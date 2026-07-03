interface TodaySummaryData {
    money_in_today: number;
    money_out_today: number;
    pending_today: number;
    failed_today: number;
}

interface Props {
    summary?: TodaySummaryData;
    loading?: boolean;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

export default function TodaySummary({ summary, loading }: Props) {
    if (loading || !summary) {
        return (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-slate-50/50 p-4 ring-1 ring-slate-100/50">
                <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-2xl bg-slate-50/50 px-5 py-4 text-sm text-slate-500 ring-1 ring-slate-100/50">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Today</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                    <strong className="font-extrabold text-slate-900">{formatCurrency(summary.money_in_today)}</strong> received
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <strong className="font-bold text-slate-700">{summary.money_out_today > 0 ? formatCurrency(summary.money_out_today) : '0'}</strong> refunded
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <strong className="font-bold text-slate-700">{summary.pending_today}</strong> pending
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <strong className="font-bold text-slate-700">{summary.failed_today}</strong> failed
                </span>
            </div>
        </div>
    );
}