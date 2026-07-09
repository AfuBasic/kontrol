import {
    ArrowDownTrayIcon,
    BanknotesIcon,
    CalendarIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '@/Components/Partner/EmptyState';
import PageHeader from '@/Components/Partner/PageHeader';
import Surface from '@/Components/Partner/Surface';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount } from '@/Utils/money';

interface Earning {
    id: number;
    month: string;
    month_label: string;
    total_amount: number;
    revenue_amount: number;
    settled_at: string | null;
    is_settled: boolean;
}

interface Summary {
    total_earned: number;
    pending_commissions: number;
    current_month_earnings: number;
    previous_month_earnings: number;
    month_over_month_change: number | null;
    projected_settlement: number;
    next_settlement_date: string;
    next_settlement_iso: string;
    days_until_settlement: number;
}

interface ChartPoint {
    month: string;
    label: string;
    total_amount: number;
    revenue_amount: number;
}

interface TimelineItem {
    id: number;
    label: string;
    amount: number;
    settled_at: string | null;
    is_settled: boolean;
}

interface Props {
    earnings: {
        data: Earning[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    summary: Summary;
    chart: ChartPoint[];
    timeline: TimelineItem[];
}

function exportCsv(rows: Earning[]) {
    const header = ['Month', 'Revenue (NGN)', 'Commission (NGN)', 'Status', 'Settled On'];
    const body = rows.map((row) => [
        row.month_label,
        (row.revenue_amount / 100).toFixed(2),
        (row.total_amount / 100).toFixed(2),
        row.is_settled ? 'Settled' : 'Pending',
        row.settled_at ? new Date(row.settled_at).toLocaleDateString('en-NG') : '',
    ]);
    const csv = [header, ...body].map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontrol-partner-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function PartnerEarnings({ earnings, summary, chart, timeline }: Props) {
    const chartData = (chart ?? []).map((row) => ({ ...row, amount: row.total_amount / 100 }));
    const mom = summary.month_over_month_change;

    return (
        <PartnerLayout>
            <Head title="Earnings" />

            <div className="space-y-5">
                <PageHeader
                    title="Earnings"
                    description="Commissions, settlements, and monthly performance."
                    actions={
                        <button
                            type="button"
                            onClick={() => exportCsv(earnings.data)}
                            disabled={earnings.data.length === 0}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12px] font-semibold text-stone-700 shadow-sm ring-1 ring-stone-900/[0.06] transition hover:bg-stone-50 disabled:opacity-40 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/[0.07]"
                        >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            CSV statement
                        </button>
                    }
                />

                <div className="grid auto-rows-fr grid-cols-2 gap-3 xl:grid-cols-4">
                    <Surface
                        padding="sm"
                        stretch
                        className="min-h-[96px] bg-emerald-50/50 ring-emerald-500/10 dark:bg-emerald-950/25 dark:ring-emerald-500/15"
                    >
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">Lifetime</span>
                        </div>
                        <p className="mt-auto pt-2 text-xl font-semibold tabular-nums tracking-tight text-emerald-900 dark:text-emerald-100">
                            {formatAmount(summary.total_earned)}
                        </p>
                    </Surface>
                    <Surface padding="sm" stretch className="min-h-[96px]">
                        <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                            <ChartBarIcon className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">This month</span>
                        </div>
                        <p className="mt-auto pt-2 text-xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white">
                            {formatAmount(summary.current_month_earnings)}
                        </p>
                        {mom !== null && (
                            <p className={`mt-0.5 text-[11px] font-medium ${mom >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {mom >= 0 ? '+' : ''}
                                {mom}% vs last month
                            </p>
                        )}
                    </Surface>
                    <Surface
                        padding="sm"
                        stretch
                        className="min-h-[96px] bg-amber-50/50 ring-amber-500/10 dark:bg-amber-950/25 dark:ring-amber-500/15"
                    >
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">Pending / projected</span>
                        </div>
                        <p className="mt-auto pt-2 text-xl font-semibold tabular-nums tracking-tight text-amber-900 dark:text-amber-100">
                            {formatAmount(summary.projected_settlement)}
                        </p>
                    </Surface>
                    <Surface padding="sm" stretch className="min-h-[96px]">
                        <div className="flex items-center gap-1.5 text-stone-500">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">Next settlement</span>
                        </div>
                        <p className="mt-auto pt-2 text-xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white">
                            {summary.days_until_settlement}
                            <span className="ml-1 text-[12px] font-semibold text-stone-400">days</span>
                        </p>
                        <p className="text-[11px] text-stone-400">{summary.next_settlement_date}</p>
                    </Surface>
                </div>

                <div className="grid items-stretch gap-3.5 lg:grid-cols-5">
                    <Surface className="lg:col-span-3" padding="md" stretch>
                        <h2 className="text-[13px] font-semibold tracking-tight text-stone-900 dark:text-white">
                            Monthly trend
                        </h2>
                        <p className="mb-3 text-[11px] text-stone-500">Last 12 months of settled commission</p>
                        {chartData.length === 0 ? (
                            <EmptyState
                                icon={BanknotesIcon}
                                title="No chart data yet"
                                description="Once commissions settle, you'll see growth and dips here at a glance."
                                nextStep="Submit more estates so residents can generate revenue."
                                action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                                size="sm"
                                className="flex-1 py-6"
                            />
                        ) : (
                            <div className="min-h-[208px] flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 10, fill: '#a8a29e' }}
                                            stroke="transparent"
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#a8a29e' }}
                                            width={40}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) =>
                                                `₦${Number(v).toLocaleString('en-NG', { notation: 'compact' })}`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value) => [formatAmount(Number(value) * 100), 'Commission']}
                                            contentStyle={{
                                                borderRadius: 14,
                                                border: 'none',
                                                boxShadow: '0 12px 40px -12px rgba(0,0,0,0.18)',
                                                fontSize: 12,
                                                background: 'rgba(28,25,23,0.92)',
                                                color: '#fff',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#059669"
                                            strokeWidth={2}
                                            fill="url(#earnFill)"
                                            animationDuration={800}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Surface>

                    <Surface className="lg:col-span-2" padding="md" stretch>
                        <h2 className="text-[13px] font-semibold tracking-tight text-stone-900 dark:text-white">
                            Settlement timeline
                        </h2>
                        <p className="mb-3 text-[11px] text-stone-500">Recent settlement events</p>
                        {(timeline ?? []).length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                                <p className="text-[12px] font-medium text-stone-500">No settlements yet</p>
                                <p className="mt-1 max-w-[200px] text-[11px] text-stone-400">
                                    Settled months appear here as your estates convert.
                                </p>
                            </div>
                        ) : (
                            <ol className="relative flex-1 space-y-0 border-l border-stone-200/80 pl-4 dark:border-slate-700">
                                {(timeline ?? []).map((item) => (
                                    <li key={item.id} className="relative pb-3.5 last:pb-0">
                                        <span
                                            className={`absolute top-1.5 -left-[1.15rem] h-2 w-2 rounded-full ring-3 ring-white dark:ring-slate-900 ${
                                                item.is_settled ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`}
                                        />
                                        <p className="text-[12px] font-semibold text-stone-900 dark:text-white">
                                            {item.label}
                                        </p>
                                        <p className="text-[12px] font-semibold tabular-nums text-stone-800 dark:text-slate-200">
                                            {formatAmount(item.amount)}
                                        </p>
                                        <p className="text-[10px] text-stone-400">
                                            {item.is_settled ? `Settled ${item.settled_at}` : 'Pending settlement'}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Surface>
                </div>

                <Surface padding="none">
                    <div className="border-b border-stone-100 px-4 py-3 dark:border-slate-800">
                        <h2 className="text-[13px] font-semibold text-stone-900 dark:text-white">Commission history</h2>
                        <p className="text-[11px] text-stone-500">
                            {earnings.total} month{earnings.total !== 1 ? 's' : ''} recorded
                        </p>
                    </div>

                    {earnings.data.length === 0 ? (
                        <EmptyState
                            icon={BanknotesIcon}
                            title="No commissions yet"
                            description="You'll see monthly breakdowns once estates you referred have paying residents."
                            nextStep="Submit estates and track activation in My Estates."
                            action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                            secondaryAction={{ label: 'My Estates', href: '/partner/partner-requests' }}
                        />
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-[13px]">
                                    <thead className="bg-stone-50/80 text-[10px] font-semibold tracking-wide text-stone-500 uppercase dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Month</th>
                                            <th className="px-4 py-2 text-right">Revenue</th>
                                            <th className="px-4 py-2 text-right">Commission</th>
                                            <th className="px-4 py-2 text-center">Status</th>
                                            <th className="px-4 py-2 text-right">Settled</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                                        {earnings.data.map((earning, i) => (
                                            <motion.tr
                                                key={earning.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="px-4 py-2.5 font-medium text-stone-900 dark:text-white">
                                                    {earning.month_label}
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-stone-600 dark:text-slate-300">
                                                    {formatAmount(earning.revenue_amount)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
                                                    {formatAmount(earning.total_amount)}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    {earning.is_settled ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                            Settled
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-[11px] text-stone-500">
                                                    {earning.settled_at
                                                        ? new Date(earning.settled_at).toLocaleDateString('en-NG', {
                                                              dateStyle: 'medium',
                                                          })
                                                        : '—'}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2 p-3 md:hidden">
                                {earnings.data.map((earning) => (
                                    <article
                                        key={earning.id}
                                        className="rounded-lg border border-stone-200/80 bg-stone-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
                                    >
                                        <div className="flex justify-between gap-2">
                                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                {earning.month_label}
                                            </p>
                                            <span className="text-[10px] font-semibold text-stone-500">
                                                {earning.is_settled ? 'Settled' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-lg font-bold tabular-nums text-stone-900 dark:text-white">
                                            {formatAmount(earning.total_amount)}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            {earnings.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5 dark:border-slate-800">
                                    <p className="text-[11px] text-stone-500">
                                        Page {earnings.current_page} of {earnings.last_page}
                                    </p>
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            disabled={!earnings.prev_page_url}
                                            onClick={() => earnings.prev_page_url && router.visit(earnings.prev_page_url)}
                                            className="rounded-md border border-stone-200 px-2.5 py-1 text-[11px] font-semibold disabled:opacity-40 dark:border-slate-700"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!earnings.next_page_url}
                                            onClick={() => earnings.next_page_url && router.visit(earnings.next_page_url)}
                                            className="rounded-md border border-stone-200 px-2.5 py-1 text-[11px] font-semibold disabled:opacity-40 dark:border-slate-700"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Surface>
            </div>
        </PartnerLayout>
    );
}
