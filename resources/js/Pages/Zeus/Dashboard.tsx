import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/20/solid';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
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

interface Props {
    briefing: BriefingData;
    metrics: {
        revenue: MetricData;
        estates: MetricData;
        subscriptions: MetricData;
        trials: MetricData;
    };
    growthChart: GrowthChartData[];
    startDate: string;
    endDate: string;
}

export default function Dashboard({ briefing, metrics, growthChart, startDate, endDate }: Props) {
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
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
    };

    const MetricCard = ({ title, data, isCurrency = false }: { title: string; data: MetricData; isCurrency?: boolean }) => (
        <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-900/5 dark:border-white/[0.04] dark:bg-slate-900/40"
        >
            <div className="relative z-10">
                <h3 className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">{title}</h3>
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

            {/* Ultra-subtle background swoop */}
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

    return (
        <ZeusLayout>
            <Head title="Founder Briefing" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-7xl">
                {/* Founder Briefing Hero */}
                <motion.div variants={itemVariants} className="mb-14 max-w-3xl pt-4">
                    <h1 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                        {briefing.greeting}, <span className="text-slate-400 dark:text-slate-500">Idris.</span>
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-slate-500 sm:text-xl dark:text-slate-400">
                        {briefing.headline} You acquired{' '}
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{briefing.highlights.estates_added} new estates</span> this
                        week, pushing MRR to <span className="font-semibold text-slate-900 dark:text-slate-200">₦{briefing.highlights.mrr}</span>. You
                        have{' '}
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                            {briefing.highlights.pending_apps} pending applications
                        </span>{' '}
                        in the pipeline.
                    </p>
                </motion.div>

                {/* Executive Metrics Grid */}
                <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard title="Monthly Recurring" data={metrics.revenue} isCurrency={true} />
                    <MetricCard title="Active Estates" data={metrics.estates} />
                    <MetricCard title="Active Subscriptions" data={metrics.subscriptions} />
                    <MetricCard title="Trial Pipelines" data={metrics.trials} />
                </div>

                {/* Platform Growth Visualizer */}
                <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40">
                    <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Platform Trajectory</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Revenue and acquisition growth over the selected period.</p>
                        </div>
                        <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleRangeChange} />
                    </div>

                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={380}>
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
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                    dy={16}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                                    dx={-10}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    dx={10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        backdropFilter: 'blur(12px)',
                                        color: '#fff',
                                        padding: '16px 20px',
                                    }}
                                    itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 500, padding: '4px 0' }}
                                    cursor={{ stroke: 'rgba(148, 163, 184, 0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    formatter={(value: number, name: string) => [
                                        name === 'mrr' ? formatExactCurrency(value) : value,
                                        name === 'mrr' ? 'Revenue' : 'Estates',
                                    ]}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}
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
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
