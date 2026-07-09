import {
    ArrowDownTrayIcon,
    ArrowRightIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    LightBulbIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion, useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission, formatCommissionLength } from '@/Utils/money';

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
    next_settlement_month: string;
    days_until_settlement: number;
    settlement_progress: number;
    commission_rate: string | null;
    commission_type: string | null;
    commission_length: number | null;
    eligible_payment_count: number;
}

interface ChartPoint {
    month: string;
    label: string;
    total_amount: number;
    revenue_amount: number;
}

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string;
    amount: number | null;
    status: string;
    status_label: string;
    estate_name: string | null;
    at: string | null;
    at_human: string | null;
}

interface TopEstate {
    estate_id: number | null;
    estate_name: string;
    estate_ulid: string | null;
    estate_status: string | null;
    payment_count: number;
    revenue_amount: number;
    commission_amount: number;
    has_pending: boolean;
}

interface AttentionItem {
    key: string;
    title: string;
    description: string;
    href: string;
    cta: string;
}

interface ChecklistItem {
    key: string;
    label: string;
    done: boolean;
    href: string | null;
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
    activity?: ActivityItem[];
    topEstates?: TopEstate[];
    pipeline?: {
        submitted: number;
        accepted: number;
        rejected: number;
        live_estates: number;
    };
    attention?: AttentionItem[];
    checklist?: ChecklistItem[];
}

function AnimatedNaira({ kobo, className }: { kobo: number; className?: string }) {
    const [display, setDisplay] = useState(0);
    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, { stiffness: 80, damping: 24 });

    useMotionValueEvent(spring, 'change', (latest) => {
        setDisplay(Math.round(latest));
    });

    useEffect(() => {
        motionValue.set(kobo / 100);
    }, [kobo, motionValue]);

    return (
        <span className={className}>
            ₦
            {display.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}
        </span>
    );
}

function activityIcon(type: string) {
    switch (type) {
        case 'settlement_paid':
        case 'settlement_generated':
            return BanknotesIcon;
        case 'estate_accepted':
        case 'estate_activated':
            return CheckCircleIcon;
        case 'estate_submitted':
            return BuildingOffice2Icon;
        default:
            return SparklesIcon;
    }
}

