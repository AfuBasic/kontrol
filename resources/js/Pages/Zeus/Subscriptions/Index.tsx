import { Head, Link } from '@inertiajs/react';
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
import { 
    AlertCircle, 
    ArrowUpRight, 
    ArrowDownRight, 
    ShieldCheck, 
    Activity,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Users,
    Clock
} from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Kpis {
    active_subscriptions: number;
    past_due_subscriptions: number;
    churned_this_month: number;
    total_mrr: number;
}

interface PlanAnalytics {
    plan_name: string;
    residents_count: number;
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

interface RecentChange {
    id: number;
    entity_name: string;
    entity_id: number;
    old_plan: string;
    new_plan: string;
    type: 'upgrade' | 'downgrade';
    date: string;
}

interface PastDue {
    id: string;
    entity_name: string;
    plan_name: string;
    amount_due: number;
    past_due_since: string;
    days_past_due: number;
}

interface Props {
    kpis: Kpis;
    planAnalytics: PlanAnalytics[];
    renewalCohorts: RenewalCohort[];
    migrationMatrix: MigrationMatrix[];
    recentChanges: RecentChange[];
    pastDue: PastDue[];
}

export default function SubscriptionsIndex({ 
    kpis, 
    planAnalytics, 
    renewalCohorts, 
    migrationMatrix, 
    recentChanges, 
    pastDue 
}: Props) {
    const formatCurrency = (amount: number) => {
        return '₦' + (amount / 100).toLocaleString('en-US');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
    };

    return (
        <ZeusLayout>
            <Head title="Subscription Intelligence" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-7xl">
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Subscription Intelligence</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Monitor retention cohorts, plan popularity, and migration flows for active residents.
                    </p>
                </motion.div>

                {/* KPI Cards */}
                <motion.div variants={itemVariants} className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <Activity className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Active Subscriptions</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{kpis.active_subscriptions.toLocaleString('en-US')}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Total MRR</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.total_mrr)}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            <TrendingDown className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Churned (MTD)</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{kpis.churned_this_month.toLocaleString('en-US')}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Past Due</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{kpis.past_due_subscriptions.toLocaleString('en-US')}</p>
                    </div>
                </motion.div>

                {/* Upcoming Renewals Alert */}
                <motion.div variants={itemVariants} className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                            Upcoming Renewals (90 Days)
                        </h2>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                        {renewalCohorts.map((cohort, idx) => (
                            <div
                                key={cohort.cohort}
                                className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#0f1423] transition-all hover:scale-[1.01] ${
                                    idx === 0 
                                        ? 'border-indigo-200 dark:border-indigo-500/30' 
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
                                            from {cohort.count} residents
                                        </p>
                                    </div>
                                    {idx === 0 && (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                            <AlertCircle className="h-4 w-4" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Charts Grid */}
                <div className="mb-10 grid gap-8 lg:grid-cols-2">
                    {/* Plan Popularity */}
                    <motion.div variants={itemVariants} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Plan Distribution
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Breakdown of residents per plan tier.
                            </p>
                        </div>
                        <div className="p-8">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={planAnalytics} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
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
                                            formatter={(value: number, name: string) => {
                                                if (name === 'mrr') return [formatCurrency(value), 'MRR'];
                                                if (name === 'residents_count') return [value, 'Residents'];
                                                return [value, name];
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                                        <Bar dataKey="residents_count" name="Residents" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={16} />
                                        <Bar dataKey="mrr" name="MRR" fill="#34d399" radius={[0, 4, 4, 0]} barSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>

                    {/* Migration Flow */}
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
                                <div className="text-center flex flex-col items-center">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-800">
                                        <Activity className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">No migrations yet</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No plan changes this month.</p>
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
                                            formatter={(value: number) => [value, 'Subscriptions']}
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

                {/* Detailed Data Tables */}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Recent Plan Changes */}
                    <motion.div variants={itemVariants} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                Recent Plan Changes
                            </h3>
                        </div>
                        {recentChanges.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Subscriber</th>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Migration</th>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                        {recentChanges.map((change) => (
                                            <tr key={change.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                                        <Users className="h-3.5 w-3.5 text-sky-500" />
                                                        <span>{change.entity_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-medium">
                                                        <span className="text-slate-500 dark:text-slate-400">{change.old_plan}</span>
                                                        {change.type === 'upgrade' ? (
                                                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                                        ) : (
                                                            <ArrowDownRight className="h-3 w-3 text-rose-500" />
                                                        )}
                                                        <span className={change.type === 'upgrade' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                            {change.new_plan}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                                                    {formatDate(change.date)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Users className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                                <p className="text-sm font-bold text-slate-900 dark:text-white">No historical changes</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Plan migrations will appear here.</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Past Due / At Risk */}
                    <motion.div variants={itemVariants} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <CreditCard className="h-4 w-4 text-rose-500" />
                                Past Due Subscriptions
                            </h3>
                        </div>
                        {pastDue.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Subscriber</th>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Amount Due</th>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                        {pastDue.map((item) => (
                                            <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-3.5 w-3.5 text-sky-500" />
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.entity_name}</div>
                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.plan_name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(item.amount_due)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold tracking-tight text-rose-700 uppercase dark:bg-rose-500/10 dark:text-rose-400">
                                                        {item.days_past_due} Days Overdue
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <ShieldCheck className="h-8 w-8 text-emerald-400 dark:text-emerald-500/50 mb-3" />
                                <p className="text-sm font-bold text-slate-900 dark:text-white">All Clear</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No past due subscriptions at the moment.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
