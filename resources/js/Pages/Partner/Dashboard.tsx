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
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
    user: {
        id: number;
        ulid: string;
        name: string;
        email: string;
    };
    partner: {
        name: string;
        status: string;
    } | null;
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

function statusDotClass(status: string): string {
    switch (status) {
        case 'approved':
        case 'estate_created':
            return 'bg-emerald-500';
        case 'rejected':
            return 'bg-red-500';
        case 'info_requested':
            return 'bg-amber-500';
        case 'reviewing':
            return 'bg-blue-500';
        default:
            return 'bg-primary-500';
    }
}

function actionToneClasses(tone: string): string {
    switch (tone) {
        case 'success':
            return 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-950/30';
        case 'warning':
            return 'border-amber-200 bg-amber-50/80 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/30';
        case 'neutral':
            return 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40';
        default:
            return 'border-primary-200 bg-primary-50/80 hover:border-primary-300 dark:border-primary-900/40 dark:bg-primary-950/30';
    }
}

function chartTooltipFormatter(value: number): [string, string] {
    return [formatAmount(value), 'Commission'];
}

export default function PartnerDashboard({ user, partner, stats, monthlyEarnings, recentActivity, actions }: Props) {
    const businessName = partner?.name ?? user.name;
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
            accent: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
        },
        {
            label: 'This month',
            value: formatAmount(stats.current_month_earnings),
            hint: 'Current period',
            href: '/partner/earnings',
            icon: ChartBarIcon,
            accent: 'text-primary-600 bg-primary-50 dark:bg-primary-500/10',
        },
        {
            label: 'Active pipeline',
            value: String(stats.partner_request_count),
            hint: `${stats.converted_estates} estates live`,
            href: '/partner/partner-requests',
            icon: BuildingOffice2Icon,
            accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
        },
        {
            label: 'Conversion',
            value: `${stats.conversion_rate}%`,
            hint: `${stats.approved_request_count} approved`,
            href: '/partner/partner-requests',
            icon: SparklesIcon,
            accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
        },
    ];

    return (
        <PartnerLayout>
            <Head title="Workspace – Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
                {/* Hero */}
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="absolute inset-0 bg-linear-to-br from-primary-600/10 via-transparent to-emerald-500/10" />
                    <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:p-10">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {getGreeting()}, {user.name.split(' ')[0]}
                            </p>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                {businessName}
                            </h1>
                            <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-400">
                                Grow your pipeline, track commissions, and see what needs action next.
                            </p>

                            <div className="mt-6">
                                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Lifetime earnings</p>
                                <p className="mt-1 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                                    {formatAmount(stats.total_earned)}
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Commission plan:{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        {formatCommission(stats.commission_rate, stats.commission_type)}
                                    </span>
                                    {' · '}
                                    {formatCommissionLength(stats.commission_length)}
                                </p>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-500"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Submit new estate
                                </Link>
                                <Link
                                    href="/partner/earnings"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    View earnings
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200/80 bg-linear-to-br from-emerald-50 to-white p-6 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Next settlement</p>
                                    <p className="mt-2 text-4xl font-black text-emerald-900 dark:text-emerald-100">
                                        {stats.days_until_settlement}
                                        <span className="ml-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                                            day{stats.days_until_settlement === 1 ? '' : 's'}
                                        </span>
                                    </p>
                                    <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-400/80">{stats.next_settlement_date}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-lg shadow-emerald-600/30">
                                    <BanknotesIcon className="h-6 w-6" />
                                </div>
                            </div>
                            <p className="text-sm text-emerald-800/80 dark:text-emerald-200/70">
                                Pending balance: <strong>{formatAmount(stats.pending_commissions)}</strong>
                            </p>
                        </div>
                    </div>
                </section>

                {/* KPI grid */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((kpi, index) => (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * index }}
                        >
                            <Link
                                href={kpi.href}
                                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{kpi.label}</span>
                                    <span className={`rounded-lg p-1.5 ${kpi.accent}`}>
                                        <kpi.icon className="h-4 w-4" />
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                                <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p>
                            </Link>
                        </motion.div>
                    ))}
                </section>

                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Chart */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Earnings trend</h2>
                                <p className="text-sm text-slate-500">Monthly settled commissions</p>
                            </div>
                            <Link href="/partner/earnings" className="text-sm font-semibold text-primary-600 hover:underline">
                                Details
                            </Link>
                        </div>
                        {chartData.length === 0 ? (
                            <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
                                <ChartBarIcon className="mb-2 h-10 w-10 text-slate-300" />
                                <p className="text-sm font-medium text-slate-500">No earnings history yet</p>
                                <p className="mt-1 max-w-xs text-center text-xs text-slate-400">
                                    Charts appear after your first settlement period with active referred estates.
                                </p>
                            </div>
                        ) : (
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="partnerEarningsFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            stroke="#94a3b8"
                                            tickFormatter={(v) => `₦${Number(v).toLocaleString('en-NG', { notation: 'compact' })}`}
                                            width={48}
                                        />
                                        <Tooltip
                                            formatter={(value) => chartTooltipFormatter(Number(value) * 100)}
                                            labelStyle={{ fontWeight: 600 }}
                                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#2563eb"
                                            strokeWidth={2.5}
                                            fill="url(#partnerEarningsFill)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </section>

                    {/* Action center */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Action center</h2>
                        <p className="mb-4 text-sm text-slate-500">Suggested next steps</p>
                        <div className="space-y-3">
                            {actions.length === 0 ? (
                                <p className="text-sm text-slate-500">You&apos;re all caught up.</p>
                            ) : (
                                actions.map((action) => (
                                    <Link
                                        key={action.key}
                                        href={action.href}
                                        className={`block rounded-xl border p-4 transition ${actionToneClasses(action.tone)}`}
                                    >
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.title}</p>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{action.description}</p>
                                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary-600">
                                            {action.cta}
                                            <ArrowRightIcon className="h-3 w-3" />
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Activity + how commissions works (dismissible-style secondary) */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent activity</h2>
                                <p className="text-sm text-slate-500">What happened since you last checked</p>
                            </div>
                            <Link href="/partner/partner-requests" className="text-sm font-semibold text-primary-600 hover:underline">
                                Pipeline
                            </Link>
                        </div>
                        {recentActivity.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-500">No activity yet</p>
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="mt-3 inline-flex text-sm font-semibold text-primary-600 hover:underline"
                                >
                                    Submit your first estate
                                </Link>
                            </div>
                        ) : (
                            <ol className="relative space-y-0 border-l border-slate-200 pl-5 dark:border-slate-700">
                                {recentActivity.map((item) => (
                                    <li key={`${item.type}-${item.id}`} className="relative pb-6 last:pb-0">
                                        <span
                                            className={`absolute top-1.5 -left-[1.4rem] h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${statusDotClass(item.status)}`}
                                        />
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {item.description} · {item.status_label}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">{item.at_human}</p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How commissions work</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            You earn on resident payments from estates you referred, for{' '}
                            {stats.commission_length ? `${stats.commission_length} months` : 'the lifetime of the estate'} after
                            activation.
                        </p>
                        <ol className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2">
                                <span className="font-bold text-primary-600">1.</span>
                                Submit estates via Estate Pipeline
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-primary-600">2.</span>
                                Kontrol reviews, creates, and activates the estate
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-primary-600">3.</span>
                                Earn commissions on resident payments
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-primary-600">4.</span>
                                Settlements land monthly — track them under Earnings
                            </li>
                        </ol>
                        <Link href="/partner/support" className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:underline">
                            Read full FAQ →
                        </Link>
                    </section>
                </div>
            </motion.div>
        </PartnerLayout>
    );
}
