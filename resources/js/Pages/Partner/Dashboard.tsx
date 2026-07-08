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
import EmptyState from '@/Components/Partner/EmptyState';
import Surface from '@/Components/Partner/Surface';
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
            return 'bg-emerald-500';
        case 'rejected':
            return 'bg-red-500';
        case 'info_requested':
            return 'bg-amber-500';
        case 'reviewing':
            return 'bg-sky-500';
        default:
            return 'bg-primary-500';
    }
}

function actionTone(tone: string): string {
    switch (tone) {
        case 'success':
            return 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/25';
        case 'warning':
            return 'border-amber-200/80 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/25';
        default:
            return 'border-stone-200/80 bg-stone-50/80 dark:border-slate-700 dark:bg-slate-800/40';
    }
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
            hint: 'Unsettled',
            href: '/partner/earnings',
            icon: ClockIcon,
            accent: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
        },
        {
            label: 'This month',
            value: formatAmount(stats.current_month_earnings),
            hint: 'Current period',
            href: '/partner/earnings',
            icon: ChartBarIcon,
            accent: 'text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400',
        },
        {
            label: 'Pipeline',
            value: String(stats.partner_request_count),
            hint: `${stats.converted_estates} live`,
            href: '/partner/partner-requests',
            icon: BuildingOffice2Icon,
            accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400',
        },
        {
            label: 'Conversion',
            value: `${stats.conversion_rate}%`,
            hint: `${stats.approved_request_count} approved`,
            href: '/partner/partner-requests',
            icon: SparklesIcon,
            accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
        },
    ];

    return (
        <PartnerLayout>
            <Head title="Workspace" />

            <div className="space-y-4">
                {/* Compact hero */}
                <Surface className="relative overflow-hidden" padding="sm">
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary-500/[0.06] via-transparent to-emerald-500/[0.05]" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4 px-1 py-1 sm:px-1.5 sm:py-1.5">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                                {getGreeting()}, {user.name.split(' ')[0]}
                            </p>
                            <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-stone-900 sm:text-xl dark:text-white">
                                {businessName}
                            </h1>
                            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">
                                        Lifetime earnings
                                    </p>
                                    <p className="text-2xl font-bold tracking-tight text-stone-900 tabular-nums dark:text-white">
                                        {formatAmount(stats.total_earned)}
                                    </p>
                                </div>
                                <p className="text-[12px] text-stone-500 dark:text-slate-400">
                                    {formatCommission(stats.commission_rate, stats.commission_type)} ·{' '}
                                    {formatCommissionLength(stats.commission_length)}
                                </p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-primary-500 active:scale-[0.98]"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    Submit estate
                                </Link>
                                <Link
                                    href="/partner/earnings"
                                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    Earnings
                                    <ArrowRightIcon className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>

                        <div className="w-full max-w-[220px] rounded-lg border border-emerald-200/70 bg-emerald-50/80 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30 sm:w-auto">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Settlement</p>
                                <BanknotesIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="mt-1 text-xl font-bold text-emerald-900 tabular-nums dark:text-emerald-100">
                                {stats.days_until_settlement}
                                <span className="ml-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    days
                                </span>
                            </p>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">{stats.next_settlement_date}</p>
                            <p className="mt-1.5 text-[11px] text-emerald-800/70 dark:text-emerald-200/60">
                                Pending {formatAmount(stats.pending_commissions)}
                            </p>
                        </div>
                    </div>
                </Surface>

                {/* KPI row */}
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    {kpis.map((kpi, i) => (
                        <motion.div key={kpi.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                            <Link href={kpi.href} className="block">
                                <Surface hover padding="sm" className="h-full">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400">{kpi.label}</span>
                                        <span className={`rounded-md p-1 ${kpi.accent}`}>
                                            <kpi.icon className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-lg font-semibold tracking-tight text-stone-900 tabular-nums dark:text-white">
                                        {kpi.value}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-stone-400">{kpi.hint}</p>
                                </Surface>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-5">
                    {/* Actions — attention */}
                    <Surface className="lg:col-span-2" padding="sm">
                        <div className="mb-2.5 flex items-center justify-between">
                            <div>
                                <h2 className="text-[13px] font-semibold text-stone-900 dark:text-white">Needs attention</h2>
                                <p className="text-[11px] text-stone-500">Suggested next steps</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {actions.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-stone-500">You&apos;re all caught up.</p>
                            ) : (
                                actions.map((action) => (
                                    <Link
                                        key={action.key}
                                        href={action.href}
                                        className={`block rounded-lg border px-3 py-2.5 transition hover:shadow-sm ${actionTone(action.tone)}`}
                                    >
                                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">{action.title}</p>
                                        <p className="mt-0.5 text-[11px] text-stone-500 dark:text-slate-400">{action.description}</p>
                                        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-primary-600">
                                            {action.cta}
                                            <ArrowRightIcon className="h-3 w-3" />
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </Surface>

                    {/* Chart */}
                    <Surface className="lg:col-span-3" padding="sm">
                        <div className="mb-2 flex items-center justify-between">
                            <div>
                                <h2 className="text-[13px] font-semibold text-stone-900 dark:text-white">Earnings trend</h2>
                                <p className="text-[11px] text-stone-500">Settled commissions</p>
                            </div>
                            <Link href="/partner/earnings" className="text-[11px] font-semibold text-primary-600 hover:underline">
                                Details
                            </Link>
                        </div>
                        {chartData.length === 0 ? (
                            <EmptyState
                                icon={ChartBarIcon}
                                title="No earnings history yet"
                                description="Charts appear after your first settlement with active referred estates."
                                nextStep="Submit estates so residents can start generating commission."
                                action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                                className="py-8"
                            />
                        ) : (
                            <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="wsFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                                                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#a8a29e" axisLine={false} tickLine={false} />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            stroke="#a8a29e"
                                            width={40}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => `₦${Number(v).toLocaleString('en-NG', { notation: 'compact' })}`}
                                        />
                                        <Tooltip
                                            formatter={(value) => [formatAmount(Number(value) * 100), 'Commission']}
                                            contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} fill="url(#wsFill)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Surface>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                    <Surface padding="sm">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-[13px] font-semibold text-stone-900 dark:text-white">Recent activity</h2>
                                <p className="text-[11px] text-stone-500">Estate pipeline updates</p>
                            </div>
                            <Link href="/partner/partner-requests" className="text-[11px] font-semibold text-primary-600 hover:underline">
                                Pipeline
                            </Link>
                        </div>
                        {recentActivity.length === 0 ? (
                            <EmptyState
                                icon={BuildingOffice2Icon}
                                title="No activity yet"
                                description="When you submit estates, status changes and reviews show up here."
                                nextStep="Submit your first estate to start the pipeline."
                                action={{ label: 'Submit estate', href: '/partner/partner-requests/create' }}
                                className="py-8"
                            />
                        ) : (
                            <ol className="relative space-y-0 border-l border-stone-200 pl-4 dark:border-slate-700">
                                {recentActivity.map((item) => (
                                    <li key={`${item.type}-${item.id}`} className="relative pb-3.5 last:pb-0">
                                        <span
                                            className={`absolute top-1.5 -left-[1.15rem] h-2 w-2 rounded-full ring-3 ring-white dark:ring-slate-900 ${statusDot(item.status)}`}
                                        />
                                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">{item.title}</p>
                                        <p className="text-[11px] text-stone-500">
                                            {item.description} · {item.status_label}
                                        </p>
                                        <p className="text-[10px] text-stone-400">{item.at_human}</p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Surface>

                    <Surface padding="sm" className="bg-stone-50/50 dark:bg-slate-900/50">
                        <h2 className="text-[13px] font-semibold text-stone-900 dark:text-white">How commissions work</h2>
                        <p className="mt-1 text-[12px] leading-relaxed text-stone-500 dark:text-slate-400">
                            Earn on resident payments from estates you referred for{' '}
                            {stats.commission_length ? `${stats.commission_length} months` : 'the lifetime of the estate'} after
                            activation.
                        </p>
                        <ol className="mt-3 space-y-1.5 text-[12px] text-stone-600 dark:text-slate-400">
                            {['Submit estates via Pipeline', 'Kontrol reviews and activates', 'Earn on resident payments', 'Monthly settlement'].map(
                                (step, i) => (
                                    <li key={step} className="flex gap-2">
                                        <span className="font-bold text-primary-600">{i + 1}.</span>
                                        {step}
                                    </li>
                                ),
                            )}
                        </ol>
                        <Link href="/partner/support" className="mt-3 inline-flex text-[12px] font-semibold text-primary-600 hover:underline">
                            FAQ & support →
                        </Link>
                    </Surface>
                </div>
            </div>
        </PartnerLayout>
    );
}
