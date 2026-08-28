import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, HeartPulse, RefreshCcw, TrendingUp } from 'lucide-react';

import AnimatedCounter from '@/Components/Admin/Transactions/AnimatedCounter';

interface CollectionHealth {
    score: number;
    level: 'excellent' | 'healthy' | 'needs_attention' | 'critical';
    label: string;
    interpretation: string;
    projected_completion: string | null;
}

interface HeroMetrics {
    money_in_today: number;
    money_out_today: number;
    net_movement_today: number;
    successful_count: number;
    pending_count: number;
    failed_count: number;
    refunds_today: number;
    outstanding_balance: number;
    collection_health: CollectionHealth;
}

interface Props {
    hero?: HeroMetrics;
    loading?: boolean;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

const healthColors = {
    excellent: 'bg-emerald-500',
    healthy: 'bg-lime-500',
    needs_attention: 'bg-amber-500',
    critical: 'bg-rose-500',
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

function MetricSkeleton() {
    return <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />;
}

export default function FinancialHero({ hero, loading }: Props) {
    if (loading || !hero) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <MetricSkeleton key={i} />
                ))}
            </div>
        );
    }

    const metrics = [
        { label: "Today's Money In", value: hero.money_in_today, icon: ArrowUpRight, tone: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: "Today's Money Out", value: hero.money_out_today, icon: ArrowDownRight, tone: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Net Movement', value: hero.net_movement_today, icon: TrendingUp, tone: 'text-[#1F6FDB]', bg: 'bg-[#F0F5FF]' },
        { label: 'Successful', value: hero.successful_count, icon: CircleDollarSign, tone: 'text-emerald-700', bg: 'bg-emerald-50', isCount: true },
        { label: 'Pending', value: hero.pending_count, icon: CircleDollarSign, tone: 'text-amber-700', bg: 'bg-amber-50', isCount: true },
        { label: 'Failed', value: hero.failed_count, icon: CircleDollarSign, tone: 'text-rose-700', bg: 'bg-rose-50', isCount: true },
        { label: 'Refunds Today', value: hero.refunds_today, icon: RefreshCcw, tone: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Outstanding Balance', value: hero.outstanding_balance, icon: CircleDollarSign, tone: 'text-slate-700', bg: 'bg-slate-50' },
    ];

    return (
        <div className="space-y-4">
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                {metrics.map((metric) => (
                    <motion.div
                        key={metric.label}
                        variants={itemVariants}
                        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{metric.label}</p>
                                <p className={`mt-2 text-2xl font-black tracking-tight ${metric.tone}`}>
                                    {metric.isCount ? (
                                        <AnimatedCounter value={metric.value} />
                                    ) : (
                                        <AnimatedCounter value={metric.value} format={formatCurrency} />
                                    )}
                                </p>
                            </div>
                            <div className={`rounded-xl p-2.5 ${metric.bg}`}>
                                <metric.icon className={`h-4 w-4 ${metric.tone}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-100 bg-gradient-to-r from-[#0A3D91] to-[#1F6FDB] p-6 text-white shadow-lg"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                            <HeartPulse className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-[0.2em] text-white/70 uppercase">Collection Health Score</p>
                            <div className="mt-1 flex items-center gap-3">
                                <span className="text-3xl font-black">{hero.collection_health.score}</span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                                    <span className={`h-2.5 w-2.5 rounded-full ${healthColors[hero.collection_health.level]}`} />
                                    {hero.collection_health.label}
                                </span>
                            </div>
                            <p className="mt-2 max-w-xl text-sm text-white/85">{hero.collection_health.interpretation}</p>
                        </div>
                    </div>
                    {hero.collection_health.projected_completion && (
                        <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
                            <p className="text-white/70">Projected Completion</p>
                            <p className="mt-1 font-semibold">{hero.collection_health.projected_completion}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
