import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { Banknote, TrendingUp, Award, ArrowUpRight, Activity, Home, User, AlertTriangle, CreditCard, ShieldX } from 'lucide-react';

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

interface KPI {
    arr: number;
    arpe: number;
    arpu: number;
    revenue_at_risk: number;
    churn_rate: number;
}

interface HighValueTransaction {
    id: number;
    estate_name: string;
    amount: number;
    reference: string;
    method: string;
    date: string;
}

interface FailedPayment {
    id: number;
    estate_name: string;
    customer_email: string;
    amount: number;
    error: string;
    date: string;
}

interface Props {
    financialKPIs: KPI;
    forecastData: ForecastData[];
    revenueBreakdown: BreakdownData[];
    topPerformers: TopPerformer[];
    highValueTransactions: HighValueTransaction[];
    failedPayments: FailedPayment[];
}

export default function RevenueIndex({ financialKPIs, forecastData, revenueBreakdown, topPerformers, highValueTransactions, failedPayments }: Props) {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
    };

    // Calculate total active MRR from breakdown
    const totalActiveMRR = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);

    return (
        <ZeusLayout>
            <Head title="Revenue Intelligence" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-[1400px]">
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-10 max-w-3xl pt-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-500/10 dark:text-indigo-400">
                        <Banknote className="h-5 w-5" />
                    </div>
                    <h1 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">Revenue Intelligence</h1>
                    <p className="mt-4 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
                        Historical actuals, deep financial telemetry, and algorithmic MRR forecasting.
                    </p>
                </motion.div>

                {/* KPIs Row */}
                <motion.div variants={itemVariants} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* ARR */}
                    <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm dark:border-white/[0.04] dark:bg-slate-900/40">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <Activity className="h-4 w-4" />
                            <h3 className="text-sm font-medium tracking-wider uppercase">Annual Run Rate</h3>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCompactCurrency(financialKPIs.arr)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">Projected yearly revenue from current MRR</p>
                    </div>

                    {/* ARPE */}
                    <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm dark:border-white/[0.04] dark:bg-slate-900/40">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <Home className="h-4 w-4" />
                            <h3 className="text-sm font-medium tracking-wider uppercase">Avg Rev / Estate</h3>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{formatExactCurrency(financialKPIs.arpe)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">Average MRR per active estate</p>
                    </div>

                    {/* ARPU */}
                    <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm dark:border-white/[0.04] dark:bg-slate-900/40">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <User className="h-4 w-4" />
                            <h3 className="text-sm font-medium tracking-wider uppercase">Avg Rev / User</h3>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{formatExactCurrency(financialKPIs.arpu)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">Average MRR per paying resident</p>
                    </div>

                    {/* Revenue At Risk */}
                    <div className="rounded-2xl border border-red-200/50 bg-red-50/50 p-6 shadow-sm dark:border-red-900/20 dark:bg-red-900/10">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <h3 className="text-sm font-medium tracking-wider uppercase">Revenue at Risk</h3>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-black text-red-600 dark:text-red-400">
                                {formatCompactCurrency(financialKPIs.revenue_at_risk)}
                            </span>
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                                {financialKPIs.churn_rate}% Churn
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-red-500/70 dark:text-red-400/60">Failed transactions (30d)</p>
                    </div>
                </motion.div>

                {/* Main Content Grid: Top Layer (Charts) */}
                <div className="mb-8 grid gap-8 lg:grid-cols-3">
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

                        <div className="w-full min-h-[350px]">
                            <ResponsiveContainer width="100%" height={350} minWidth={100} minHeight={350}>
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
                                        formatter={(value: any, name: any) => [
                                            formatExactCurrency(Number(value || 0)),
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

                    {/* Right Col: Distribution */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Active MRR by Plan</h2>
                        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Total: {formatExactCurrency(totalActiveMRR)}</p>

                        <div className="flex items-center justify-center min-h-[220px]">
                            <ResponsiveContainer width="100%" height={220} minWidth={100} minHeight={220}>
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
                                        formatter={(value: any) => formatExactCurrency(Number(value || 0))}
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
                </div>

                {/* Bottom Row Grid (Lists) */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Failed Payments Feed */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                <ShieldX className="h-4 w-4 text-red-500" />
                                Failed Transactions
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {failedPayments.length > 0 ? (
                                failedPayments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/50 dark:bg-slate-800/30"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {formatExactCurrency(payment.amount)}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{payment.date}</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{payment.estate_name}</p>
                                        <p className="truncate text-[10px] text-red-500 dark:text-red-400">{payment.error}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-sm text-slate-500">No recent failed payments.</div>
                            )}
                        </div>
                    </motion.div>

                    {/* High-Value Success Feed */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                <CreditCard className="h-4 w-4 text-emerald-500" />
                                High Value Deposits
                            </h2>
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                &gt; ₦50k
                            </span>
                        </div>
                        <div className="space-y-4">
                            {highValueTransactions.length > 0 ? (
                                highValueTransactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/50 dark:bg-slate-800/30"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatExactCurrency(tx.amount)}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{tx.estate_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase dark:bg-slate-700 dark:text-slate-300">
                                                {tx.method || 'Card'}
                                            </span>
                                            <p className="mt-1 text-[10px] text-slate-400">{tx.date}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-sm text-slate-500">No high value transactions recently.</div>
                            )}
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
                                            {formatCompactCurrency(estate.total_revenue)}
                                        </span>
                                        <ArrowUpRight className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
