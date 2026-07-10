import {
    ArrowRightIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    LightBulbIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion, useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission, formatCommissionLength } from '@/Utils/money';

interface Earning {
    id: number;
    month: string;
    month_label: string;
    total_amount: number;
    revenue_amount: number;
    settled_at: string | null;
    settled_at_human?: string | null;
    is_settled: boolean;
    is_pending?: boolean;
    is_accruing?: boolean;
    status?: 'accruing' | 'pending' | 'paid';
    status_label?: string;
    payment_reference_masked?: string | null;
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
    chart?: unknown[];
    topEstates?: TopEstate[];
    pipeline?: {
        submitted: number;
        accepted: number;
        rejected: number;
        live_estates: number;
    };
    attention?: AttentionItem[];
    checklist?: unknown[];
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

const INSIGHTS = [
    {
        key: 'scale',
        text: 'Estates with stronger resident adoption compound commission faster month over month.',
    },
    {
        key: 'cycle',
        text: 'Commissions from resident payments settle at the start of the following month.',
    },
    {
        key: 'bank',
        text: 'Verify your payout bank details before your first settlement to avoid delays.',
    },
];

export default function PartnerEarnings({
    earnings,
    summary,
    topEstates = [],
    pipeline = { submitted: 0, accepted: 0, rejected: 0, live_estates: 0 },
    attention = [],
}: Props) {
    const progress = Math.min(100, Math.max(6, summary.settlement_progress ?? 0));
    const mom = summary.month_over_month_change;

    // Today's Focus: attention task + payout task
    const focusTask: AttentionItem | null =
        attention[0] ??
        (pipeline.submitted + pipeline.accepted + pipeline.live_estates === 0
            ? {
                  key: 'submit',
                  title: 'Submit your first estate',
                  description: 'Commissions start after referral, acceptance, and resident payments.',
                  href: '/partner/partner-requests/create',
                  cta: 'Submit estate',
              }
            : null);

    const payoutTask = {
        title: `${summary.next_settlement_month} settlement`,
        amount: summary.projected_settlement,
        days: summary.days_until_settlement,
        payments: summary.eligible_payment_count,
    };

    // Prefer estate-level breakdown; fall back empty
    const breakdown = topEstates;

    return (
        <PartnerLayout>
            <Head title="Earnings" />

            <div className="mx-auto max-w-5xl space-y-8 pb-8">
                {/* Page title */}
                <div>
                    <p className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase">Finance</p>
                    <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight text-stone-900 dark:text-white">
                        Earnings
                    </h1>
                </div>

                {/* ═══════════════════════════════════════════
                    HERO — DO NOT MODIFY (visual anchor)
                    ═══════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-[1.75rem] bg-[#061230] text-white shadow-[0_28px_64px_-32px_rgba(10,61,145,0.55)]"
                >
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,111,219,0.42),transparent_58%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.1),transparent_48%)]" />
                        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-sky-200/20 to-transparent" />
                    </div>

                    <div className="relative px-5 py-7 sm:px-8 sm:py-9">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                                    Lifetime earnings
                                </p>
                                <AnimatedNaira
                                    kobo={summary.total_earned}
                                    className="mt-1.5 block text-[2.75rem] leading-none font-semibold tracking-tight tabular-nums sm:text-[3.25rem]"
                                />
                                <p className="mt-3 text-[13px] text-white/45">
                                    <span className="font-medium text-white/70">
                                        {formatCommission(summary.commission_rate, summary.commission_type)}
                                    </span>
                                    {' · '}
                                    {formatCommissionLength(summary.commission_length)}
                                    {mom !== null && (
                                        <>
                                            {' · '}
                                            <span className={mom >= 0 ? 'text-emerald-300/90' : 'text-rose-300/90'}>
                                                {mom >= 0 ? '+' : ''}
                                                {mom}% MoM
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="w-full max-w-xs rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-md sm:p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-semibold tracking-[0.14em] text-sky-200/70 uppercase">
                                        Next settlement
                                    </p>
                                    <CalendarDaysIcon className="h-4 w-4 text-sky-200/60" />
                                </div>
                                <p className="mt-2 text-[15px] font-semibold">{summary.next_settlement_month}</p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <span className="text-3xl font-semibold tabular-nums tracking-tight">
                                        {summary.days_until_settlement}
                                    </span>
                                    <span className="text-[13px] text-white/45">days</span>
                                </div>
                                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        className="h-full rounded-full bg-linear-to-r from-sky-300 to-primary-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                </div>
                                <p className="mt-2 text-[11px] text-white/45">
                                    {summary.eligible_payment_count} payment
                                    {summary.eligible_payment_count === 1 ? '' : 's'} eligible
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
                            {[
                                { label: 'This month', value: formatAmount(summary.current_month_earnings) },
                                { label: 'Pending', value: formatAmount(summary.pending_commissions), emphasize: true },
                                { label: 'Est. payout', value: formatAmount(summary.projected_settlement) },
                                { label: 'Settles', value: summary.next_settlement_date.split(',')[0] },
                            ].map((cell) => (
                                <div key={cell.label} className="bg-[#061230]/80 px-4 py-3.5 backdrop-blur-sm">
                                    <p className="text-[10px] font-medium tracking-wide text-white/40 uppercase">
                                        {cell.label}
                                    </p>
                                    <p
                                        className={`mt-1 text-[15px] font-semibold tabular-nums sm:text-base ${
                                            cell.emphasize ? 'text-sky-200' : 'text-white'
                                        }`}
                                    >
                                        {cell.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* ═══════════════════════════════════════════
                    1. TODAY'S FOCUS — actionable tasks
                    ═══════════════════════════════════════════ */}
                <section className="space-y-3">
                    <h2 className="text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                        Today&apos;s focus
                    </h2>

                    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(28,25,23,0.04),0_12px_32px_-20px_rgba(28,25,23,0.12)] ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:shadow-none dark:ring-white/[0.06]">
                        {/* Task: attention / estate */}
                        {focusTask && (
                            <Link
                                href={focusTask.href}
                                className="group flex items-start gap-4 border-b border-stone-100 px-4 py-4 transition hover:bg-stone-50/80 sm:px-5 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                            >
                                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[14px] font-semibold text-stone-900 dark:text-white">
                                        {focusTask.title}
                                    </p>
                                    <p className="mt-0.5 text-[12px] leading-snug text-stone-500">{focusTask.description}</p>
                                </div>
                                <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-primary-600 opacity-80 transition group-hover:opacity-100 dark:text-primary-400">
                                    {focusTask.cta}
                                    <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        )}

                        {/* Task: next payout */}
                        <div className="group flex items-start gap-4 px-4 py-4 sm:px-5">
                            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                <BanknotesIcon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-semibold text-stone-900 dark:text-white">Next payout</p>
                                <p className="mt-0.5 text-[12px] text-stone-500">
                                    {payoutTask.title}
                                    {' · '}
                                    <span className="font-semibold tabular-nums text-stone-700 dark:text-slate-200">
                                        {formatAmount(payoutTask.amount)}
                                    </span>
                                    {' · '}
                                    {payoutTask.days} days remaining
                                </p>
                                {payoutTask.payments > 0 && (
                                    <p className="mt-1 text-[11px] text-stone-400">
                                        {payoutTask.payments} eligible payment{payoutTask.payments === 1 ? '' : 's'}
                                    </p>
                                )}
                            </div>
                            <span className="mt-1 shrink-0 text-[12px] font-medium tabular-nums text-stone-400">
                                {payoutTask.days}d
                            </span>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    2. SETTLEMENT PREVIEW — financial centre
                    ═══════════════════════════════════════════ */}
                <section>
                    <h2 className="mb-4 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                        Settlement
                    </h2>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="relative overflow-hidden rounded-[1.5rem] bg-linear-to-br from-stone-50 to-white p-5 shadow-[0_1px_0_rgba(28,25,23,0.04),0_20px_40px_-28px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/[0.05] sm:p-7 dark:from-white/[0.05] dark:to-white/[0.02] dark:shadow-none dark:ring-white/[0.07]"
                    >
                        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary-500/8 blur-3xl" />

