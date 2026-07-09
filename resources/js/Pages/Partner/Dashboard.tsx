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
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
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
            return 'from-emerald-500/15 via-emerald-500/5 to-transparent ring-emerald-500/10';
        case 'warning':
            return 'from-amber-500/15 via-amber-500/5 to-transparent ring-amber-500/10';
        default:
            return 'from-blue-500/12 via-indigo-500/5 to-transparent ring-blue-500/10';
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

/** Animated integer counter for settlement countdown. */
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

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.05 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
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
            value: formatAmount(stats.pending_commissions),
            hint: 'Awaiting settlement',
            href: '/partner/earnings',
            icon: ClockIcon,
            iconWrap: 'bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-300',
            glow: 'group-hover:shadow-amber-500/10',
            span: 'sm:col-span-1',
        },
        {
            label: 'This month',
            value: formatAmount(stats.current_month_earnings),
            hint: 'Current period',
            href: '/partner/earnings',
            icon: ChartBarIcon,
            iconWrap: 'bg-blue-500/10 text-blue-600 ring-blue-500/15 dark:text-blue-300',
            glow: 'group-hover:shadow-blue-500/10',
            span: 'sm:col-span-1',
        },
        {
            label: 'Pipeline',
            value: String(stats.partner_request_count),
            hint: `${stats.converted_estates} live estates`,
            href: '/partner/partner-requests',
            icon: BuildingOffice2Icon,
            iconWrap: 'bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-300',
            glow: 'group-hover:shadow-violet-500/10',
            span: 'sm:col-span-1',
        },
        {
            label: 'Conversion',
            value: `${stats.conversion_rate}%`,
            hint: `${stats.approved_request_count} approved`,
            href: '/partner/partner-requests',
            icon: SparklesIcon,
            iconWrap: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-300',
            glow: 'group-hover:shadow-emerald-500/10',
            span: 'sm:col-span-1',
        },
    ];

    return (
        <PartnerLayout>
            <Head title="Workspace" />

            <div className="relative space-y-10 pb-4">
                {/* Ambient page wash */}
                <div className="pointer-events-none absolute inset-x-0 -top-8 h-[420px] overflow-hidden" aria-hidden>
                    <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/10" />
                    <div className="absolute top-10 right-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10" />
                    <div className="absolute top-32 left-0 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/5" />
                </div>

                {/* ── Hero: premium landing, not a card ── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                >
                    <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 px-6 py-8 text-white shadow-2xl shadow-stone-900/20 sm:px-10 sm:py-10 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-950 dark:to-black">
                        {/* Layered mesh */}
                        <div className="pointer-events-none absolute inset-0" aria-hidden>
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.35),transparent_55%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.22),transparent_50%)]" />
                            <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                            <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
                            {/* Soft noise grain via CSS pattern */}
                            <div
                                className="absolute inset-0 opacity-[0.035]"
                                style={{
                                    backgroundImage:
                                        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                                }}
                            />
                        </div>

                        <div className="relative grid gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
                            <div>
                                <p className="text-[13px] font-medium tracking-wide text-white/50">
                                    {getGreeting()}, {firstName}
                                </p>
                                <h1 className="mt-2 max-w-xl text-[2rem] leading-[1.1] font-semibold tracking-tight text-white sm:text-5xl">
                                    {businessName}
                                </h1>
                                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/55">
                                    Your commercial workspace — grow the pipeline, track commissions, act on what matters.
                                </p>

                                <div className="mt-8">
                                    <p className="text-[11px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                                        Lifetime earnings
                                    </p>
                                    <motion.p
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.15, duration: 0.5 }}
                                        className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-white sm:text-6xl"
                                    >
                                        {formatAmount(stats.total_earned)}
                                    </motion.p>
                                    <p className="mt-2 text-[13px] text-white/45">
                                        <span className="text-white/70">
                                            {formatCommission(stats.commission_rate, stats.commission_type)}
                                        </span>
                                        {' · '}
                                        {formatCommissionLength(stats.commission_length)}
                                    </p>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link
                                        href="/partner/partner-requests/create"
                                        className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[13px] font-semibold text-stone-900 shadow-lg shadow-black/20 transition hover:bg-white/95 hover:shadow-xl active:scale-[0.98]"
                                    >
                                        <PlusIcon className="h-4 w-4 transition group-hover:rotate-90" />
                                        Submit estate
                                    </Link>
                                    <Link
                                        href="/partner/earnings"
                                        className="group inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-[13px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/15 hover:ring-white/25 active:scale-[0.98]"
                                    >
                                        View earnings
                                        <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                    </Link>
                                </div>
                            </div>

                            {/* Settlement glass orb */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="relative"
                            >
                                <div className="absolute -inset-4 rounded-[2rem] bg-emerald-400/20 blur-2xl" aria-hidden />
                                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-200/80 uppercase">
                                                Next settlement
                                            </p>
                                            <div className="mt-3 flex items-baseline gap-2">
                                                <AnimatedNumber
                                                    value={stats.days_until_settlement}
                                                    className="text-5xl font-semibold tracking-tight tabular-nums text-white sm:text-6xl"
                                                />
                                                <span className="text-lg font-medium text-white/50">days</span>
                                            </div>
                                            <p className="mt-2 text-[13px] text-white/55">{stats.next_settlement_date}</p>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/25">
                                            <BanknotesIcon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="mt-6 h-px bg-linear-to-r from-white/20 via-white/10 to-transparent" />
                                    <p className="mt-4 text-[13px] text-white/60">
                                        Pending balance{' '}
                                        <span className="font-semibold text-white tabular-nums">
                                            {formatAmount(stats.pending_commissions)}
                                        </span>
                                    </p>
                                    {/* Mini progress toward settlement (visual only) */}
                                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-400"
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${Math.min(100, Math.max(8, 100 - stats.days_until_settlement * 3))}%`,
                                            }}
                                            transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* ── KPI bento: varied surfaces, no identical white boxes ── */}
                <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={kpi.label}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className={kpi.span}
                        >
                            <Link
                                href={kpi.href}
                                className={`group relative block h-full overflow-hidden rounded-[1.35rem] bg-white/70 p-5 shadow-[0_1px_0_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.12)] ring-1 ring-stone-900/[0.04] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(28,25,23,0.2)] dark:bg-white/[0.04] dark:shadow-none dark:ring-white/[0.06] dark:hover:bg-white/[0.06] ${kpi.glow}`}
                            >
                                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-stone-900/[0.02] blur-2xl transition group-hover:bg-stone-900/[0.04] dark:bg-white/[0.03]" />
                                <div className="relative flex items-start justify-between gap-3">
                                    <span className="text-[12px] font-medium tracking-wide text-stone-500 dark:text-slate-400">
                                        {kpi.label}
                                    </span>
                                    <span
                                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 transition group-hover:scale-105 ${kpi.iconWrap}`}
                                    >
                                        <kpi.icon className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="relative mt-5 text-2xl font-semibold tracking-tight text-stone-900 tabular-nums sm:text-[1.75rem] dark:text-white">
                                    {kpi.value}
                                </p>
                                <p className="relative mt-1 text-[12px] text-stone-400 dark:text-slate-500">{kpi.hint}</p>
                            </Link>
                        </motion.div>
                    ))}
                </section>

                {/* ── Asymmetric mid band: actions + chart ── */}
                <section className="grid gap-6 lg:grid-cols-12 lg:gap-8">
                    {/* Needs attention — editorial list, not boxed rows */}
                    <motion.div
                        custom={4}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="lg:col-span-5"
                    >
                        <div className="mb-5 flex items-end justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
                                    Needs attention
                                </h2>
                                <p className="mt-0.5 text-[13px] text-stone-500 dark:text-slate-400">Suggested next steps</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {actions.length === 0 ? (
                                <div className="rounded-[1.35rem] bg-stone-100/60 px-5 py-10 text-center dark:bg-white/[0.03]">
                                    <SparklesIcon className="mx-auto h-8 w-8 text-stone-300 dark:text-slate-600" />
                                    <p className="mt-3 text-[13px] font-medium text-stone-600 dark:text-slate-300">
                                        You&apos;re all caught up
                                    </p>
                                    <p className="mt-1 text-[12px] text-stone-400">Nothing needs your attention right now.</p>
                                </div>
                            ) : (
                                actions.map((action, i) => (
                                    <motion.div
                                        key={action.key}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + i * 0.06 }}
                                    >
                                        <Link
                                            href={action.href}
                                            className={`group relative block overflow-hidden rounded-[1.25rem] bg-linear-to-br p-5 ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${actionAccent(action.tone)} bg-white/80 dark:bg-white/[0.03]`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                                        {action.title}
                                                    </p>
                                                    <p className="mt-1 text-[13px] leading-relaxed text-stone-500 dark:text-slate-400">
                                                        {action.description}
                                                    </p>
                                                    <span
                                                        className={`mt-3 inline-flex items-center gap-1 text-[12px] font-semibold ${actionCta(action.tone)}`}
                                                    >
                                                        {action.cta}
                                                        <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Chart — expansive, soft surface */}
                    <motion.div
                        custom={5}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="lg:col-span-7"
                    >
                        <div className="relative overflow-hidden rounded-[1.75rem] bg-white/80 p-6 shadow-[0_1px_0_rgba(28,25,23,0.04),0_24px_48px_-28px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/[0.04] backdrop-blur-sm sm:p-8 dark:bg-white/[0.035] dark:shadow-none dark:ring-white/[0.06]">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
                            <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
                                        Earnings trend
                                    </h2>
                                    <p className="mt-0.5 text-[13px] text-stone-500 dark:text-slate-400">
                                        Settled commissions over time
                                    </p>
                                </div>
                                <Link
                                    href="/partner/earnings"
                                    className="group inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
                                >
                                    Details
                                    <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            {chartData.length === 0 ? (
                                <EmptyState
                                    icon={ChartBarIcon}
                                    title="No earnings history yet"
                                    description="Charts appear after your first settlement with active referred estates."
                                    nextStep="Submit estates so residents can start generating commission."
                                    action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                                    className="relative py-10"
                                />
                            ) : (
                                <div className="relative h-56 w-full sm:h-64">
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
                                                    borderRadius: 16,
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

                {/* ── Bottom: activity + explainer ── */}
                <section className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                    <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
                        <div className="mb-5 flex items-end justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
                                    Recent activity
                                </h2>
                                <p className="mt-0.5 text-[13px] text-stone-500 dark:text-slate-400">
                                    Estate pipeline updates
                                </p>
                            </div>
                            <Link
                                href="/partner/partner-requests"
                                className="group inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 dark:text-blue-400"
                            >
                                Pipeline
                                <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {recentActivity.length === 0 ? (
                            <div className="rounded-[1.5rem] bg-stone-100/50 dark:bg-white/[0.03]">
                                <EmptyState
                                    icon={BuildingOffice2Icon}
                                    title="No activity yet"
                                    description="When you submit estates, status changes and reviews show up here."
                                    nextStep="Submit your first estate to start the pipeline."
                                    action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                                    className="py-10"
                                />
                            </div>
                        ) : (
                            <ol className="relative space-y-0 pl-1">
                                {recentActivity.map((item, i) => (
                                    <motion.li
                                        key={`${item.type}-${item.id}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 + i * 0.04 }}
                                        className="relative flex gap-4 pb-6 last:pb-0"
                                    >
                                        <div className="relative flex flex-col items-center">
                                            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(item.status)}`} />
                                            {i < recentActivity.length - 1 && (
                                                <span className="mt-1 w-px flex-1 bg-linear-to-b from-stone-200 to-transparent dark:from-slate-700" />
                                            )}
                                        </div>
                                        <div className="min-w-0 pb-1">
                                            <p className="text-[14px] font-semibold tracking-tight text-stone-900 dark:text-white">
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
                        )}
                    </motion.div>

                    <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
                        <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-stone-900 px-6 py-7 text-white sm:px-8 sm:py-8 dark:bg-linear-to-br dark:from-slate-900 dark:to-slate-950">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.25),transparent_55%)]" />
                            <div className="relative">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                                    <SparklesIcon className="h-6 w-6 text-indigo-200" />
                                </div>
                                <h2 className="mt-5 text-lg font-semibold tracking-tight text-white">How commissions work</h2>
                                <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                                    Earn on resident payments from estates you referred for{' '}
                                    {stats.commission_length
                                        ? `${stats.commission_length} months`
                                        : 'the lifetime of the estate'}{' '}
                                    after activation.
                                </p>
                                <ol className="mt-6 space-y-3">
                                    {[
                                        'Submit estates via Pipeline',
                                        'Kontrol reviews and activates',
                                        'Earn on resident payments',
                                        'Monthly settlement',
                                    ].map((step, i) => (
                                        <li key={step} className="flex items-start gap-3 text-[13px] text-white/70">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold text-white/90">
                                                {i + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                                <Link
                                    href="/partner/support"
                                    className="group mt-7 inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo-200 transition hover:text-white"
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
