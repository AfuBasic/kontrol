import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import { Clock, AlertTriangle, ArrowRightLeft } from 'lucide-react';

interface Economics {
    failed_payment_rate: number;
    avg_days_to_pay: number;
}

interface FunnelItem {
    name: string;
    value: number;
    fill: string;
}

interface AgingBucket {
    bucket: string;
    amount: number;
}

interface Props {
    economics: Economics;
    funnel: FunnelItem[];
    aging: AgingBucket[];
}

export default function MoneyFlowIndex({ economics, funnel, aging }: Props) {
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
                        Track the operational friction of moving money. Monitor collection speeds, payment failure rates, and visualize exactly where
                        your outstanding balances are aging.
                    </p>
                </motion.div>

                {/* Top Metrics Row */}
                <motion.div variants={itemVariants} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Time-to-Pay</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{economics.avg_days_to_pay}</span>
                            <span className="text-sm text-slate-500">days</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${economics.failed_payment_rate > 5 ? 'text-red-500' : 'text-emerald-500'}`} />
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Failed Transaction Rate</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span
                                className={`text-3xl font-bold tracking-tight ${economics.failed_payment_rate > 5 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}
                            >
                                {economics.failed_payment_rate}%
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Collection Funnel */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <div className="mb-10 flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                    <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                                    Collection Funnel
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Total invoiced volume versus what has been successfully collected.
                                </p>
                            </div>
                        </div>

                        <div className="w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                        width={120}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                            background: 'rgba(255, 255, 255, 0.9)',
                                            backdropFilter: 'blur(8px)',
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                        {funnel.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Aging Buckets */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40"
                    >
                        <div className="mb-10 flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Outstanding Aging Buckets
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Pending and overdue balances bucketed by days past due.
                                </p>
                            </div>
                        </div>

                        <div className="w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={aging} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis
                                        dataKey="bucket"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                        dy={16}
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
                                        formatter={(value: number) => [formatCurrency(value), 'Value at Risk']}
                                    />
                                    {/* The longer it ages, the more intense the color gets (orange -> red) */}
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={48}>
                                        {aging.map((entry, index) => {
                                            const colors = ['#fbbf24', '#f59e0b', '#ea580c', '#dc2626']; // Amber-400 to Red-600
                                            return <Cell key={`cell-${index}`} fill={colors[index]} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
