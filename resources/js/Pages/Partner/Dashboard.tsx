import {
    ArrowRightIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    ClockIcon,
    PlusIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion, useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '@/Components/Partner/EmptyState';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission, formatCommissionLength } from '@/Utils/money';

interface Stats {
    total_earned: number;
    pending_commissions: number;
    current_month_earnings: number;
    partner_request_count: number;
    approved_request_count: number;
    converted_estates: number;
    conversion_rate: number;
    commission_rate: string | null;
    commission_type: string | null;
    commission_length: number | null;
    next_settlement_date: string;
    next_settlement_iso: string;
    days_until_settlement: number;
}

interface ActivityItem {
    id: number;
    type: string;
    title: string;
    status: string;
    status_label: string;
    description: string;
    at: string | null;
    at_human: string | null;
}

interface ActionItem {
    key: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    tone: string;
}

interface MonthlyEarning {
    month: string;
    label: string;
    total_amount: number;
    revenue_amount: number;
}

interface Props {
    user: { id: number; ulid: string; name: string; email: string };
    partner: { name: string; status: string } | null;
    stats: Stats;
    monthlyEarnings: MonthlyEarning[];
    recentActivity: ActivityItem[];
    actions: ActionItem[];
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
        return 'Good morning';
    }
    if (hour < 17) {
        return 'Good afternoon';
    }

    return 'Good evening';
}

function statusDot(status: string): string {
    switch (status) {
        case 'approved':
        case 'estate_created':
            return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]';
        case 'rejected':
            return 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.45)]';
        case 'info_requested':
            return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]';
        case 'reviewing':
            return 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.45)]';
        default:
            return 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.45)]';
    }
}

function actionAccent(tone: string): string {
    switch (tone) {
        case 'success':
            return 'from-emerald-500/20 via-emerald-500/5 to-transparent ring-emerald-500/10';
        case 'warning':
            return 'from-amber-500/20 via-amber-500/5 to-transparent ring-amber-500/10';
        default:
            return 'from-blue-500/15 via-indigo-500/5 to-transparent ring-blue-500/10';
    }
}

function actionCta(tone: string): string {
    switch (tone) {
        case 'success':
            return 'text-emerald-600 dark:text-emerald-400';
        case 'warning':
            return 'text-amber-700 dark:text-amber-300';
        default:
            return 'text-blue-600 dark:text-blue-400';
    }
}

/** Animated integer counter */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
    const [display, setDisplay] = useState(0);
    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, { stiffness: 90, damping: 22 });

    useMotionValueEvent(spring, 'change', (latest) => {
        setDisplay(Math.round(latest));
    });

    useEffect(() => {
        motionValue.set(value);
    }, [motionValue, value]);

    return <span className={className}>{display.toLocaleString('en-NG')}</span>;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.04 * i, duration: 0.42, ease: easeOut },
    }),
};

