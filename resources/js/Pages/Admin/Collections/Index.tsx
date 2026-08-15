import { PlusIcon } from '@heroicons/react/24/outline';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { clsx, type ClassValue } from 'clsx';
import { animate, AnimatePresence, motion, useMotionValue } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Bell,
    Building2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Download,
    DollarSign,
    Edit2,
    Info,
    Layers,
    Search,
    Settings2,
    Shield,
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    Wallet,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { twMerge } from 'tailwind-merge';
import { create, edit, index, publish, show } from '@/actions/App/Http/Controllers/Admin/CollectionController';
import { index as analyticsIndex } from '@/actions/App/Http/Controllers/Admin/CollectionAnalyticsController';
import BankingSetupModal from '@/Components/BankingSetupModal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { OfflineState } from '@/Components/States';
import { useDebounce } from '@/Hooks/useDebounce';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import AdminLayout from '@/Layouts/AdminLayout';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';

// ─── Utilities ────────────────────────────────────────────────────────────────

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function fmt(n: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
}

function fmtCompact(n: number) {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
    return fmt(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '₦' }: { value: number; prefix?: string }) {
    const motionValue = useMotionValue(0);
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => {
                if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString('en-NG');
            },
        });
        return () => controls.stop();
    }, [value, motionValue, prefix]);
    return <span ref={ref}>{prefix}0</span>;
}

function SkeletonBlock({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-xl bg-slate-100', className)} />;
}

function HealthRing({ score, color }: { score: number; color: string }) {
    const size = 110;
    const sw = 8;
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const colorMap: Record<string, string> = {
        emerald: '#10b981',
        blue: '#3b82f6',
        amber: '#f59e0b',
        rose: '#ef4444',
        slate: '#94a3b8',
    };
    return (
        <svg width={size} height={size} className="shrink-0">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={colorMap[color] ?? '#10b981'}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ * (1 - score / 100) }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </svg>
    );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type: 'one_time' | 'recurring';
    status: 'draft' | 'active' | 'archived';
    assignments_count: number;
    targets_count: number;
    applies_to: 'all' | 'target' | 'property_owner' | 'zone';
    created_at: string;
};

type HealthScore = {
    score: number;
    grade: string;
    color: string;
    explanation: string;
};

type TodaySnapshot = {
    collected_today: number;
    payments_today: number;
    payers_today: number;
    collected_this_week: number;
    payments_this_week: number;
};

type ActivityItem = {
    id: number;
    user_name: string;
    amount: number;
    collection_name: string;
    paid_at_human: string;
};

type CollectionInsight = {
    id: number;
    ulid: string;
    name: string;
    due_at: string | null;
    expected: number;
    collected: number;
    outstanding: number;
    rate: number;
    overdue_count: number;
    pending_count: number;
    total_count: number;
};

type CollectionInsights = {
    best: CollectionInsight | null;
    worst: CollectionInsight | null;
    largest_outstanding: CollectionInsight | null;
    all: CollectionInsight[];
};

type AnalyticsData = {
    trends: { date: string; expected: number; actual: number }[];
    activity: { id: number; actor: string; action: string; amount: number; timestamp: string }[];
    performance: { id: number; name: string; expected: number; collected: number; progress: number }[];
};

