import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ServerStackIcon,
    UsersIcon,
    BuildingOfficeIcon,
    BellAlertIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import ZeusLayout from '@/Layouts/ZeusLayout';
import DateRangePicker from '@/Components/UI/DateRangePicker';
import { dashboard } from '@/routes/zeus';

interface MetricData {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down';
}

interface GrowthChartData {
    period: string;
    estates: number;
    mrr: number;
}

interface BriefingData {
    greeting: string;
    headline: string;
    highlights: {
        estates_added: number;
        mrr: string;
        pending_apps: number;
    };
}

interface Activity {
    id: number;
    event: string;
    description: string;
    type: string;
    created_at: string;
}

interface Application {
    id: number;
    estate_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    created_at: string;
}

interface SystemHealth {
    total_users: number;
    active_users_7d: number;
    database_size: string;
    system_status: string;
}

interface TopEstate {
    id: number;
    name: string;
    users_count: number;
}

interface Props {
    briefing: BriefingData;
    metrics: {
        revenue: MetricData;
        estates: MetricData;
        subscriptions: MetricData;
        trials: MetricData;
    };
    growthChart: GrowthChartData[];
    liveActivityStream: Activity[];
    pendingApplications: Application[];
    systemHealth: SystemHealth;
    topEstates: TopEstate[];
    startDate: string;
    endDate: string;
}