export default function PartnerDashboard({ user, partner, stats, monthlyEarnings, recentActivity, actions }: Props) {
    const businessName = partner?.name ?? user.name;
    const firstName = user.name.split(' ')[0];
    const chartData = monthlyEarnings.map((row) => ({
        ...row,
        amount: row.total_amount / 100,
    }));

    const kpis = [
        {
            label: 'Pending',
            display: formatAmount(stats.pending_commissions),
            hint: 'Awaiting settlement',
            href: '/partner/earnings',
            icon: ClockIcon,
            iconWrap: 'bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-300',
            glow: 'group-hover:shadow-amber-500/15',
        },
        {
            label: 'This month',
            display: formatAmount(stats.current_month_earnings),
            hint: 'Current period',
            href: '/partner/earnings',
            icon: ChartBarIcon,
            iconWrap: 'bg-blue-500/10 text-blue-600 ring-blue-500/15 dark:text-blue-300',
            glow: 'group-hover:shadow-blue-500/15',
        },
        {
            label: 'Pipeline',
            display: null as string | null,
            numeric: stats.partner_request_count,
            hint: `${stats.converted_estates} live estates`,
            href: '/partner/partner-requests',
            icon: BuildingOffice2Icon,
            iconWrap: 'bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-300',
            glow: 'group-hover:shadow-violet-500/15',
        },
        {
            label: 'Conversion',
            display: `${stats.conversion_rate}%`,
            hint: `${stats.approved_request_count} approved`,
            href: '/partner/partner-requests',
            icon: SparklesIcon,
            iconWrap: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-300',
            glow: 'group-hover:shadow-emerald-500/15',
        },
    ];

    return (
        <PartnerLayout>
            <Head title="Workspace" />

            <div className="relative space-y-7 pb-2 sm:space-y-8">
                {/* Ambient wash */}
                <div className="pointer-events-none absolute inset-x-0 -top-6 h-[380px] overflow-hidden" aria-hidden>
                    <div className="absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-blue-400/12 blur-3xl dark:bg-blue-500/10" />
                    <div className="absolute top-8 right-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/8" />
                    <div className="absolute top-28 left-0 h-40 w-40 rounded-full bg-violet-400/8 blur-3xl dark:bg-violet-500/5" />
                </div>

                {/* ── Hero ── */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                >
                    <div className="relative overflow-hidden rounded-[1.75rem] bg-stone-950 px-5 py-7 text-white shadow-[0_24px_64px_-24px_rgba(28,25,23,0.45)] sm:rounded-[2rem] sm:px-9 sm:py-9 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-950 dark:to-black">
                        <div className="pointer-events-none absolute inset-0" aria-hidden>
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.38),transparent_58%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.2),transparent_52%)]" />
                            <div className="absolute -right-12 -bottom-16 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
                            <div className="absolute top-1/3 left-1/3 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
                            <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/25 to-transparent" />
                            <div
                                className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage:
                                        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                                }}
                            />
                        </div>

                        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-stretch lg:gap-10">
                            <div className="flex flex-col justify-between">
                                <div>
                                    <p className="text-[12px] font-medium tracking-wide text-white/50 sm:text-[13px]">
                                        {getGreeting()}, {firstName}
                                    </p>
                                    <h1 className="mt-1.5 max-w-xl text-[1.85rem] leading-[1.08] font-semibold tracking-tight text-white sm:text-[2.75rem]">
                                        {businessName}
                                    </h1>
                                    <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-white/50 sm:text-[15px]">
                                        Grow the pipeline, track commissions, and act on what matters.
                                    </p>
                                </div>

                                <div className="mt-7 sm:mt-8">
                                    <p className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
                                        Lifetime earnings
                                    </p>
                                    <motion.p
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.12, duration: 0.5 }}
                                        className="mt-1 text-[2.5rem] font-semibold tracking-tight tabular-nums text-white sm:text-6xl"
                                    >
                                        {formatAmount(stats.total_earned)}
                                    </motion.p>
                                    <p className="mt-2 text-[12px] text-white/45 sm:text-[13px]">
                                        <span className="font-medium text-white/70">
                                            {formatCommission(stats.commission_rate, stats.commission_type)}
                                        </span>
                                        {' · '}
                                        {formatCommissionLength(stats.commission_length)}
                                    </p>

                                    <div className="mt-6 flex flex-wrap gap-2.5">
                                        <Link
                                            href="/partner/partner-requests/create"
                                            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-[13px] font-semibold text-stone-900 shadow-lg shadow-black/25 transition hover:bg-white/95 hover:shadow-xl active:scale-[0.98]"
                                        >
                                            <PlusIcon className="h-4 w-4 transition duration-300 group-hover:rotate-90" />
                                            Submit estate
                                        </Link>
                                        <Link
                                            href="/partner/earnings"
                                            className="group inline-flex items-center gap-2 rounded-2xl bg-white/[0.08] px-5 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/[0.14] hover:ring-white/25 active:scale-[0.98]"
                                        >
                                            View earnings
                                            <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Settlement glass card */}
                            <motion.div
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.18, duration: 0.5 }}
                                className="relative flex"
                            >
                                <div className="absolute -inset-3 rounded-[2rem] bg-emerald-400/15 blur-2xl" aria-hidden />
                                <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.09] p-5 shadow-2xl backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald-200/80 uppercase">
                                                Next settlement
                                            </p>
                                            <div className="mt-2.5 flex items-baseline gap-2">
                                                <AnimatedNumber
                                                    value={stats.days_until_settlement}
                                                    className="text-5xl font-semibold tracking-tight tabular-nums text-white sm:text-[3.5rem]"
                                                />
                                                <span className="text-base font-medium text-white/45">days</span>
                                            </div>
                                            <p className="mt-1.5 text-[13px] text-white/50">{stats.next_settlement_date}</p>
                                        </div>
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
                                            <BanknotesIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mt-5 h-px bg-linear-to-r from-white/20 via-white/10 to-transparent" />
                                        <p className="mt-4 text-[13px] text-white/55">
                                            Pending balance{' '}
                                            <span className="font-semibold text-white tabular-nums">
                                                {formatAmount(stats.pending_commissions)}
                                            </span>
                                        </p>
                                        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                                            <motion.div
                                                className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min(100, Math.max(8, 100 - stats.days_until_settlement * 3))}%`,
                                                }}
                                                transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* ── KPI row: equal height ── */}
                <section className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4">
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={kpi.label}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className="min-h-0"
                        >
                            <Link
                                href={kpi.href}
                                className={`group relative flex h-full min-h-[132px] flex-col overflow-hidden rounded-[1.25rem] bg-white/75 p-4 shadow-[0_1px_0_rgba(28,25,23,0.04),0_10px_28px_-14px_rgba(28,25,23,0.14)] ring-1 ring-stone-900/[0.04] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(28,25,23,0.22)] sm:min-h-[140px] sm:rounded-[1.35rem] sm:p-5 dark:bg-white/[0.04] dark:shadow-none dark:ring-white/[0.06] dark:hover:bg-white/[0.06] ${kpi.glow}`}
                            >
                                <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-stone-900/[0.02] blur-2xl transition group-hover:bg-stone-900/[0.04] dark:bg-white/[0.03]" />
                                <div className="relative flex items-start justify-between gap-2">
                                    <span className="text-[11px] font-medium tracking-wide text-stone-500 sm:text-[12px] dark:text-slate-400">
                                        {kpi.label}
                                    </span>
                                    <span
                                        className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition duration-300 group-hover:scale-105 sm:h-10 sm:w-10 sm:rounded-2xl ${kpi.iconWrap}`}
                                    >
                                        <kpi.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                                    </span>
                                </div>
                                <div className="relative mt-auto pt-4">
                                    <p className="text-[1.35rem] font-semibold tracking-tight text-stone-900 tabular-nums sm:text-[1.65rem] dark:text-white">
                                        {'numeric' in kpi && kpi.numeric !== undefined ? (
                                            <AnimatedNumber value={kpi.numeric} />
                                        ) : (
                                            kpi.display
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-stone-400 sm:text-[12px] dark:text-slate-500">
                                        {kpi.hint}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </section>

                {/* ── Mid band: actions + chart, equal height ── */}
                <section className="grid items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
                    <motion.div
                        custom={4}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col lg:col-span-5"
                    >
                        <div className="mb-3.5 flex items-end justify-between gap-3">
                            <div>
                                <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 sm:text-base dark:text-white">
                                    Needs attention
                                </h2>
                                <p className="mt-0.5 text-[12px] text-stone-500 dark:text-slate-400">Suggested next steps</p>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2.5">
                            {actions.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center rounded-[1.25rem] bg-stone-100/70 px-5 py-8 dark:bg-white/[0.03]">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5 dark:bg-white/5 dark:ring-white/10">
                                        <SparklesIcon className="h-5 w-5 text-stone-400 dark:text-slate-500" />
                                    </div>
                                    <p className="mt-3 text-[13px] font-medium text-stone-600 dark:text-slate-300">
                                        You&apos;re all caught up
                                    </p>
                                    <p className="mt-1 text-[12px] text-stone-400">Nothing needs attention right now.</p>
                                </div>
                            ) : (
                                actions.map((action, i) => (
                                    <motion.div
                                        key={action.key}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.15 + i * 0.05 }}
                                        className={i === actions.length - 1 ? 'flex-1' : ''}
                                    >
                                        <Link
                                            href={action.href}
                                            className={`group relative flex h-full flex-col overflow-hidden rounded-[1.15rem] bg-linear-to-br p-4 ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-4.5 ${actionAccent(action.tone)} bg-white/85 dark:bg-white/[0.03]`}
                                        >
                                            <p className="text-[14px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                                {action.title}
                                            </p>
                                            <p className="mt-1 flex-1 text-[12px] leading-relaxed text-stone-500 sm:text-[13px] dark:text-slate-400">
                                                {action.description}
                                            </p>
                                            <span
                                                className={`mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold ${actionCta(action.tone)}`}
                                            >
                                                {action.cta}
                                                <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                            </span>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={5}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="flex min-h-[280px] flex-col lg:col-span-7 lg:min-h-0"
                    >
                        <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-white/80 p-5 shadow-[0_1px_0_rgba(28,25,23,0.04),0_20px_48px_-28px_rgba(28,25,23,0.16)] ring-1 ring-stone-900/[0.04] backdrop-blur-sm sm:rounded-[1.65rem] sm:p-6 dark:bg-white/[0.035] dark:shadow-none dark:ring-white/[0.06]">
                            <div
                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.07),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]"
                                aria-hidden
                            />
                            <div className="relative mb-4 flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 sm:text-base dark:text-white">
                                        Earnings trend
                                    </h2>
                                    <p className="mt-0.5 text-[12px] text-stone-500 dark:text-slate-400">
                                        Settled commissions over time
                                    </p>
                                </div>
                                <Link
                                    href="/partner/earnings"
                                    className="group inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
                                >
                                    Details
                                    <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            {chartData.length === 0 ? (
                                <div className="relative flex flex-1 items-center justify-center">
                                    <EmptyState
                                        icon={ChartBarIcon}
                                        title="No earnings history yet"
                                        description="Charts appear after your first settlement with active referred estates."
                                        nextStep="Submit estates so residents can start generating commission."
                                        action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                                        size="sm"
                                        className="py-4"
                                    />
                                </div>
                            ) : (
                                <div className="relative min-h-[200px] flex-1 w-full sm:min-h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="wsPremiumFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                                                    <stop offset="55%" stopColor="#6366f1" stopOpacity={0.12} />
                                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="wsPremiumStroke" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#60a5fa" />
                                                    <stop offset="100%" stopColor="#818cf8" />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 11, fill: '#a8a29e' }}
                                                stroke="transparent"
                                                axisLine={false}
                                                tickLine={false}
                                                dy={8}
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
                                                    padding: '10px 14px',
                                                    background: 'rgba(28,25,23,0.92)',
                                                    color: '#fff',
                                                }}
                                                labelStyle={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="url(#wsPremiumStroke)"
                                                strokeWidth={2.5}
                                                fill="url(#wsPremiumFill)"
                                                animationDuration={900}
                                                animationEasing="ease-out"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </section>

                {/* ── Bottom: activity + explainer, equal height ── */}
                <section className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
                    <motion.div
                        custom={6}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col"
                    >
                        <div className="mb-3.5 flex items-end justify-between gap-3">
                            <div>
                                <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 sm:text-base dark:text-white">
                                    Recent activity
                                </h2>
                                <p className="mt-0.5 text-[12px] text-stone-500 dark:text-slate-400">Estate pipeline updates</p>
                            </div>
                            <Link
                                href="/partner/partner-requests"
                                className="group inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 dark:text-blue-400"
                            >
                                Pipeline
                                <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {recentActivity.length === 0 ? (
                            <div className="flex flex-1 rounded-[1.35rem] bg-stone-100/60 dark:bg-white/[0.03]">
                                <EmptyState
                                    icon={BuildingOffice2Icon}
                                    title="No activity yet"
                                    description="When you submit estates, status changes and reviews show up here."
                                    nextStep="Submit your first estate to start the pipeline."
                                    action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                                    size="sm"
                                    className="w-full py-8"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col rounded-[1.35rem] bg-white/70 p-4 ring-1 ring-stone-900/[0.04] backdrop-blur-sm sm:p-5 dark:bg-white/[0.03] dark:ring-white/[0.06]">
                                <ol className="relative flex flex-1 flex-col space-y-0">
                                    {recentActivity.map((item, i) => (
                                        <motion.li
                                            key={`${item.type}-${item.id}`}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + i * 0.04 }}
                                            className="relative flex flex-1 gap-3.5 pb-5 last:pb-0"
                                        >
                                            <div className="relative flex flex-col items-center">
                                                <span
                                                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(item.status)}`}
                                                />
                                                {i < recentActivity.length - 1 && (
                                                    <span className="mt-1 w-px flex-1 bg-linear-to-b from-stone-200 to-transparent dark:from-slate-700" />
                                                )}
                                            </div>
                                            <div className="min-w-0 pb-0.5">
                                                <p className="text-[13px] font-semibold tracking-tight text-stone-900 sm:text-[14px] dark:text-white">
                                                    {item.title}
                                                </p>
                                                <p className="mt-0.5 text-[12px] text-stone-500 dark:text-slate-400">
                                                    {item.description}
                                                    <span className="text-stone-300 dark:text-slate-600"> · </span>
                                                    {item.status_label}
                                                </p>
                                                <p className="mt-1 text-[11px] text-stone-400 dark:text-slate-500">
                                                    {item.at_human}
                                                </p>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </motion.div>

                    <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show" className="flex">
                        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] bg-stone-900 px-5 py-6 text-white sm:rounded-[1.65rem] sm:px-7 sm:py-7 dark:bg-linear-to-br dark:from-slate-900 dark:to-slate-950">
                            <div
                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.28),transparent_55%)]"
                                aria-hidden
                            />
                            <div
                                className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-blue-500/15 blur-2xl"
                                aria-hidden
                            />
                            <div className="relative flex h-full flex-col">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                                    <SparklesIcon className="h-5 w-5 text-indigo-200" />
                                </div>
                                <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-white sm:text-base">
                                    How commissions work
                                </h2>
                                <p className="mt-2 text-[12px] leading-relaxed text-white/50 sm:text-[13px]">
                                    Earn on resident payments from estates you referred for{' '}
                                    {stats.commission_length
                                        ? `${stats.commission_length} months`
                                        : 'the lifetime of the estate'}{' '}
                                    after activation.
                                </p>
                                <ol className="mt-5 flex-1 space-y-2.5">
                                    {[
                                        'Submit estates via Pipeline',
                                        'Kontrol reviews and activates',
                                        'Earn on resident payments',
                                        'Monthly settlement',
                                    ].map((step, i) => (
                                        <li key={step} className="flex items-start gap-2.5 text-[12px] text-white/70 sm:text-[13px]">
                                            <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-white/10 text-[10px] font-bold text-white/90 sm:h-6 sm:w-6 sm:text-[11px]">
                                                {i + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                                <Link
                                    href="/partner/support"
                                    className="group mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-200 transition hover:text-white sm:text-[13px]"
                                >
                                    FAQ & support
                                    <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </div>
        </PartnerLayout>
    );
}
