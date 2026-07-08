import {
    ArrowDownTrayIcon,
    BanknotesIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

interface PaginatedEarnings {
    data: Earning[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Summary {
    total_earned: number;
    pending_commissions: number;
    current_month_earnings: number;
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

interface Props {
    earnings: PaginatedEarnings;
    summary: Summary;
    chart: ChartPoint[];
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

    const csv = [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kontrol-partner-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
}

export default function PartnerEarnings({ earnings, summary, chart }: Props) {
    const chartData = (chart ?? []).map((row) => ({
        ...row,
        amount: row.total_amount / 100,
    }));

    return (
        <PartnerLayout>
            <Head title="Earnings – Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-xl bg-emerald-500 opacity-40 blur" />
                            <div className="relative rounded-xl bg-emerald-600 p-2.5">
                                <BanknotesIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Earnings</h1>
                            <p className="text-slate-500">Your commission history and settlement timeline</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => exportCsv(earnings.data)}
                        disabled={earnings.data.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>

                {/* Hero counters */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900">
                        <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">Lifetime settled</span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-100">{formatAmount(summary.total_earned)}</p>
                    </div>
                    <div className="rounded-2xl border border-primary-200 bg-linear-to-br from-primary-50 to-white p-5 shadow-sm dark:border-primary-900/40 dark:from-primary-950/30 dark:to-slate-900">
                        <div className="mb-2 flex items-center gap-2 text-primary-700 dark:text-primary-300">
                            <ChartBarIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">This month</span>
                        </div>
                        <p className="text-3xl font-bold text-primary-800 dark:text-primary-100">
                            {formatAmount(summary.current_month_earnings)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900">
                        <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                            <ClockIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">Pending</span>
                        </div>
                        <p className="text-3xl font-bold text-amber-800 dark:text-amber-100">
                            {formatAmount(summary.pending_commissions)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-2 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <CalendarIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">Next settlement</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {summary.days_until_settlement}{' '}
                            <span className="text-base font-semibold text-slate-500">days</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{summary.next_settlement_date}</p>
                    </div>
                </section>

                {/* Chart */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Monthly earnings</h2>
                    <p className="mb-4 text-sm text-slate-500">Settled commission trend (last 12 months)</p>
                    {chartData.length === 0 ? (
                        <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
                            <BanknotesIcon className="mb-2 h-10 w-10 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">No chart data yet</p>
                        </div>
                    ) : (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="earningsAreaFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        stroke="#94a3b8"
                                        width={48}
                                        tickFormatter={(v) => `₦${Number(v).toLocaleString('en-NG', { notation: 'compact' })}`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatAmount(Number(value) * 100), 'Commission']}
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2.5} fill="url(#earningsAreaFill)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>

                {/* Table + mobile cards */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Monthly breakdown</h2>
                        <p className="text-sm text-slate-500">
                            {earnings.total} month{earnings.total !== 1 ? 's' : ''} of commission history
                        </p>
                    </div>

                    {earnings.data.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <BanknotesIcon className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                            <p className="font-medium text-slate-500">No earnings yet</p>
                            <p className="mt-1 text-sm text-slate-400">
                                Commissions appear once estates you referred have active subscribers.
                            </p>
                            <Link
                                href="/partner/partner-requests/create"
                                className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:underline"
                            >
                                Submit an estate
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-xs font-medium tracking-wider text-slate-500 uppercase dark:bg-slate-800/60">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Month</th>
                                            <th className="px-6 py-3 text-right">Revenue generated</th>
                                            <th className="px-6 py-3 text-right">Commission earned</th>
                                            <th className="px-6 py-3 text-center">Status</th>
                                            <th className="px-6 py-3 text-right">Settled on</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {earnings.data.map((earning, i) => (
                                            <motion.tr
                                                key={earning.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: i * 0.02 }}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {earning.month_label}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                                                    {formatAmount(earning.revenue_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                                                    {formatAmount(earning.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {earning.is_settled ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                            <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
                                                            Settled
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                            <ClockIcon className="h-3.5 w-3.5" aria-hidden />
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-slate-500">
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

                            {/* Mobile cards */}
                            <div className="space-y-3 p-4 md:hidden">
                                {earnings.data.map((earning) => (
                                    <article
                                        key={earning.id}
                                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{earning.month_label}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Revenue {formatAmount(earning.revenue_amount)}
                                                </p>
                                            </div>
                                            {earning.is_settled ? (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    Settled
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                                            {formatAmount(earning.total_amount)}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            {earnings.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
                                    <p className="text-xs text-slate-500">
                                        Page {earnings.current_page} of {earnings.last_page}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={!earnings.prev_page_url}
                                            onClick={() => earnings.prev_page_url && router.visit(earnings.prev_page_url)}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!earnings.next_page_url}
                                            onClick={() => earnings.next_page_url && router.visit(earnings.next_page_url)}
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </motion.div>
        </PartnerLayout>
    );
}