type Props = {
    collections: {
        data: Collection[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    totalResidents: number;
    hasBanking: boolean;
    banks: { name: string; code: string }[];
    settlement: { bank_name: string | null; bank_code: string | null; account_number: string | null; account_name: string | null };
    filters: { search: string; status: string };
    stats: { total_expected: number; total_realised: number; active_collections: number; defaulters_count: number };
    healthScore: HealthScore;
    todaySnapshot: TodaySnapshot;
    recentActivity: ActivityItem[];
    collectionInsights: CollectionInsights;
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CollectionsIndex({
    collections,
    totalResidents,
    hasBanking,
    banks,
    settlement,
    filters,
    stats,
    healthScore,
    todaySnapshot,
    recentActivity,
    collectionInsights,
}: Props) {
    const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const debouncedSearch = useDebounce(search, 300);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
    const { quality, isOnline } = useNetworkQuality();
    const skipCharts = quality === 'poor' || quality === 'offline' || !isOnline;

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch, status: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [debouncedSearch, filters.search, statusFilter]);

    useEffect(() => {
        if (skipCharts) {
            setIsAnalyticsLoading(false);
            return;
        }

        setIsAnalyticsLoading(true);
        axios
            .get(analyticsIndex.url(), { params: { days: 30 } })
            .then((res) => {
                setAnalyticsData(res.data);
                setIsAnalyticsLoading(false);
            })
            .catch(() => setIsAnalyticsLoading(false));
    }, [skipCharts]);

    const handleStatusChange = useCallback(
        (s: string) => {
            setStatusFilter(s);
            router.get(index.url(), { search, status: s }, { preserveState: true, preserveScroll: true, replace: true });
        },
        [search],
    );

    const handlePublish = () => {
        if (!selectedCollection) return;
        setIsPublishing(true);
        router.post(
            publish.url(selectedCollection.ulid),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsPublishing(false);
                    setIsPublishModalOpen(false);
                    setSelectedCollection(null);
                },
            },
        );
    };

    const hasActiveFilters = Boolean((filters.search || '').length || (filters.status || '').length);
    const showFinancialDashboard = collections.total > 0 || hasActiveFilters;

    // ── Derived values
    const expected = Number(stats.total_expected || 0);
    const realised = Number(stats.total_realised || 0);
    const outstanding = expected - realised;
    const realisedPct = expected > 0 ? Math.round((realised / expected) * 100) : 0;

    const gradeColors: Record<string, string> = {
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    // Smart insights: auto-generated observations from data
    const smartInsights = useMemo(() => {
        const chips: { text: string; icon: React.ReactNode; color: string }[] = [];

        if (realisedPct === 100 && expected > 0) {
            chips.push({ text: 'All collections are fully paid', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'emerald' });
        } else if (realisedPct > 75) {
            chips.push({ text: `${realisedPct}% of total target collected`, icon: <TrendingUp className="h-3.5 w-3.5" />, color: 'emerald' });
        } else if (realisedPct > 0) {
            chips.push({ text: `${realisedPct}% of target collected so far`, icon: <Activity className="h-3.5 w-3.5" />, color: 'blue' });
        }

        if (stats.defaulters_count > 0) {
            chips.push({
                text: `${stats.defaulters_count} ${stats.defaulters_count === 1 ? 'resident has' : 'residents have'} outstanding balances`,
                icon: <AlertCircle className="h-3.5 w-3.5" />,
                color: 'rose',
            });
        }

        if (collectionInsights?.best && collectionInsights.best.rate === 100) {
            chips.push({ text: `${collectionInsights.best.name} is fully collected`, icon: <Trophy className="h-3.5 w-3.5" />, color: 'emerald' });
        } else if (collectionInsights?.best) {
            chips.push({
                text: `${collectionInsights.best.name} leads at ${collectionInsights.best.rate}%`,
                icon: <Trophy className="h-3.5 w-3.5" />,
                color: 'blue',
            });
        }

        if (collectionInsights?.worst) {
            chips.push({
                text: `${collectionInsights.worst.name} needs attention - ${collectionInsights.worst.rate}% collected`,
                icon: <AlertTriangle className="h-3.5 w-3.5" />,
                color: 'amber',
            });
        }

        if (stats.active_collections > 0) {
            chips.push({
                text: `${stats.active_collections} active ${stats.active_collections === 1 ? 'collection' : 'collections'} in progress`,
                icon: <Layers className="h-3.5 w-3.5" />,
                color: 'slate',
            });
        }

        if (outstanding > 0) {
            chips.push({
                text: `${fmtCompact(outstanding)} outstanding across all collections`,
                icon: <DollarSign className="h-3.5 w-3.5" />,
                color: 'amber',
            });
        }

        if (totalResidents > 0) {
            chips.push({ text: `${totalResidents} residents on this estate`, icon: <Info className="h-3.5 w-3.5" />, color: 'slate' });
        }

        return chips;
    }, [realisedPct, expected, stats, collectionInsights, outstanding, totalResidents]);

    const chipColorMap: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    const ChartTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.length) {
            return (
                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
                    <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</p>
                    {payload.map((e: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                            <span className="text-slate-500">{e.name === 'expected' ? 'Expected' : 'Collected'}</span>
                            <span className="ml-auto text-slate-900">{fmtCompact(e.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <Head title="Financial Command Center" />

            <div className="space-y-5">
                {/* ── Banking Alert ── */}
                {!hasBanking && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                <AlertTriangle className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <p className="font-bold text-amber-900">Settlement account required</p>
                                <p className="text-xs text-amber-700">Set up a bank account before creating collections.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-amber-700 active:scale-95"
                        >
                            <Building2 className="h-3.5 w-3.5" /> Setup Bank Account
                        </button>
                    </motion.div>
                )}

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Financial Command Center</h1>
                        <p className="text-sm text-slate-400">Estate collections overview and financial intelligence.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{hasBanking ? 'Settlement' : 'Setup Bank'}</span>
                        </button>
                        {hasBanking ? (
                            <Link
                                href={create.url()}
                                className="flex items-center gap-2 rounded-xl bg-[#1F6FDB] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                            >
                                <PlusIcon className="h-3.5 w-3.5" /> New Collection
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsBankingModalOpen(true)}
                                className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-400"
                            >
                                <PlusIcon className="h-3.5 w-3.5" /> New Collection
                            </button>
                        )}
                    </div>
                </div>

                {!showFinancialDashboard ? (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center rounded-3xl bg-white px-6 py-20 text-center ring-1 ring-slate-100"
                    >
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1F6FDB]/10 text-[#1F6FDB] shadow-inner">
                            <Wallet className="h-9 w-9" />
                        </div>
                        <p className="mb-2 text-[10px] font-black tracking-[0.25em] text-[#1F6FDB] uppercase">Financial Command Center</p>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Create your first collection</h2>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                            Once you publish a levy, due, or recurring bill, this workspace will show financial health, collection progress, and live
                            payment activity.
                        </p>
                        {hasBanking ? (
                            <Link
                                href={create.url()}
                                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#1F6FDB] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
                            >
                                <PlusIcon className="h-4 w-4" />
                                New Collection
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsBankingModalOpen(true)}
                                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95"
                            >
                                <Building2 className="h-4 w-4" />
                                Set up settlement first
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <>
                        {/* ══════════════════════════════════════════════════════════════
                    ZONE 1 - FINANCIAL HEALTH HERO
                ══════════════════════════════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden rounded-3xl bg-[#0A0F1C] p-7 text-white shadow-2xl ring-1 ring-white/5 sm:p-9"
                        >
                            {/* Background glows */}
                            <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-500/20 blur-[80px]" />
                            <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />

                            <div className="relative z-10">
                                {/* Top row */}
                                <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                    {/* Left: Health Score */}
                                    <div className="flex items-center gap-5">
                                        <Deferred
                                            data="healthScore"
                                            fallback={
                                                <div className="relative flex h-[110px] w-[110px] items-center justify-center">
                                                    <div className="h-[110px] w-[110px] animate-pulse rounded-full bg-white/10" />
                                                </div>
                                            }
                                        >
                                            {healthScore && (
                                                <div className="relative">
                                                    <HealthRing score={healthScore.score} color={healthScore.color} />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <motion.span
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="text-2xl leading-none font-black text-white"
                                                        >
                                                            {healthScore.score}
                                                        </motion.span>
                                                        <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase">Score</span>
                                                    </div>
                                                </div>
                                            )}
                                        </Deferred>

                                        <div>
                                            <p className="mb-1.5 text-[10px] font-bold tracking-widest text-white/40 uppercase">Financial Health</p>
                                            <Deferred
                                                data="healthScore"
                                                fallback={
                                                    <div className="space-y-2">
                                                        <SkeletonBlock className="h-6 w-24 bg-white/10" />
                                                        <SkeletonBlock className="h-3.5 w-48 bg-white/10" />
                                                    </div>
                                                }
                                            >
                                                {healthScore && (
                                                    <>
                                                        <div
                                                            className={cn(
                                                                'mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
                                                                gradeColors[healthScore.color],
                                                            )}
                                                        >
                                                            <Shield className="h-3 w-3" />
                                                            {healthScore.grade}
                                                        </div>
                                                        <p className="max-w-xs text-sm leading-relaxed text-white/55">{healthScore.explanation}</p>
                                                    </>
                                                )}
                                            </Deferred>
                                        </div>
                                    </div>

                                    {/* Right: Revenue pillars */}
                                    <div className="grid grid-cols-3 gap-4 lg:gap-6">
                                        <div className="text-center lg:text-right">
                                            <p className="mb-1 text-[9px] font-bold tracking-widest text-white/30 uppercase">Expected</p>
                                            <p className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                                <AnimatedNumber value={expected} />
                                            </p>
                                        </div>
                                        <div className="text-center lg:text-right">
                                            <p className="mb-1 text-[9px] font-bold tracking-widest text-emerald-400/60 uppercase">Collected</p>
                                            <p className="text-xl font-black tracking-tight text-emerald-400 sm:text-2xl">
                                                <AnimatedNumber value={realised} />
                                            </p>
                                        </div>
                                        <div className="text-center lg:text-right">
                                            <p className="mb-1 text-[9px] font-bold tracking-widest text-rose-400/60 uppercase">Outstanding</p>
                                            <p className="text-xl font-black tracking-tight text-rose-400 sm:text-2xl">
                                                <AnimatedNumber value={outstanding} />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-white/40">Overall Collection Progress</span>
                                        <span className="text-white/70">{realisedPct}% of target</span>
                                    </div>
                                    <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${realisedPct}%` }}
                                            transition={{ duration: 1.4, ease: 'easeOut' }}
                                            className={cn(
                                                'absolute inset-y-0 left-0 rounded-full',
                                                realisedPct >= 85
                                                    ? 'bg-emerald-400'
                                                    : realisedPct >= 60
                                                      ? 'bg-blue-400'
                                                      : realisedPct >= 30
                                                        ? 'bg-amber-400'
                                                        : 'bg-rose-400',
                                            )}
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-white/30">
                                        <span>
                                            {stats.active_collections} active collection{stats.active_collections !== 1 ? 's' : ''}
                                        </span>
                                        <span>·</span>
                                        <span>{totalResidents} residents</span>
                                        {stats.defaulters_count > 0 && (
                                            <>
                                                <span>·</span>
                                                <span className="text-rose-400/70">{stats.defaulters_count} with outstanding balances</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ══════════════════════════════════════════════════════════════
                    SMART INSIGHTS STRIP
                ══════════════════════════════════════════════════════════════ */}
                        {smartInsights.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"
                            >
                                <div className="mb-3 flex items-center gap-2">
                                    <Zap className="h-3.5 w-3.5 text-slate-400" />
                                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Smart Insights</p>
                                </div>
                                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                                    {smartInsights.map((chip, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.05 + i * 0.05 }}
                                            className={cn(
                                                'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold',
                                                chipColorMap[chip.color],
                                            )}
                                        >
                                            {chip.icon}
                                            {chip.text}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════════════════════════════════════════════════════════
                    ZONE 2+3 - TODAY'S SNAPSHOT + COLLECTION INSIGHTS
                ══════════════════════════════════════════════════════════════ */}
                        <div className="grid gap-4 lg:grid-cols-3">
                            {/* Zone 2 - Today's Snapshot */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-2xl bg-white p-5 ring-1 ring-slate-100"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Today's Activity</h3>
                                        <p className="text-xs text-slate-400">Live payment updates</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
                                    </div>
                                </div>

                                <Deferred
                                    data="todaySnapshot"
                                    fallback={
                                        <div className="space-y-3">
                                            {[...Array(4)].map((_, i) => (
                                                <SkeletonBlock key={i} className="h-10" />
                                            ))}
                                        </div>
                                    }
                                >
                                    {todaySnapshot && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                                                <div>
                                                    <p className="text-[10px] font-bold tracking-widest text-emerald-500/70 uppercase">
                                                        Collected Today
                                                    </p>
                                                    <p className="text-lg font-black text-emerald-700">{fmtCompact(todaySnapshot.collected_today)}</p>
                                                </div>
                                                <DollarSign className="h-5 w-5 text-emerald-300" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                                                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Payments</p>
                                                    <p className="text-lg font-black text-slate-900">{todaySnapshot.payments_today}</p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                                                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Payers</p>
                                                    <p className="text-lg font-black text-slate-900">{todaySnapshot.payers_today}</p>
                                                </div>
                                            </div>
                                            <div className="rounded-xl bg-blue-50 px-4 py-3">
                                                <p className="text-[9px] font-bold tracking-widest text-blue-500/70 uppercase">This Week</p>
                                                <p className="text-base font-black text-blue-700">{fmtCompact(todaySnapshot.collected_this_week)}</p>
                                                <p className="text-[10px] text-blue-400">
                                                    {todaySnapshot.payments_this_week} payment{todaySnapshot.payments_this_week !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </Deferred>
                            </motion.div>

                            {/* Zone 3 - Collection Insights */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="lg:col-span-2"
                            >
                                <h3 className="mb-3 font-bold text-slate-900">Collection Insights</h3>
                                <Deferred
                                    data="collectionInsights"
                                    fallback={
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {[...Array(3)].map((_, i) => (
                                                <SkeletonBlock key={i} className="h-[120px]" />
                                            ))}
                                        </div>
                                    }
                                >
                                    {collectionInsights && (
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {/* Best Performing */}
                                            {collectionInsights.best ? (
                                                <Link
                                                    href={show.url(collectionInsights.best.ulid)}
                                                    className="group rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                                >
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                                            <Trophy className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-widest text-emerald-600/70 uppercase">
                                                            Best Performing
                                                        </span>
                                                    </div>
                                                    <p className="mb-1 truncate text-sm font-bold text-slate-900">{collectionInsights.best.name}</p>
                                                    <p className="text-2xl font-black text-emerald-700">{collectionInsights.best.rate}%</p>
                                                    <p className="mt-1 text-[10px] font-medium text-emerald-600/70">
                                                        {collectionInsights.best.total_count -
                                                            Math.round(
                                                                collectionInsights.best.total_count * (1 - collectionInsights.best.rate / 100),
                                                            )}{' '}
                                                        of {collectionInsights.best.total_count} residents paid
                                                    </p>
                                                </Link>
                                            ) : (
                                                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                                            <Trophy className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                            Best Performing
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400">No active collections</p>
                                                </div>
                                            )}

                                            {/* Needs Attention */}
                                            {collectionInsights.worst ? (
                                                <Link
                                                    href={show.url(collectionInsights.worst.ulid)}
                                                    className="group rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                                >
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-widest text-amber-600/70 uppercase">
                                                            Needs Attention
                                                        </span>
                                                    </div>
                                                    <p className="mb-1 truncate text-sm font-bold text-slate-900">{collectionInsights.worst.name}</p>
                                                    <p className="text-2xl font-black text-amber-700">{collectionInsights.worst.rate}%</p>
                                                    <p className="mt-1 text-[10px] font-medium text-amber-600/70">
                                                        {fmtCompact(collectionInsights.worst.outstanding)} outstanding
                                                    </p>
                                                </Link>
                                            ) : (
                                                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-widest text-emerald-600/70 uppercase">
                                                            All Clear
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-emerald-700">No collections needing attention</p>
                                                </div>
                                            )}

                                            {/* Largest Outstanding */}
                                            {collectionInsights.largest_outstanding && collectionInsights.largest_outstanding.outstanding > 0 ? (
                                                <Link
                                                    href={show.url(collectionInsights.largest_outstanding.ulid)}
                                                    className="group rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                                >
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                                                            <TrendingDown className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-widest text-rose-600/70 uppercase">
                                                            Largest Gap
                                                        </span>
                                                    </div>
                                                    <p className="mb-1 truncate text-sm font-bold text-slate-900">
                                                        {collectionInsights.largest_outstanding.name}
                                                    </p>
                                                    <p className="text-2xl font-black text-rose-700">
                                                        {fmtCompact(collectionInsights.largest_outstanding.outstanding)}
                                                    </p>
                                                    <p className="mt-1 text-[10px] font-medium text-rose-600/70">still outstanding</p>
                                                </Link>
                                            ) : (
                                                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-widest text-emerald-600/70 uppercase">
                                                            No Gap
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-emerald-700">No outstanding balances</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Deferred>
                            </motion.div>
                        </div>

                        {/* ══════════════════════════════════════════════════════════════
                    ZONE 4 - MONEY FLOW + TREND CHART
                ══════════════════════════════════════════════════════════════ */}
                        <div className="grid gap-4 lg:grid-cols-3">
                            {/* Money Flow Funnel */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-2xl bg-white p-5 ring-1 ring-slate-100"
                            >
                                <h3 className="mb-4 font-bold text-slate-900">Money Flow</h3>
                                <div className="space-y-2">
                                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                                        <div className="mb-0.5 flex items-center justify-between">
                                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Target Revenue</p>
                                            <Wallet className="h-3.5 w-3.5 text-slate-300" />
                                        </div>
                                        <p className="text-lg font-black text-slate-900">{fmtCompact(expected)}</p>
                                        <p className="text-[10px] text-slate-400">{fmt(expected)}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                                            <ArrowRight className="h-3 w-3 rotate-90 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50 px-4 py-3">
                                        <div className="mb-0.5 flex items-center justify-between">
                                            <p className="text-[10px] font-bold tracking-widest text-emerald-500/70 uppercase">Collected</p>
                                            <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                                        </div>
                                        <p className="text-lg font-black text-emerald-700">{fmtCompact(realised)}</p>
                                        <p className="text-[10px] text-emerald-500/70">{realisedPct}% of target</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                                            <ArrowRight className="h-3 w-3 rotate-90 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-rose-50 px-4 py-3">
                                        <div className="mb-0.5 flex items-center justify-between">
                                            <p className="text-[10px] font-bold tracking-widest text-rose-400/70 uppercase">Outstanding</p>
                                            <Target className="h-3.5 w-3.5 text-rose-300" />
                                        </div>
                                        <p className="text-lg font-black text-rose-700">{fmtCompact(outstanding)}</p>
                                        <p className="text-[10px] text-rose-400/70">{100 - realisedPct}% remaining</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Trend Chart */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 lg:col-span-2"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Revenue Trend</h3>
                                        <p className="text-xs text-slate-400">Expected vs. collected - last 30 days</p>
                                    </div>
                                    <BarChart3 className="h-4 w-4 text-slate-300" />
                                </div>

                                {skipCharts ? (
                                    <OfflineState
                                        className="py-8"
                                        title="Charts unavailable"
                                        message="Revenue charts are skipped on poor or offline connections."
                                    />
                                ) : isAnalyticsLoading ? (
                                    <div className="flex h-[180px] items-end gap-1">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 animate-pulse rounded-t-lg bg-slate-100"
                                                style={{ height: `${30 + Math.random() * 70}%` }}
                                            />
                                        ))}
                                    </div>
                                ) : analyticsData?.trends?.length ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <AreaChart data={analyticsData.trends} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gradExpected" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                                                tickLine={false}
                                                axisLine={false}
                                                interval={4}
                                            />
                                            <YAxis hide />
                                            <RechartsTooltip content={<ChartTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="expected"
                                                stroke="#6366f1"
                                                strokeWidth={1.5}
                                                fill="url(#gradExpected)"
                                                dot={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                fill="url(#gradActual)"
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-[190px] flex-col items-center justify-center text-slate-300">
                                        <BarChart3 className="mb-2 h-8 w-8" />
                                        <p className="text-xs font-medium text-slate-400">No trend data yet</p>
                                    </div>
                                )}

                                <div className="mt-2 flex gap-4 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-indigo-400" /> Expected
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Collected
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* ══════════════════════════════════════════════════════════════
                    ZONE 5+6 - COLLECTIONS LIST + RECENT ACTIVITY
                ══════════════════════════════════════════════════════════════ */}
                        <div className="grid gap-4 lg:grid-cols-3">
                            {/* Zone 5 - Collections List (primary, 2/3) */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 lg:col-span-2"
                            >
                                {/* Toolbar */}
                                <div className="border-b border-slate-50 bg-slate-50/50 p-4 sm:p-5">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900">All Collections</h3>
                                            <p className="text-xs text-slate-400">{collections.total} total</p>
                                        </div>
                                        {hasBanking && (
                                            <Link
                                                href={create.url()}
                                                className="flex items-center gap-1.5 rounded-xl bg-[#0A3D91] px-3 py-2 text-[10px] font-bold text-white transition-all hover:bg-[#0f4fb5] active:scale-95"
                                            >
                                                <PlusIcon className="h-3 w-3" /> New
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        {/* Search */}
                                        <div className="relative flex-1">
                                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Search collections…"
                                                className="w-full rounded-xl bg-white py-2 pr-3 pl-9 text-xs font-medium text-slate-900 ring-1 ring-slate-200 transition-all outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#1F6FDB]/30"
                                            />
                                        </div>
                                        {/* Status filter tabs */}
                                        <div className="no-scrollbar flex overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
                                            {(['', 'active', 'draft', 'archived'] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleStatusChange(s)}
                                                    className={cn(
                                                        'rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-all',
                                                        statusFilter === s
                                                            ? 'bg-slate-900 text-white shadow-sm'
                                                            : 'text-slate-400 hover:text-slate-700',
                                                    )}
                                                >
                                                    {s === '' ? 'All' : s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                {collections.data.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[520px] text-left">
                                            <thead>
                                                <tr className="border-b border-slate-50 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                    <th className="px-5 py-3.5">Collection</th>
                                                    <th className="px-5 py-3.5">Progress</th>
                                                    <th className="px-5 py-3.5 text-right">Amount</th>
                                                    <th className="px-5 py-3.5">Status</th>
                                                    <th className="px-5 py-3.5 text-right">View</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                <AnimatePresence mode="popLayout">
                                                    {collections.data.map((c) => {
                                                        const insight = collectionInsights?.all?.find((i) => i.ulid === c.ulid);
                                                        const rate = insight?.rate ?? 0;
                                                        return (
                                                            <motion.tr
                                                                key={c.ulid}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="group transition-colors hover:bg-slate-50/60"
                                                            >
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div
                                                                            className={cn(
                                                                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                                                                                c.status === 'active'
                                                                                    ? 'bg-blue-50 text-blue-600'
                                                                                    : c.status === 'archived'
                                                                                      ? 'bg-slate-100 text-slate-400'
                                                                                      : 'bg-amber-50 text-amber-600',
                                                                            )}
                                                                        >
                                                                            {c.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                                                                            <p className="text-[10px] text-slate-400">
                                                                                {c.assignments_count} assignments
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    {c.status === 'active' && insight ? (
                                                                        <div>
                                                                            <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                                                                                <span className="text-slate-400">{rate}%</span>
                                                                            </div>
                                                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                                                                <motion.div
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${rate}%` }}
                                                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                                                    className={cn(
                                                                                        'h-full rounded-full',
                                                                                        rate >= 85
                                                                                            ? 'bg-emerald-500'
                                                                                            : rate >= 50
                                                                                              ? 'bg-blue-500'
                                                                                              : rate > 0
                                                                                                ? 'bg-amber-500'
                                                                                                : 'bg-rose-400',
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-300">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className="text-sm font-bold text-slate-900">{fmtCompact(c.amount)}</span>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span
                                                                        className={cn(
                                                                            'inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase',
                                                                            c.status === 'active'
                                                                                ? 'bg-blue-50 text-blue-600'
                                                                                : c.status === 'draft'
                                                                                  ? 'bg-amber-50 text-amber-600'
                                                                                  : 'bg-slate-100 text-slate-400',
                                                                        )}
                                                                    >
                                                                        {c.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {c.status === 'draft' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedCollection(c);
                                                                                    setIsPublishModalOpen(true);
                                                                                }}
                                                                                className="flex h-7 items-center gap-1 rounded-lg bg-[#1F6FDB] px-2.5 text-[9px] font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
                                                                            >
                                                                                <Zap className="h-3 w-3" /> Publish
                                                                            </button>
                                                                        )}
                                                                        <Link
                                                                            href={show.url(c.ulid)}
                                                                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition-all hover:bg-blue-500 hover:text-white"
                                                                        >
                                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                            <Wallet className="h-8 w-8" />
                                        </div>
                                        <p className="font-bold text-slate-900">No collections found</p>
                                        <p className="mt-1 max-w-xs text-sm text-slate-400">
                                            {filters.search || filters.status
                                                ? 'Try adjusting your search or filter.'
                                                : 'Create your first collection to start managing estate dues.'}
                                        </p>
                                        {hasBanking && !filters.search && !filters.status && (
                                            <Link
                                                href={create.url()}
                                                className="mt-6 flex items-center gap-2 rounded-xl bg-[#1F6FDB] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
                                            >
                                                <PlusIcon className="h-4 w-4" /> Create Collection
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {/* Pagination */}
                                {collections.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t border-slate-50 px-5 py-3.5">
                                        <p className="text-xs font-bold text-slate-400">
                                            Page <span className="text-slate-900">{collections.current_page}</span> of{' '}
                                            <span className="text-slate-900">{collections.last_page}</span>
                                        </p>
                                        <div className="flex gap-1">
                                            {collections.links.map((link, i) => (
                                                <Link
                                                    key={i}
                                                    href={link.url || '#'}
                                                    preserveScroll
                                                    preserveState
                                                    className={cn(
                                                        'flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg px-2 text-xs font-bold transition-all',
                                                        link.active
                                                            ? 'bg-slate-900 text-white'
                                                            : link.url
                                                              ? 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                                                              : 'cursor-not-allowed text-slate-300 opacity-40',
                                                    )}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Zone 6 - Recent Activity Feed (sidebar) */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="rounded-2xl bg-white p-5 ring-1 ring-slate-100"
                            >
                                <h3 className="mb-1 font-bold text-slate-900">Recent Payments</h3>
                                <p className="mb-4 text-xs text-slate-400">Latest financial activity</p>

                                <Deferred
                                    data="recentActivity"
                                    fallback={
                                        <div className="space-y-4">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <SkeletonBlock className="h-8 w-8 rounded-full" />
                                                    <div className="flex-1 space-y-1.5">
                                                        <SkeletonBlock className="h-3 w-28" />
                                                        <SkeletonBlock className="h-2.5 w-20" />
                                                    </div>
                                                    <SkeletonBlock className="h-3 w-14" />
                                                </div>
                                            ))}
                                        </div>
                                    }
                                >
                                    {recentActivity && recentActivity.length > 0 ? (
                                        <div className="relative">
                                            <div className="absolute top-0 left-3.5 h-full w-px bg-slate-100" />
                                            <div className="space-y-4">
                                                {recentActivity.map((p, i) => (
                                                    <motion.div
                                                        key={p.id}
                                                        initial={{ opacity: 0, x: -6 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className="relative flex items-start gap-3 pl-8"
                                                    >
                                                        <div className="absolute left-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 ring-4 ring-white">
                                                            {p.user_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-baseline justify-between gap-1">
                                                                <p className="truncate text-xs font-bold text-slate-900">{p.user_name}</p>
                                                                <span className="shrink-0 text-xs font-bold text-emerald-600">
                                                                    {fmtCompact(p.amount)}
                                                                </span>
                                                            </div>
                                                            <p className="truncate text-[10px] text-slate-400">{p.collection_name}</p>
                                                            <p className="text-[10px] text-slate-300">{p.paid_at_human}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                            <Activity className="mb-2 h-8 w-8" />
                                            <p className="text-xs font-medium text-slate-400">No payments recorded yet</p>
                                        </div>
                                    )}
                                </Deferred>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Modals ── */}
            <BankingSetupModal isOpen={isBankingModalOpen} onClose={() => setIsBankingModalOpen(false)} banks={banks} currentSettings={settlement} />

            <ConfirmationModal
                isOpen={isPublishModalOpen}
                onClose={() => {
                    setIsPublishModalOpen(false);
                    setSelectedCollection(null);
                }}
                onConfirm={handlePublish}
                title="Publish Collection"
                message={`Publishing "${selectedCollection?.name}" will notify residents and start collecting payments. This cannot be undone.`}
                confirmLabel="Yes, Publish Now"
                cancelLabel="Cancel"
                type="info"
                isLoading={isPublishing}
            />
        </>
    );
}

CollectionsIndex.layout = (page: any) => <AdminLayout children={page} title="Financial Command Center" />;
