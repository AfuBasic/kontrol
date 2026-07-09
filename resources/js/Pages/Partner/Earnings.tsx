import {
    ArrowDownTrayIcon,
    ArrowRightIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ClockIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion';
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
    chart?: unknown[];
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
        case 'commission_earned':
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

function activityIconTone(type: string) {
    switch (type) {
        case 'settlement_paid':
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
        case 'settlement_generated':
        case 'commission_earned':
            return 'bg-primary-500/10 text-primary-600 dark:text-primary-400';
        case 'estate_rejected':
            return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
        case 'estate_accepted':
        case 'estate_activated':
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
        default:
            return 'bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-slate-400';
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

const PAYOUT_STEPS = [
    { key: 'submit', label: 'Submit estate' },
    { key: 'review', label: 'Review' },
    { key: 'activate', label: 'Activation' },
    { key: 'subscribe', label: 'Residents pay' },
    { key: 'settle', label: 'Monthly settlement' },
];

export default function PartnerEarnings({
    earnings,
    summary,
    activity = [],
    topEstates = [],
    pipeline = { submitted: 0, accepted: 0, rejected: 0, live_estates: 0 },
    attention = [],
    checklist = [],
}: Props) {
    const [howOpen, setHowOpen] = useState(false);
    const progress = Math.min(100, Math.max(6, summary.settlement_progress ?? 0));
    const mom = summary.month_over_month_change;

    // Cap action strip at two cards: attention first, then a milestone narrative.
    const actionCards: AttentionItem[] = [];
    if (attention[0]) {
        actionCards.push(attention[0]);
    }
    if (attention[1]) {
        actionCards.push(attention[1]);
    } else if (actionCards.length < 2) {
        actionCards.push({
            key: 'milestone',
            title: pipeline.live_estates > 0 ? 'Next milestone' : 'Your first commission',
            description:
                pipeline.live_estates > 0
                    ? 'Commissions appear as residents on your live estates subscribe and pay.'
                    : 'Expected after your first estate is accepted and residents start paying.',
            href: pipeline.live_estates > 0 ? '/partner/partner-requests' : '/partner/partner-requests/create',
            cta: pipeline.live_estates > 0 ? 'View estates' : 'Submit estate',
        });
    }

    const pipelineStages = [
        { key: 'submitted', label: 'Submitted', count: pipeline.submitted, active: pipeline.submitted > 0 },
        { key: 'accepted', label: 'Accepted', count: pipeline.accepted, active: pipeline.accepted > 0 },
        { key: 'live', label: 'Activated', count: pipeline.live_estates, active: pipeline.live_estates > 0 },
    ];

    // How far along the commercial pipeline is the partner overall?
    const pipelineCursor =
        pipeline.live_estates > 0 ? 2 : pipeline.accepted > 0 ? 1 : pipeline.submitted > 0 ? 0 : -1;

    return (
        <PartnerLayout>
            <Head title="Earnings" />

            <div className="mx-auto max-w-5xl space-y-10 pb-6">
                {/* Page title — quiet */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase">Finance</p>
                        <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight text-stone-900 dark:text-white">
                            Earnings
                        </h1>
                    </div>
                    {earnings.data.length > 0 && (
                        <button
                            type="button"
                            onClick={() => exportCsv(earnings.data)}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-stone-500 transition hover:text-stone-800 dark:hover:text-white"
                        >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            Export
                        </button>
                    )}
                </div>

                {/* ═══ 1. HERO — financial summary ═══ */}
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

                {/* ═══ 2. ACTION STRIP — max two compact cards ═══ */}
                <section className="grid gap-3 sm:grid-cols-2">
                    {actionCards.slice(0, 2).map((card, i) => (
                        <motion.div
                            key={card.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.35 }}
                        >
                            <Link
                                href={card.href}
                                className="group flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-stone-900/[0.04] transition hover:ring-stone-900/[0.08] dark:bg-white/[0.035] dark:ring-white/[0.06] dark:hover:ring-white/12"
                            >
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">
                                        {i === 0 && attention[0] ? 'Needs attention' : 'Next milestone'}
                                    </p>
                                    <p className="mt-0.5 truncate text-[14px] font-semibold text-stone-900 dark:text-white">
                                        {card.title}
                                    </p>
                                    <p className="mt-0.5 line-clamp-1 text-[12px] text-stone-500">{card.description}</p>
                                </div>
                                <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-primary-600 dark:text-primary-400">
                                    {card.cta}
                                    <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </section>

                {/* ═══ 3. WHAT HAPPENS NEXT — collapsible ═══ */}
                <section className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                    <button
                        type="button"
                        onClick={() => setHowOpen((v) => !v)}
                        aria-expanded={howOpen}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
                    >
                        <span className="text-[14px] font-semibold text-stone-900 dark:text-white">How payouts work</span>
                        <ChevronDownIcon
                            className={`h-4 w-4 text-stone-400 transition duration-200 ${howOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    <AnimatePresence initial={false}>
                        {howOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="border-t border-stone-100 px-4 pt-4 pb-5 sm:px-5 dark:border-white/[0.06]">
                                    <p className="mb-5 max-w-xl text-[13px] text-stone-500">
                                        You earn{' '}
                                        <span className="font-semibold text-stone-800 dark:text-slate-200">
                                            {formatCommission(summary.commission_rate, summary.commission_type)}
                                        </span>{' '}
                                        on resident payments from estates you referred
                                        {summary.commission_length
                                            ? ` for ${formatCommissionLength(summary.commission_length).toLowerCase()}`
                                            : ' for the lifetime of each estate'}
                                        .
                                    </p>
                                    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
                                        {PAYOUT_STEPS.map((step, i) => (
                                            <li key={step.key} className="relative flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                                                {i < PAYOUT_STEPS.length - 1 && (
                                                    <span
                                                        className="absolute top-3 left-3 hidden h-px w-full bg-stone-200 sm:block dark:bg-slate-700"
                                                        aria-hidden
                                                        style={{ width: 'calc(100% - 0.75rem)', left: 'calc(50% + 0.75rem)' }}
                                                    />
                                                )}
                                                <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white dark:bg-white dark:text-stone-900">
                                                    {i + 1}
                                                </span>
                                                <span className="pb-4 text-[12px] font-medium text-stone-700 sm:mt-2 sm:pb-0 dark:text-slate-300">
                                                    {step.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* ═══ 4. RECENT ACTIVITY — primary content ═══ */}
                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                Recent activity
                            </h2>
                            <p className="mt-0.5 text-[12px] text-stone-500">Commission and estate events</p>
                        </div>
                    </div>

                    {activity.length === 0 ? (
                        <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400 dark:bg-white/10">
                                <ClockIcon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-stone-800 dark:text-white">No events yet</p>
                                <p className="mt-0.5 text-[12px] text-stone-500">
                                    Activity appears when estates move and residents pay.
                                </p>
                            </div>
                            <Link
                                href="/partner/partner-requests/create"
                                className="shrink-0 text-[12px] font-semibold text-primary-600 dark:text-primary-400"
                            >
                                Submit estate
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                            <ul>
                                {activity.map((item, i) => {
                                    const Icon = activityIcon(item.type);

                                    return (
                                        <motion.li
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.02 * i }}
                                            className="flex items-start gap-3.5 border-b border-stone-100 px-4 py-3.5 last:border-0 sm:px-5 dark:border-white/[0.05]"
                                        >
                                            <span
                                                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activityIconTone(item.type)}`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                        {item.title}
                                                    </p>
                                                    {item.amount != null && (
                                                        <p className="text-[13px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                            {formatAmount(item.amount)}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-[12px] text-stone-500">
                                                    {item.estate_name || item.description}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-[11px] font-medium text-stone-500">{item.status_label}</p>
                                                <p className="mt-0.5 text-[11px] text-stone-400">{item.at_human}</p>
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </section>

                {/* ═══ 5. PIPELINE TRACKER — horizontal, not a KPI box ═══ */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">
                            Pipeline
                        </h2>
                        <p className="mt-0.5 text-[12px] text-stone-500">Referral journey across your estates</p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-stone-900/[0.04] sm:px-6 dark:bg-white/[0.035] dark:ring-white/[0.06]">
                        <ol className="flex items-center">
                            {pipelineStages.map((stage, i) => {
                                const reached = pipelineCursor >= i;
                                const current = pipelineCursor === i;

                                return (
                                    <li key={stage.key} className="flex flex-1 items-center">
                                        <div className="flex min-w-0 flex-col items-center text-center">
                                            <span
                                                className={`flex h-3 w-3 rounded-full ring-4 ${
                                                    reached
                                                        ? current
                                                            ? 'bg-primary-600 ring-primary-500/20'
                                                            : 'bg-primary-600 ring-primary-500/10'
                                                        : 'bg-stone-200 ring-transparent dark:bg-slate-700'
                                                }`}
                                            />
                                            <span
                                                className={`mt-2 text-[12px] font-semibold ${
                                                    reached ? 'text-stone-900 dark:text-white' : 'text-stone-400'
                                                }`}
                                            >
                                                {stage.label}
                                            </span>
                                            <span className="mt-0.5 text-[11px] tabular-nums text-stone-400">{stage.count}</span>
                                        </div>
                                        {i < pipelineStages.length - 1 && (
                                            <div
                                                className={`mx-1 mb-6 h-px min-w-[1.5rem] flex-1 ${
                                                    pipelineCursor > i
                                                        ? 'bg-primary-500'
                                                        : 'bg-stone-200 dark:bg-slate-700'
                                                }`}
                                                aria-hidden
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </section>

                {/* ═══ 6. ESTATE PERFORMANCE ═══ */}
                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                {topEstates.length > 0 ? 'Top performing estates' : 'Estate performance'}
                            </h2>
                            <p className="mt-0.5 text-[12px] text-stone-500">
                                {topEstates.length > 0
                                    ? 'Where your commission originates'
                                    : 'Estates will rank here once residents pay'}
                            </p>
                        </div>
                        <Link
                            href="/partner/partner-requests"
                            className="text-[12px] font-semibold text-primary-600 dark:text-primary-400"
                        >
                            My Estates
                        </Link>
                    </div>

                    {topEstates.length === 0 ? (
                        <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400 dark:bg-white/10">
                                <BuildingOffice2Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-stone-800 dark:text-white">
                                    No performing estates yet
                                </p>
                                <p className="mt-0.5 text-[12px] text-stone-500">
                                    Activate estates and grow resident subscriptions to rank here.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                            <ul>
                                {topEstates.map((estate, i) => (
                                    <li
                                        key={estate.estate_id ?? estate.estate_name}
                                        className="flex items-center gap-3 border-b border-stone-100 px-4 py-3.5 last:border-0 sm:px-5 dark:border-white/[0.05]"
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[11px] font-bold text-stone-600 dark:bg-white/10 dark:text-slate-300">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-semibold text-stone-900 dark:text-white">
                                                {estate.estate_name}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-stone-500">
                                                {estate.payment_count} payment{estate.payment_count === 1 ? '' : 's'}
                                                {estate.has_pending ? ' · pending settlement' : ' · settled'}
                                            </p>
                                        </div>
                                        <div className="hidden text-right sm:block">
                                            <p className="text-[11px] text-stone-400">Revenue</p>
                                            <p className="text-[12px] font-medium tabular-nums text-stone-600 dark:text-slate-300">
                                                {formatAmount(estate.revenue_amount)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-stone-400">Commission</p>
                                            <p className="text-[13px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {formatAmount(estate.commission_amount)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* Checklist — only if incomplete items exist, compact */}
                {checklist.some((c) => !c.done) && (
                    <section className="rounded-2xl bg-stone-50 px-4 py-4 ring-1 ring-stone-900/[0.03] dark:bg-white/[0.03] dark:ring-white/[0.05] sm:px-5">
                        <p className="text-[12px] font-semibold text-stone-700 dark:text-slate-200">Getting started</p>
                        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2">
                            {checklist.map((item) => (
                                <li key={item.key} className="flex items-center gap-2 text-[12px]">
                                    <span
                                        className={`flex h-4 w-4 items-center justify-center rounded-full ${
                                            item.done
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-stone-200 text-transparent dark:bg-slate-700'
                                        }`}
                                    >
                                        {item.done && <CheckCircleIcon className="h-3 w-3" />}
                                    </span>
                                    {item.href && !item.done ? (
                                        <Link href={item.href} className="font-medium text-primary-600 dark:text-primary-400">
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className={item.done ? 'text-stone-400 line-through' : 'text-stone-600 dark:text-slate-300'}>
                                            {item.label}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ═══ 7. COMMISSION HISTORY — supporting ═══ */}
                <section>
                    <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-[13px] font-semibold text-stone-700 dark:text-slate-200">
                                Commission history
                            </h2>
                            <p className="mt-0.5 text-[11px] text-stone-400">
                                {earnings.total} month{earnings.total !== 1 ? 's' : ''} recorded
                            </p>
                        </div>
                    </div>

                    {earnings.data.length === 0 ? (
                        <p className="text-[12px] text-stone-500">
                            Monthly settlements will list here after your first payout cycle.
                        </p>
                    ) : (
                        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]">
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="border-b border-stone-100 text-left text-[10px] font-medium tracking-wide text-stone-400 uppercase dark:border-white/[0.05]">
                                            <th className="px-4 py-2 font-medium">Month</th>
                                            <th className="px-4 py-2 text-right font-medium">Revenue</th>
                                            <th className="px-4 py-2 text-right font-medium">Commission</th>
                                            <th className="px-4 py-2 text-center font-medium">Status</th>
                                            <th className="px-4 py-2 text-right font-medium">Settled</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {earnings.data.map((earning) => (
                                            <tr
                                                key={earning.id}
                                                className="border-b border-stone-50 last:border-0 dark:border-white/[0.04]"
                                            >
                                                <td className="px-4 py-2.5 font-medium text-stone-800 dark:text-slate-200">
                                                    {earning.month_label}
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-stone-500">
                                                    {formatAmount(earning.revenue_amount)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-stone-800 dark:text-white">
                                                    {formatAmount(earning.total_amount)}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span
                                                        className={`text-[11px] font-medium ${
                                                            earning.is_settled
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-amber-600 dark:text-amber-400'
                                                        }`}
                                                    >
                                                        {earning.is_settled ? 'Settled' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-stone-400">
                                                    {earning.settled_at
                                                        ? new Date(earning.settled_at).toLocaleDateString('en-NG', {
                                                              dateStyle: 'medium',
                                                          })
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="divide-y divide-stone-100 md:hidden dark:divide-white/[0.05]">
                                {earnings.data.map((earning) => (
                                    <div key={earning.id} className="flex items-center justify-between px-4 py-3">
                                        <div>
                                            <p className="text-[13px] font-medium text-stone-800 dark:text-white">
                                                {earning.month_label}
                                            </p>
                                            <p className="text-[11px] text-stone-400">
                                                {earning.is_settled ? 'Settled' : 'Pending'}
                                            </p>
                                        </div>
                                        <p className="text-[13px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                            {formatAmount(earning.total_amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {earnings.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5 dark:border-white/[0.05]">
                                    <p className="text-[11px] text-stone-400">
                                        Page {earnings.current_page} of {earnings.last_page}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={!earnings.prev_page_url}
                                            onClick={() => earnings.prev_page_url && router.visit(earnings.prev_page_url)}
                                            className="text-[11px] font-semibold text-stone-600 disabled:opacity-40 dark:text-slate-300"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!earnings.next_page_url}
                                            onClick={() => earnings.next_page_url && router.visit(earnings.next_page_url)}
                                            className="text-[11px] font-semibold text-stone-600 disabled:opacity-40 dark:text-slate-300"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </PartnerLayout>
    );
}