                        <div className="relative flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
                                    Next settlement
                                </p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
                                    {summary.next_settlement_month}
                                </p>
                                <p className="mt-1 text-[13px] text-stone-500">{summary.next_settlement_date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-medium text-stone-400">Projected payout</p>
                                <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white">
                                    {formatAmount(summary.projected_settlement)}
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-white/80 px-3.5 py-3 ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10">
                                <p className="text-[10px] font-medium text-stone-400">Pending commission</p>
                                <p className="mt-1 text-[15px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                    {formatAmount(summary.pending_commissions)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white/80 px-3.5 py-3 ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10">
                                <p className="text-[10px] font-medium text-stone-400">Eligible payments</p>
                                <p className="mt-1 text-[15px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                    {summary.eligible_payment_count}
                                </p>
                            </div>
                            <div className="col-span-2 rounded-xl bg-white/80 px-3.5 py-3 ring-1 ring-stone-900/[0.04] sm:col-span-1 dark:bg-white/[0.04] dark:ring-white/10">
                                <p className="text-[10px] font-medium text-stone-400">Countdown</p>
                                <p className="mt-1 text-[15px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                    {summary.days_until_settlement}{' '}
                                    <span className="text-[12px] font-medium text-stone-400">days</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-5">
                            <div className="mb-1.5 flex justify-between text-[11px] text-stone-400">
                                <span>Settlement progress</span>
                                <span className="tabular-nums font-medium text-stone-600 dark:text-slate-300">{progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-stone-200/80 dark:bg-white/10">
                                <motion.div
                                    className="h-full rounded-full bg-linear-to-r from-primary-500 to-sky-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* ═══════════════════════════════════════════
                    3. PAYOUT HISTORY — monthly earning rows
                    ═══════════════════════════════════════════ */}
                <section>
                    <h2 className="mb-4 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                        Payout history
                    </h2>

                    {earnings.data.length === 0 ? (
                        <div className="flex max-h-[180px] items-center gap-4 rounded-2xl bg-stone-50/80 px-5 py-5 ring-1 ring-stone-900/[0.03] dark:bg-white/[0.03] dark:ring-white/[0.05]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm dark:bg-white/10">
                                <CalendarDaysIcon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-stone-800 dark:text-white">
                                    No monthly payouts yet
                                </p>
                                <p className="mt-0.5 text-[12px] text-stone-500">
                                    Periods appear after commissions are aggregated.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-stone-100 text-left text-[10px] font-semibold tracking-wide text-stone-400 uppercase dark:border-white/[0.05]">
                                            <th className="px-4 py-2.5 font-semibold sm:px-5">Period</th>
                                            <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">
                                                Revenue
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-semibold">Commission</th>
                                            <th className="px-4 py-2.5 text-right font-semibold sm:px-5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {earnings.data.map((row, i) => {
                                            const status = row.status ?? (row.is_settled ? 'paid' : 'pending');
                                            const label =
                                                row.status_label ??
                                                (status === 'paid'
                                                    ? 'Paid'
                                                    : status === 'accruing'
                                                      ? 'Accruing'
                                                      : 'Pending Settlement');

                                            return (
                                                <motion.tr
                                                    key={row.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.03 * i }}
                                                    className="border-b border-stone-50 transition last:border-0 hover:bg-stone-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
                                                >
                                                    <td className="px-4 py-3.5 sm:px-5">
                                                        <p className="font-semibold text-stone-900 dark:text-white">
                                                            {row.month_label}
                                                        </p>
                                                        {row.is_settled && (
                                                            <p className="mt-0.5 text-[11px] text-stone-400">
                                                                {row.settled_at_human ??
                                                                    (row.settled_at
                                                                        ? new Date(row.settled_at).toLocaleDateString(
                                                                              'en-NG',
                                                                              { dateStyle: 'medium' },
                                                                          )
                                                                        : null)}
                                                                {row.payment_reference_masked
                                                                    ? ` · Ref ${row.payment_reference_masked}`
                                                                    : ''}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="hidden px-4 py-3.5 text-right tabular-nums text-stone-600 sm:table-cell dark:text-slate-300">
                                                        {formatAmount(row.revenue_amount)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
                                                        {formatAmount(row.total_amount)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right sm:px-5">
                                                        {status === 'paid' ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                                                Paid
                                                            </span>
                                                        ) : status === 'accruing' ? (
                                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                                                                Accruing
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                                                {label}
                                                            </span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {(earnings.prev_page_url || earnings.next_page_url) && (
                                <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 dark:border-white/[0.05]">
                                    {earnings.prev_page_url ? (
                                        <Link
                                            href={earnings.prev_page_url}
                                            className="text-[12px] font-semibold text-primary-600 dark:text-primary-400"
                                        >
                                            Previous
                                        </Link>
                                    ) : (
                                        <span />
                                    )}
                                    <span className="text-[11px] text-stone-400">
                                        Page {earnings.current_page} of {earnings.last_page}
                                    </span>
                                    {earnings.next_page_url ? (
                                        <Link
                                            href={earnings.next_page_url}
                                            className="text-[12px] font-semibold text-primary-600 dark:text-primary-400"
                                        >
                                            Next
                                        </Link>
                                    ) : (
                                        <span />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ═══════════════════════════════════════════
                    4. COMMISSION BREAKDOWN — by estate
                    ═══════════════════════════════════════════ */}
                <section>
                    <h2 className="mb-4 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                        Commission breakdown
                    </h2>

                    {breakdown.length === 0 ? (
                        <div className="flex max-h-[180px] items-center gap-4 rounded-2xl bg-stone-50/80 px-5 py-5 ring-1 ring-stone-900/[0.03] dark:bg-white/[0.03] dark:ring-white/[0.05]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm dark:bg-white/10">
                                <BuildingOffice2Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-stone-800 dark:text-white">No estate earnings yet</p>
                                <p className="mt-0.5 text-[12px] text-stone-500">
                                    Breakdown appears when residents on your estates pay.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-stone-100 text-left text-[10px] font-semibold tracking-wide text-stone-400 uppercase dark:border-white/[0.05]">
                                            <th className="px-4 py-2.5 font-semibold sm:px-5">Estate</th>
                                            <th className="px-4 py-2.5 text-right font-semibold">Payments</th>
                                            <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">
                                                Revenue
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-semibold">Commission</th>
                                            <th className="px-4 py-2.5 text-right font-semibold sm:px-5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {breakdown.map((row, i) => (
                                            <motion.tr
                                                key={row.estate_id ?? row.estate_name}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.03 * i }}
                                                className="border-b border-stone-50 transition last:border-0 hover:bg-stone-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
                                            >
                                                <td className="px-4 py-3.5 sm:px-5">
                                                    <p className="font-semibold text-stone-900 dark:text-white">
                                                        {row.estate_name}
                                                    </p>
                                                    {row.estate_status && (
                                                        <p className="mt-0.5 text-[11px] capitalize text-stone-400">
                                                            {row.estate_status}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right tabular-nums text-stone-600 dark:text-slate-300">
                                                    {row.payment_count}
                                                </td>
                                                <td className="hidden px-4 py-3.5 text-right tabular-nums text-stone-600 sm:table-cell dark:text-slate-300">
                                                    {formatAmount(row.revenue_amount)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
                                                    {formatAmount(row.commission_amount)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right sm:px-5">
                                                    <span
                                                        className={`text-[11px] font-semibold ${
                                                            row.has_pending
                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {row.has_pending ? 'Pending' : 'Settled'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>

                {/* ═══════════════════════════════════════════
                    5. INSIGHTS — compact intelligence
                    ═══════════════════════════════════════════ */}
                <section>
                    <h2 className="mb-3 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                        Insights
                    </h2>
                    <ul className="space-y-2">
                        {INSIGHTS.map((insight, i) => (
                            <motion.li
                                key={insight.key}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i + 0.15 }}
                                className="flex items-start gap-3 rounded-xl bg-stone-50/90 px-3.5 py-3 ring-1 ring-stone-900/[0.03] dark:bg-white/[0.03] dark:ring-white/[0.05]"
                            >
                                <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                <p className="text-[13px] leading-snug text-stone-600 dark:text-slate-300">{insight.text}</p>
                            </motion.li>
                        ))}
                        <li className="flex items-start gap-3 rounded-xl bg-primary-50/70 px-3.5 py-3 ring-1 ring-primary-500/10 dark:bg-primary-500/10">
                            <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                            <p className="text-[13px] leading-snug text-primary-900 dark:text-primary-100">
                                <Link
                                    href="/partner/profile?tab=banking"
                                    className="font-semibold underline-offset-2 hover:underline"
                                >
                                    Verify payout bank details
                                </Link>{' '}
                                before your first settlement.
                            </p>
                        </li>
                    </ul>
                </section>
            </div>
        </PartnerLayout>
    );
}
