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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
            </div>
        );
    }

    const items = [
        { label: 'Money In', value: formatCurrency(summary.money_in_today), tone: 'text-emerald-600' },
        { label: 'Money Out', value: formatCurrency(summary.money_out_today), tone: 'text-slate-700' },
        { label: 'Pending', value: summary.pending_today.toString(), tone: 'text-amber-600' },
        { label: 'Failed', value: summary.failed_today.toString(), tone: 'text-rose-600' },
    ];

    return (
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
            <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Today</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {items.map((item) => (
                    <div key={item.label}>
                        <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                        <p className={`mt-0.5 text-lg font-bold tracking-tight ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}