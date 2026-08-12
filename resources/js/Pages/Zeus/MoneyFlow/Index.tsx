import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import { AlertTriangle, TrendingUp, CreditCard, Clock, ArrowUpRight } from 'lucide-react';

interface Friction {
    failed_payment_rate: number;
    avg_transaction_size: number;
}

interface VelocityItem {
    date: string;
    amount: number;
}

interface RecentFailure {
    id: number;
    estate_id: number;
    estate_name: string;
    amount: number;
    date: string;
}

interface Props {
    friction: Friction;
    velocity: VelocityItem[];
    recentFailures: RecentFailure[];
}

export default function MoneyFlowIndex({ friction, velocity, recentFailures }: Props) {
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

    return (
        <ZeusLayout>
            <Head title="Money Flow" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-7xl">
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-10 max-w-3xl pt-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shadow-inner dark:bg-orange-500/10 dark:text-orange-400">
                        <ArrowPathRoundedSquareIcon className="h-5 w-5" />
                    </div>
                    <h1 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">Money Flow</h1>
                    <p className="mt-4 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
                        Track prepaid cash velocity and checkout friction. Because we operate on a strict paywall model, we monitor how fast cash
                        arrives, not how long it takes to collect.
                    </p>
                </motion.div>

                {/* Top Metrics Row */}
                <motion.div variants={itemVariants} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Transaction Size</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {formatCompactCurrency(friction.avg_transaction_size)}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${friction.failed_payment_rate > 5 ? 'text-red-500' : 'text-emerald-500'}`} />
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Failed Transaction Rate</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span
                                className={`text-3xl font-bold tracking-tight ${friction.failed_payment_rate > 5 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}
                            >
                                {friction.failed_payment_rate}%
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Daily Cash Velocity Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl lg:col-span-2 dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <div className="mb-10 flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    Daily Cash Velocity (30 Days)
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Total raw volume of successful payments hitting the platform daily.
                                </p>
                            </div>
                        </div>

                        <div className="w-full">
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={velocity} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                        dy={16}
                                        minTickGap={20}
                                    />
                                    <YAxis hide={true} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                            background: 'rgba(255, 255, 255, 0.9)',
                                            backdropFilter: 'blur(8px)',
                                        }}
                                        formatter={(value: any) => [formatExactCurrency(Number(value)), 'Gross Volume']}
                                        labelStyle={{ color: '#64748b', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#10b981" maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Recent Failures Log */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <div className="mb-6 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Checkout Friction Log</h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Most recent failed payments.</p>
                            </div>
                        </div>

                        {recentFailures.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-sm text-slate-500">No failed payments recently.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentFailures.map((failure) => (
                                    <Link
                                        key={failure.id}
                                        href={`/zeus/estates/${failure.estate_id}`}
                                        className="group flex flex-col justify-between rounded-xl border border-transparent p-3 transition-all hover:border-slate-200/50 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-slate-800"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                                {failure.estate_name}
                                            </span>
                                            <span className="text-xs font-semibold text-red-500 dark:text-red-400">Failed</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {formatExactCurrency(failure.amount)}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Clock className="h-3 w-3" />
                                                {failure.date}
                                                <ArrowUpRight className="ml-1 h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