export default function Dashboard({
    briefing,
    metrics,
    growthChart,
    liveActivityStream,
    pendingApplications,
    systemHealth,
    topEstates,
    startDate,
    endDate,
}: Props) {
    const formatExactCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatCompactCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            notation: 'compact',
            compactDisplay: 'short',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }).format(value);
    };

    const handleRangeChange = (start: string, end: string) => {
        import('@inertiajs/react').then(({ router }) => {
            router.get(dashboard.url({ query: { start_date: start, end_date: end } }), {}, { preserveState: true, replace: true });
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
    };

    const MetricCard = ({ title, data, isCurrency = false }: { title: string; data: MetricData; isCurrency?: boolean }) => (
        <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-900/5 dark:border-white/[0.04] dark:bg-[#0f1423]"
        >
            <div className="relative z-10">
                <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">{title}</h3>
                <div className="mt-4 flex items-end gap-3">
                    <span className="text-4xl font-medium tracking-tight text-slate-900 dark:text-white">
                        {isCurrency ? formatCompactCurrency(data.current) : data.current}
                    </span>
                    <span
                        className={`mb-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
                            data.trend === 'up'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                    >
                        {data.trend === 'up' ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                        {Math.abs(data.growth)}%
                    </span>
                </div>
            </div>
            <div className="absolute -right-6 -bottom-6 h-32 w-40 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-5 dark:opacity-[0.02] dark:group-hover:opacity-[0.04]">
                <svg
                    viewBox="0 0 100 100"
                    className={`h-full w-full ${data.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}
                    fill="currentColor"
                >
                    {data.trend === 'up' ? (
                        <path d="M0 100 V 80 Q 25 70 50 40 T 100 20 V 100 Z" />
                    ) : (
                        <path d="M0 100 V 20 Q 25 40 50 70 T 100 80 V 100 Z" />
                    )}
                </svg>
            </div>
        </motion.div>
    );

    const timeAgo = (dateString: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + 'y ago';
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + 'mo ago';
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + 'd ago';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + 'h ago';
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + 'm ago';
        return Math.floor(seconds) + 's ago';
    };

    return (
        <ZeusLayout>
            <Head title="Zeus Command Center" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-7xl pb-12">
                {/* Header / Briefing */}
                <motion.div variants={itemVariants} className="mb-10 max-w-3xl pt-4">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        {briefing.greeting}, <span className="text-slate-400 dark:text-indigo-400">Idris.</span>
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
                        {briefing.headline} You acquired{' '}
                        <span className="font-semibold text-slate-900 dark:text-white">{briefing.highlights.estates_added} new estates</span> this
                        week, pushing MRR to <span className="font-semibold text-slate-900 dark:text-white">₦{briefing.highlights.mrr}</span>. You
                        have{' '}
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {briefing.highlights.pending_apps} pending applications
                        </span>{' '}
                        awaiting review.
                    </p>
                </motion.div>

                {/* KPI Grid */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard title="Monthly Recurring" data={metrics.revenue} isCurrency={true} />
                    <MetricCard title="Active Estates" data={metrics.estates} />
                    <MetricCard title="Active Subscriptions" data={metrics.subscriptions} />
                    <MetricCard title="Trial Pipelines" data={metrics.trials} />
                </div>

                {/* Main Command Center Grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column (2/3 width) - Charts & Activity */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Platform Trajectory Chart */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-[#0f1423]"
                        >
                            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Platform Trajectory</h2>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Revenue vs acquisition over time.</p>
                                </div>
                                <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                            </div>

                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.15} />
                                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEstates" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
                                                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="period"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                                            dx={-10}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            dx={10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                backdropFilter: 'blur(12px)',
                                                color: '#fff',
                                                padding: '12px 16px',
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}
                                            cursor={{ stroke: 'rgba(148, 163, 184, 0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            formatter={(value: any, name: any) => [
                                                name === 'mrr' ? formatExactCurrency(value) : value,
                                                name === 'mrr' ? 'Revenue' : 'Estates',
                                            ]}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="mrr"
                                            name="Revenue"
                                            stroke="#818cf8"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorMrr)"
                                            activeDot={{ r: 4, strokeWidth: 0, fill: '#818cf8' }}
                                        />
                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="estates"
                                            name="Estates"
                                            stroke="#34d399"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorEstates)"
                                            activeDot={{ r: 4, strokeWidth: 0, fill: '#34d399' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Live Activity Stream */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl border border-slate-200/50 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800/50">
                                <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                    <ClockIcon className="h-4 w-4 text-indigo-500" />
                                    Live Platform Feed
                                </h2>
                                <Link
                                    href="/zeus/risk-center"
                                    className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase hover:text-indigo-500 dark:text-indigo-400"
                                >
                                    View All Activity
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                {liveActivityStream.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                        No recent activity on the platform.
                                    </div>
                                ) : (
                                    liveActivityStream.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-center gap-4 p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                                {activity.event === 'created' ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                                                ) : activity.event === 'updated' ? (
                                                    <ClockIcon className="h-5 w-5 text-blue-500" />
                                                ) : (
                                                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{activity.description}</p>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    {activity.type} • {timeAgo(activity.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column (1/3 width) - Tasks, Health, Leaderboard */}
                    <div className="space-y-8">
                        {/* Pending Applications Widget */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl border border-slate-200/50 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800/50">
                                <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                    <BuildingOfficeIcon className="h-4 w-4 text-amber-500" />
                                    Pending Apps ({pendingApplications.length})
                                </h2>
                            </div>
                            <div className="p-5">
                                {pendingApplications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <CheckCircleIcon className="mb-2 h-8 w-8 text-emerald-500/50" />
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">All caught up!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingApplications.map((app) => (
                                            <div
                                                key={app.id}
                                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0a0e17]"
                                            >
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{app.estate_name}</p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{app.contact_name}</p>
                                                <Link
                                                    href={`/zeus/applications/${app.id}`}
                                                    className="mt-3 flex items-center gap-1 text-[10px] font-bold tracking-widest text-indigo-600 uppercase hover:text-indigo-500 dark:text-indigo-400"
                                                >
                                                    Review <ArrowRightIcon className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* System Health Widget */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl border border-slate-200/50 bg-gradient-to-br from-slate-900 to-[#0f1423] p-6 text-white shadow-xl dark:border-slate-800/50"
                        >
                            <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-300 uppercase">
                                <ServerStackIcon className="h-4 w-4 text-sky-400" />
                                Platform Health
                            </h2>
                            <div className="mt-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">Status</span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-400 ring-1 ring-emerald-500/30">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        {systemHealth.system_status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">Total Global Users</span>
                                    <span className="text-sm font-bold">{systemHealth.total_users.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">Active (7 Days)</span>
                                    <span className="text-sm font-bold">{systemHealth.active_users_7d.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">Database Size</span>
                                    <span className="text-sm font-bold">{systemHealth.database_size}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Top Estates Leaderboard */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl border border-slate-200/50 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800/50">
                                <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                    <UsersIcon className="h-4 w-4 text-emerald-500" />
                                    Top Estates
                                </h2>
                            </div>
                            <div className="space-y-3 p-5">
                                {topEstates.map((estate, idx) => (
                                    <div
                                        key={estate.id}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400">0{idx + 1}</span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{estate.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{estate.users_count} users</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
