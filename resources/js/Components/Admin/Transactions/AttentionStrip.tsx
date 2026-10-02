import { AlertCircle, ChevronRight, Hourglass } from 'lucide-react';

export interface AttentionData {
    failed: { count: number; amount: number };
    stuck: { count: number; amount: number };
}

export type AttentionKind = 'failed' | 'stuck';

interface Props {
    data?: AttentionData;
    onReview: (kind: AttentionKind) => void;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Things that need a human: payments that failed or stalled and were never made good.
 * Renders nothing when there is nothing to do, so a calm ledger stays calm.
 */
export default function AttentionStrip({ data, onReview }: Props) {
    if (!data) return null;

    const rows = [
        data.failed.count > 0 && {
            kind: 'failed' as const,
            Icon: AlertCircle,
            tone: 'text-rose-600 bg-rose-50 border-rose-100',
            title: `${plural(data.failed.count, 'failed payment', 'failed payments')} to follow up`,
            detail: `${formatCurrency(data.failed.amount)} not yet paid, last 7 days`,
        },
        data.stuck.count > 0 && {
            kind: 'stuck' as const,
            Icon: Hourglass,
            tone: 'text-amber-600 bg-amber-50 border-amber-100',
            title: `${plural(data.stuck.count, 'payment', 'payments')} still pending after 2 hours`,
            detail: `${formatCurrency(data.stuck.amount)} may be abandoned or waiting on the gateway`,
        },
    ].filter(Boolean) as Array<{ kind: AttentionKind; Icon: typeof AlertCircle; tone: string; title: string; detail: string }>;

    if (rows.length === 0) return null;

    return (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
            {rows.map(({ kind, Icon, tone, title, detail }) => (
                <button
                    key={kind}
                    type="button"
                    onClick={() => onReview(kind)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100"
                >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
                        <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900">{title}</span>
                        <span className="block truncate text-xs font-medium text-slate-500">{detail}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-[#1F6FDB]">
                        Review <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                </button>
            ))}
        </div>
    );
}
