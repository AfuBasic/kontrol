import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    CartesianGrid,
    Legend
} from 'recharts';
import { AlertCircle, ArrowUpRight, ArrowDownRight, ShieldCheck, Activity } from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface PlanAnalytics {
    plan_name: string;
    estates_count: number;
    mrr: number;
    color: string;
}

interface RenewalCohort {
    cohort: string;
    count: number;
    mrr: number;
}

interface MigrationMatrix {
    name: string;
    value: number;
    fill: string;
}

interface Props {
    planAnalytics: PlanAnalytics[];
    renewalCohorts: RenewalCohort[];
    migrationMatrix: MigrationMatrix[];
}

export default function SubscriptionsIndex({ planAnalytics, renewalCohorts, migrationMatrix }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount / 100); // Assuming prices are in kobo
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
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
    };

    const totalAtRisk = renewalCohorts.reduce((sum, cohort) => sum + cohort.mrr, 0);

    return (
        <ZeusLayout>
            <Head title="Subscription Intelligence" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-7xl">
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Subscription Intelligence</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Monitor retention cohorts, plan popularity, and migration flows across the platform.
                    </p>
                </motion.div>

                {/* Upcoming Renewals Alert */}
                <motion.div variants={itemVariants} className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                            Upcoming Renewals (90 Days)
                        </h2>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                        {renewalCohorts.map((cohort, idx) => (
                            <div
                                key={cohort.cohort}
                                className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#0f1423] ${
                                    idx === 0 
                                        ? 'border-amber-200 dark:border-amber-500/30' 
                                        : 'border-slate-100 dark:border-slate-800/50'
                                }`}
                            >
                                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    {cohort.cohort}
                                </p>
                                <div className="mt-4 flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(cohort.mrr)}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            from {cohort.count} estates
                                        </p>
                                    </div>
                                    {idx === 0 && (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                            <Activity className="h-4 w-4" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Plan Popularity (Estates vs Revenue) */}
                    <motion.div variants={itemVariants} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Plan Distribution
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Estates count and MRR contribution per plan tier.
                            </p>
                        </div>
                        <div className="p-8">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={planAnalytics} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.1)" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="plan_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                        <RechartsTooltip
                                            cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                backdropFilter: 'blur(12px)',
                                                color: '#fff',
                                                padding: '12px 16px',
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}
                                            formatter={(value: number, name: string) => [
                                                name === 'mrr' ? formatCurrency(value) : value,
                                                name === 'mrr' ? 'MRR' : 'Estates'
                                            ]}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                                        <Bar dataKey="estates_count" name="Estates" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={16} />
                                        <Bar dataKey="mrr" name="MRR" fill="#34d399" radius={[0, 4, 4, 0]} barSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>

                    {/* Migration Flow (Upgrades vs Downgrades) */}
                    <motion.div variants={itemVariants} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Migration Flow (MTD)
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Upgrades vs Downgrades for the current month.
                            </p>
                        </div>
                        <div className="flex h-[300px] items-center justify-center p-8">
                            {migrationMatrix.every(m => m.value === 0) ? (
                                <div className="text-center">
                                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No plan changes this month.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={migrationMatrix} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <RechartsTooltip
                                            cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                backdropFilter: 'blur(12px)',
                                                color: '#fff',
                                            }}
                                            formatter={(value: number) => [value, 'Estates']}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                                            {migrationMatrix.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