function activityTone(type: string) {
    switch (type) {
        case 'settlement_paid':
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
        case 'settlement_generated':
        case 'commission_earned':
            return 'bg-primary-500/10 text-primary-600 dark:text-primary-400';
        case 'estate_rejected':
            return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
        default:
            return 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-slate-300';
    }
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

export default function PartnerEarnings({
    earnings,
    summary,
    chart,
    activity = [],
    topEstates = [],
    pipeline = { submitted: 0, accepted: 0, rejected: 0, live_estates: 0 },
    attention = [],
    checklist = [],
}: Props) {
    const chartData = (chart ?? []).map((row) => ({ ...row, amount: row.total_amount / 100 }));
    const hasHistory = chartData.length > 0 || earnings.total > 0 || summary.total_earned > 0 || summary.pending_commissions > 0;
    const mom = summary.month_over_month_change;
    const progress = Math.min(100, Math.max(4, summary.settlement_progress ?? 0));

    return (
        <PartnerLayout>
            <Head title="Earnings" />

            <div className="space-y-8 pb-4">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase">Finance</p>
                        <h1 className="mt-1 text-[1.65rem] font-semibold tracking-tight text-stone-900 dark:text-white">
                            Earnings
                        </h1>
                        <p className="mt-1 text-[13px] text-stone-500 dark:text-slate-400">
                            Your commercial payouts, settlements, and estate performance.
                        </p>
                    </div>
                    {earnings.data.length > 0 && (
                        <button
                            type="button"
                            onClick={() => exportCsv(earnings.data)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12px] font-semibold text-stone-700 shadow-sm ring-1 ring-stone-900/[0.06] transition hover:bg-stone-50 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10"
                        >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            Export CSV
                        </button>
                    )}
                </div>

                {/* Financial hero */}
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-[1.75rem] bg-[#061230] px-5 py-7 text-white shadow-[0_24px_64px_-28px_rgba(10,61,145,0.5)] sm:px-8 sm:py-9"
                >
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,111,219,0.45),transparent_55%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.12),transparent_50%)]" />
                        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-sky-200/25 to-transparent" />
                    </div>

                    <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-stretch">
                        <div className="flex flex-col justify-between">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                                    Lifetime earnings
                                </p>
                                <AnimatedNaira
                                    kobo={summary.total_earned}
                                    className="mt-1 block text-[2.75rem] font-semibold tracking-tight tabular-nums sm:text-5xl"
                                />
                                <p className="mt-2 text-[13px] text-white/50">
                                    <span className="font-medium text-white/75">
                                        {formatCommission(summary.commission_rate, summary.commission_type)}
                                    </span>
                                    {' · '}
                                    {formatCommissionLength(summary.commission_length)}
                                    {mom !== null && (
                                        <>
                                            {' · '}
                                            <span className={mom >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                                {mom >= 0 ? '+' : ''}
                                                {mom}% vs last month
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium tracking-wide text-white/45 uppercase">This month</p>
                                    <p className="mt-1 text-lg font-semibold tabular-nums">
                                        {formatAmount(summary.current_month_earnings)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10">
                                    <p className="text-[10px] font-medium tracking-wide text-white/45 uppercase">Pending</p>
                                    <p className="mt-1 text-lg font-semibold tabular-nums text-sky-200">
                                        {formatAmount(summary.pending_commissions)}
                                    </p>
                                </div>
                                <div className="col-span-2 rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10 sm:col-span-1">
                                    <p className="text-[10px] font-medium tracking-wide text-white/45 uppercase">
                                        Est. payout
                                    </p>
                                    <p className="mt-1 text-lg font-semibold tabular-nums">
                                        {formatAmount(summary.projected_settlement)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Settlement card */}
                        <div className="relative flex">
                            <div className="absolute -inset-2 rounded-[1.75rem] bg-sky-400/10 blur-2xl" aria-hidden />
                            <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl sm:p-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold tracking-[0.14em] text-sky-200/80 uppercase">
                                            Next settlement
                                        </p>
                                        <p className="mt-2 text-[15px] font-semibold text-white">
                                            {summary.next_settlement_month}
                                        </p>
                                        <div className="mt-3 flex items-baseline gap-2">
                                            <span className="text-4xl font-semibold tabular-nums tracking-tight">
                                                {summary.days_until_settlement}
                                            </span>
                                            <span className="text-sm text-white/50">days left</span>
                                        </div>
                                        <p className="mt-1 text-[12px] text-white/50">{summary.next_settlement_date}</p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-200 ring-1 ring-sky-300/20">
                                        <CalendarDaysIcon className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="mb-2 flex justify-between text-[11px] text-white/50">
                                        <span>Cycle progress</span>
                                        <span className="tabular-nums">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            className="h-full rounded-full bg-linear-to-r from-sky-300 to-primary-400 shadow-[0_0_12px_rgba(56,189,248,0.45)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ delay: 0.25, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                    </div>
                                    <p className="mt-3 text-[12px] text-white/55">
                                        {summary.eligible_payment_count} eligible payment
                                        {summary.eligible_payment_count === 1 ? '' : 's'} ·{' '}
                                        <span className="font-semibold text-white tabular-nums">
                                            {formatAmount(summary.projected_settlement)}
                                        </span>{' '}
                                        projected
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Attention + settlement-adjacent mid band */}
                {(attention.length > 0 || !hasHistory) && (
                    <section className="grid gap-4 lg:grid-cols-12">
                        {attention.length > 0 && (
                            <div className={`space-y-2.5 ${hasHistory ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
                                <h2 className="text-[13px] font-semibold text-stone-900 dark:text-white">Needs attention</h2>
                                <div className={`grid gap-2.5 ${hasHistory ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
                                    {attention.map((item, i) => (
                                        <motion.div
                                            key={item.key}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * i }}
                                        >
                                            <Link
                                                href={item.href}
                                                className="group flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/[0.04] dark:ring-white/[0.06]"
                                            >
                                                <p className="text-[14px] font-semibold text-stone-900 dark:text-white">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 flex-1 text-[12px] leading-relaxed text-stone-500">
                                                    {item.description}
                                                </p>
                                                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary-600 dark:text-primary-400">
                                                    {item.cta}
                                                    <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                                </span>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasHistory && (
                            <div className="lg:col-span-7">
                                <div className="h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/[0.06] sm:p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
                                            <LightBulbIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                                How you earn
                                            </h2>
                                            <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                                                You earn{' '}
                                                <span className="font-semibold text-stone-800 dark:text-slate-200">
                                                    {formatCommission(summary.commission_rate, summary.commission_type)}
                                                </span>{' '}
                                                on resident payments from estates you referred
                                                {summary.commission_length
                                                    ? ` for ${formatCommissionLength(summary.commission_length).toLowerCase()}`
                                                    : ' for the lifetime of the estate'}
                                                . Settlements process at the start of each month.
                                            </p>
                                        </div>
                                    </div>

                                    <ol className="mt-5 grid gap-2 sm:grid-cols-2">
                                        {[
                                            'Submit estates via My Estates',
                                            'Kontrol accepts & activates',
                                            'Residents subscribe & pay',
                                            'Monthly settlement to your bank',
                                        ].map((step, i) => (
                                            <li
                                                key={step}
                                                className="flex items-start gap-2.5 rounded-xl bg-stone-50 px-3 py-2.5 text-[12px] text-stone-600 dark:bg-white/[0.04] dark:text-slate-300"
                                            >
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stone-900 text-[10px] font-bold text-white dark:bg-white dark:text-stone-900">
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Main commercial grid */}
                <section className="grid items-start gap-5 lg:grid-cols-12">
                    {/* Activity feed / chart */}
                    <div className="lg:col-span-7">
                        {chartData.length > 0 ? (
                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06] sm:p-6">
                                <div className="mb-4 flex items-end justify-between gap-2">
                                    <div>
                                        <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                            Earnings trend
                                        </h2>
                                        <p className="mt-0.5 text-[12px] text-stone-500">Settled commission over time</p>
                                    </div>
                                </div>
                                <div className="h-56 w-full sm:h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="earnFillPremium" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#1f6fdb" stopOpacity={0.35} />
                                                    <stop offset="100%" stopColor="#1f6fdb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 11, fill: '#a8a29e' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#a8a29e' }}
                                                width={44}
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
                                                    boxShadow: '0 12px 40px -12px rgba(0,0,0,0.2)',
                                                    fontSize: 12,
                                                    background: 'rgba(28,25,23,0.92)',
                                                    color: '#fff',
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#1f6fdb"
                                                strokeWidth={2.5}
                                                fill="url(#earnFillPremium)"
                                                animationDuration={800}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06] sm:p-6">
                                <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                    Recent activity
                                </h2>
                                <p className="mt-0.5 text-[12px] text-stone-500">
                                    Commission events and estate momentum
                                </p>

                                {activity.length === 0 ? (
                                    <div className="mt-8 text-center">
                                        <ClockIcon className="mx-auto h-8 w-8 text-stone-300" />
                                        <p className="mt-3 text-[13px] font-medium text-stone-700 dark:text-slate-200">
                                            No earnings events yet
                                        </p>
                                        <p className="mt-1 text-[12px] text-stone-500">
                                            Activity appears when estates activate and residents pay.
                                        </p>
                                        <Link
                                            href="/partner/partner-requests/create"
                                            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-600"
                                        >
                                            Submit estate
                                            <ArrowRightIcon className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                ) : (
                                    <ol className="mt-5 space-y-0">
                                        {activity.map((item, i) => {
                                            const Icon = activityIcon(item.type);

                                            return (
                                                <motion.li
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -6 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.03 * i }}
                                                    className="flex gap-3 border-b border-stone-100 py-3.5 last:border-0 dark:border-white/[0.05]"
                                                >
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activityTone(item.type)}`}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                                {item.title}
                                                            </p>
                                                            {item.amount != null && (
                                                                <p className="shrink-0 text-[13px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                                    {formatAmount(item.amount)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <p className="mt-0.5 truncate text-[12px] text-stone-500">
                                                            {item.description}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-stone-400">
                                                            {item.status_label}
                                                            {item.at_human ? ` · ${item.at_human}` : ''}
                                                        </p>
                                                    </div>
                                                </motion.li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right column: top estates OR pipeline + checklist */}
                    <div className="space-y-4 lg:col-span-5">
                        {topEstates.length > 0 ? (
                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                                <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                    Top earning estates
                                </h2>
                                <p className="mt-0.5 text-[12px] text-stone-500">Where your commission comes from</p>
                                <ul className="mt-4 space-y-3">
                                    {topEstates.map((estate, i) => (
                                        <li
                                            key={estate.estate_id ?? estate.estate_name}
                                            className="flex items-start gap-3 rounded-xl bg-stone-50/80 px-3 py-3 dark:bg-white/[0.04]"
                                        >
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-[11px] font-bold text-white dark:bg-white dark:text-stone-900">
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[13px] font-semibold text-stone-900 dark:text-white">
                                                    {estate.estate_name}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-stone-500">
                                                    {estate.payment_count} payment{estate.payment_count === 1 ? '' : 's'}
                                                    {estate.has_pending ? ' · pending settlement' : ''}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[13px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                    {formatAmount(estate.commission_amount)}
                                                </p>
                                                <p className="text-[10px] text-stone-400">commission</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                                <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                    Pipeline progress
                                </h2>
                                <p className="mt-0.5 text-[12px] text-stone-500">Your path to first payout</p>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Submitted', value: pipeline.submitted },
                                        { label: 'Accepted', value: pipeline.accepted },
                                        { label: 'Live estates', value: pipeline.live_estates },
                                        { label: 'Rejected', value: pipeline.rejected },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="rounded-xl bg-stone-50 px-3 py-3 dark:bg-white/[0.04]"
                                        >
                                            <p className="text-[10px] text-stone-400">{stat.label}</p>
                                            <p className="mt-0.5 text-xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href="/partner/partner-requests"
                                    className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-primary-600"
                                >
                                    Open My Estates
                                    <ArrowRightIcon className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}

                        {checklist.length > 0 && (
                            <div className="rounded-2xl bg-stone-900 p-5 text-white dark:bg-linear-to-br dark:from-slate-900 dark:to-slate-950">
                                <h2 className="text-[15px] font-semibold">Referral checklist</h2>
                                <p className="mt-0.5 text-[12px] text-white/50">Complete these to unlock payouts</p>
                                <ul className="mt-4 space-y-2.5">
                                    {checklist.map((item) => (
                                        <li key={item.key} className="flex items-start gap-2.5 text-[13px]">
                                            <span
                                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                                    item.done
                                                        ? 'bg-emerald-400 text-emerald-950'
                                                        : 'bg-white/10 text-white/40'
                                                }`}
                                            >
                                                {item.done ? (
                                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                                ) : (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                )}
                                            </span>
                                            {item.href && !item.done ? (
                                                <Link href={item.href} className="text-white/80 underline-offset-2 hover:underline">
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <span className={item.done ? 'text-white/55 line-through' : 'text-white/80'}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>

                {/* Commission history — supporting, bottom */}
                <section className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-stone-100 px-5 py-4 dark:border-white/[0.06]">
                        <div>
                            <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Commission history</h2>
                            <p className="mt-0.5 text-[12px] text-stone-500">
                                {earnings.total} month{earnings.total !== 1 ? 's' : ''} recorded
                            </p>
                        </div>
                    </div>

                    {earnings.data.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <BanknotesIcon className="mx-auto h-8 w-8 text-stone-300" />
                            <p className="mt-3 text-[14px] font-semibold text-stone-800 dark:text-white">
                                No settlements recorded yet
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-[13px] text-stone-500">
                                Monthly breakdowns appear after residents on your estates start paying.
                            </p>
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="inline-flex items-center rounded-xl bg-stone-900 px-4 py-2.5 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                                >
                                    Submit estate
                                </Link>
                                <Link
                                    href="/partner/support"
                                    className="inline-flex items-center rounded-xl px-4 py-2.5 text-[13px] font-semibold text-stone-600 ring-1 ring-stone-900/10 dark:text-slate-300 dark:ring-white/10"
                                >
                                    How commissions work
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-[13px]">
                                    <thead className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">
                                        <tr className="border-b border-stone-100 dark:border-white/[0.06]">
                                            <th className="px-5 py-2.5 text-left font-semibold">Month</th>
                                            <th className="px-5 py-2.5 text-right font-semibold">Revenue</th>
                                            <th className="px-5 py-2.5 text-right font-semibold">Commission</th>
                                            <th className="px-5 py-2.5 text-center font-semibold">Status</th>
                                            <th className="px-5 py-2.5 text-right font-semibold">Settled</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {earnings.data.map((earning, i) => (
                                            <motion.tr
                                                key={earning.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="border-b border-stone-50 last:border-0 dark:border-white/[0.04]"
                                            >
                                                <td className="px-5 py-3 font-medium text-stone-900 dark:text-white">
                                                    {earning.month_label}
                                                </td>
                                                <td className="px-5 py-3 text-right tabular-nums text-stone-600 dark:text-slate-300">
                                                    {formatAmount(earning.revenue_amount)}
                                                </td>
                                                <td className="px-5 py-3 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
                                                    {formatAmount(earning.total_amount)}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {earning.is_settled ? (
                                                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                            Settled
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right text-[12px] text-stone-400">
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
                                        className="rounded-xl bg-stone-50 p-3 dark:bg-white/[0.04]"
                                    >
                                        <div className="flex justify-between gap-2">
                                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                {earning.month_label}
                                            </p>
                                            <span className="text-[10px] font-semibold text-stone-500">
                                                {earning.is_settled ? 'Settled' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900 dark:text-white">
                                            {formatAmount(earning.total_amount)}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            {earnings.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3 dark:border-white/[0.06]">
                                    <p className="text-[11px] text-stone-500">
                                        Page {earnings.current_page} of {earnings.last_page}
                                    </p>
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            disabled={!earnings.prev_page_url}
                                            onClick={() => earnings.prev_page_url && router.visit(earnings.prev_page_url)}
                                            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-stone-600 ring-1 ring-stone-200 disabled:opacity-40 dark:text-slate-300 dark:ring-white/10"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!earnings.next_page_url}
                                            onClick={() => earnings.next_page_url && router.visit(earnings.next_page_url)}
                                            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-stone-600 ring-1 ring-stone-200 disabled:opacity-40 dark:text-slate-300 dark:ring-white/10"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </PartnerLayout>
    );
}
