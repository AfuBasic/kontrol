import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { Banknote, TrendingUp, Award, ArrowUpRight } from 'lucide-react';

interface ForecastData {
    month: string;
    actual: number | null;
    projected: number | null;
}

interface BreakdownData {
    name: string;
    value: number;
    color: string;
}

interface TopPerformer {
    id: number;
    name: string;
    total_revenue: number;
}

interface Props {
    forecastData: ForecastData[];
    revenueBreakdown: BreakdownData[];
    topPerformers: TopPerformer[];
}

export default function RevenueIndex({ forecastData, revenueBreakdown, topPerformers }: Props) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
    };

    // Calculate total active MRR from breakdown
    const totalActiveMRR = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);

    return (
        <ZeusLayout>
            <Head title="Revenue Intelligence" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-7xl">
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-10 max-w-3xl pt-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-500/10 dark:text-indigo-400">
                        <Banknote className="h-5 w-5" />
                    </div>
                    <h1 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">Revenue Intelligence</h1>
                    <p className="mt-4 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
                        Historical actuals and algorithmic MRR forecasting. Track exactly how the financial engine of the platform is performing.
                    </p>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Col: Forecast Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl lg:col-span-2 dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <div className="mb-10 flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                                    MRR Forecast Trajectory
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    12-month historical actuals with a 3-month Simple Moving Average projection.
                                </p>
                            </div>
                        </div>

                        <div className="w-full">
                            <ResponsiveContainer width="100%" height={400}>
                                <ComposedChart data={forecastData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                        dy={16}
                                    />
                                    <YAxis hide={true} domain={['dataMin - 10000', 'dataMax + 20000']} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                            background: 'rgba(255, 255, 255, 0.9)',
                                            backdropFilter: 'blur(8px)',
                                        }}
                                        formatter={(value: number, name: string) => [
                                            formatCurrency(value),
                                            name === 'actual' ? 'Actual MRR' : 'Projected MRR',
                                        ]}
                                        labelStyle={{ color: '#64748b', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}
                                    />

                                    {/* Actual Historical Area */}
                                    <Area
                                        type="monotone"
                                        dataKey="actual"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="url(#colorActual)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                                    />

                                    {/* Projected Forecast Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="projected"
                                        stroke="#a8a29e"
                                        strokeWidth={3}
                                        strokeDasharray="6 6"
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#a8a29e' }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Right Col: Distribution & Top Performers */}
                    <div className="space-y-8">
                        {/* Revenue Distribution */}
                        <motion.div
                            variants={itemVariants}
                            className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                        >
                            <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Active MRR by Plan</h2>
                            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Total: {formatCurrency(totalActiveMRR)}</p>

                            <div className="flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={revenueBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {revenueBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Custom Legend */}
                            <div className="mt-4 grid grid-cols-2 gap-y-3">
                                {revenueBreakdown.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-900 dark:text-white">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {((item.value / totalActiveMRR) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Top Performers Table */}
                        <motion.div
                            variants={itemVariants}
                            className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                        >
                            <h2 className="mb-6 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                <Award className="h-4 w-4 text-amber-500" />
                                Lifetime Top Performers
                            </h2>
                            <div className="space-y-4">
                                {topPerformers.map((estate, index) => (
                                    <Link
                                        key={estate.id}
                                        href={`/zeus/estates/${estate.id}`}
                                        className="group flex items-center justify-between rounded-xl border border-transparent p-2 transition-all hover:border-slate-200/50 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-slate-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                #{index + 1}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                                                {estate.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(estate.total_revenue)}
                                            </span>
                                            <ArrowUpRight className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
