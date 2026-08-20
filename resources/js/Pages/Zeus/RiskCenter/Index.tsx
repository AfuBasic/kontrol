import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Activity, Users, Building2, Clock, CreditCard } from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface RiskFactor {
    id: string;
    entity_type: 'estate' | 'resident';
    entity_name: string;
    entity_id: number;
    health_score: number | null;
    risk_level: 'critical' | 'high' | 'low';
    risk_factors: string[];
    mrr_at_risk: number;
    last_active: string;
}

interface ActivityEvent {
    id: number;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    created_at: string;
    time_ago: string;
}

interface Props {
    riskList: RiskFactor[];
    activityStream: ActivityEvent[];
}

export default function RiskCenterIndex({ riskList, activityStream }: Props) {
    const formatCurrency = (amount: number) => {
        return '₦' + (amount / 100).toLocaleString('en-US');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Calculate aggregated metrics
    const totalMrrAtRisk = riskList.reduce((acc, curr) => acc + curr.mrr_at_risk, 0);
    const criticalAccounts = riskList.filter((r) => r.risk_level === 'critical').length;
    const highRiskAccounts = riskList.filter((r) => r.risk_level === 'high').length;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
    };

    return (
        <ZeusLayout>
            <Head title="Risk Center & Activity" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-7xl">
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        <ShieldAlert className="h-8 w-8 text-rose-500" />
                        Risk Center & Activity
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Early-warning detection for churn risks and real-time platform heartbeat.
                    </p>
                </motion.div>

                {/* Risk Metrics */}
                <motion.div variants={itemVariants} className="mb-10 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-500/30 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Critical MRR At Risk</p>
                        <p className="mt-2 truncate text-3xl font-bold text-slate-900 dark:text-white" title={formatCurrency(totalMrrAtRisk)}>
                            {formatCurrency(totalMrrAtRisk)}
                        </p>
                    </div>
                    <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-500/30 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Critical Action Required</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{criticalAccounts} Accounts</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <Activity className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">High Risk Watchlist</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{highRiskAccounts} Accounts</p>
                    </div>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* The Risk List */}
                    <motion.div
                        variants={itemVariants}
                        className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:col-span-2 dark:border-slate-800/50 dark:bg-[#0f1423]"
                    >
                        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                                    Intervention Required
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Estates and Residents showing strong signals of churning.
                                </p>
                            </div>
                        </div>

                        {riskList.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Account
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Risk Factors
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                MRR Impact
                                            </th>
                                            <th className="px-6 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                        {riskList.map((item) => (
                                            <tr
                                                key={item.id}
                                                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20 ${item.risk_level === 'critical' ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {item.entity_type === 'estate' ? (
                                                            <Building2 className="h-4 w-4 text-indigo-500" />
                                                        ) : (
                                                            <Users className="h-4 w-4 text-sky-500" />
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {item.entity_name}
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-2 text-[10px]">
                                                                <span
                                                                    className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                                                        item.risk_level === 'critical'
                                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                                    }`}
                                                                >
                                                                    {item.risk_level}
                                                                </span>
                                                                {item.health_score !== null && (
                                                                    <span className="text-slate-500 dark:text-slate-400">
                                                                        Score: {item.health_score}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {item.risk_factors.map((factor, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"
                                                            >
                                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                                {factor}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(item.mrr_at_risk)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.entity_type === 'estate' && (
                                                        <Link
                                                            href={`/zeus/estates/${item.entity_id}`}
                                                            className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-700 dark:hover:bg-slate-700"
                                                        >
                                                            Investigate
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-16 text-center">
                                <ShieldAlert className="mb-4 h-12 w-12 text-emerald-400 dark:text-emerald-500/50" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No critical risks detected</h3>
                                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                    The platform heartbeat is stable. No accounts are showing strong signals of imminent churn.
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Platform Activity Feed */}
                    <motion.div
                        variants={itemVariants}
                        className="flex h-[600px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]"
                    >
                        <div className="shrink-0 border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <Activity className="h-4 w-4 text-sky-500" />
                                Platform Heartbeat
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Real-time feed of major business events.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-4">
                            {activityStream.length > 0 ? (
                                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent md:before:mx-auto md:before:translate-x-0 dark:before:via-slate-800">
                                    {activityStream.map((activity, _idx) => (
                                        <div key={activity.id} className="relative flex items-start gap-6">
                                            <div className="relative z-10 mt-1 flex shrink-0 items-center justify-center">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-4 ring-white dark:ring-[#0f1423] ${
                                                        activity.type === 'success'
                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                            : activity.type === 'danger'
                                                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                                              : activity.type === 'warning'
                                                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                                                : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                                    }`}
                                                >
                                                    {activity.type === 'success' && <Building2 className="h-4 w-4" />}
                                                    {activity.type === 'danger' && <AlertTriangle className="h-4 w-4" />}
                                                    {activity.type === 'warning' && <CreditCard className="h-4 w-4" />}
                                                    {activity.type === 'info' && <Activity className="h-4 w-4" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-800/20">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activity.title}</h4>
                                                    <span className="text-[10px] font-medium text-slate-400">{activity.time_ago}</span>
                                                </div>
                                                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{activity.description}</p>
                                                <div className="mt-2 text-[10px] text-slate-400">{formatDate(activity.created_at)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <Activity className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">No recent activity</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Platform events will stream here.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
