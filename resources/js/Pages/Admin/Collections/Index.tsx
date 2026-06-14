import { PlusIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { clsx, type ClassValue } from 'clsx';
import { motion, animate, useMotionValue, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    Users,
    Calendar,
    ArrowRight,
    AlertTriangle,
    Building2,
    Settings2,
    Send,
    Edit2,
    Search,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Clock,
    Activity,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { twMerge } from 'tailwind-merge';
import { index, create, show, edit, publish } from '@/actions/App/Http/Controllers/Admin/CollectionController';
import { index as analyticsIndex } from '@/actions/App/Http/Controllers/Admin/CollectionAnalyticsController';
import BankingSetupModal from '@/Components/BankingSetupModal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useDebounce } from '@/Hooks/useDebounce';
import AdminLayout from '@/Layouts/AdminLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function AnimatedNumber({ value }: { value: number }) {
    const motionValue = useMotionValue(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1], // ultra premium ease-out curve
            onUpdate: (latest) => {
                if (ref.current) {
                    ref.current.textContent = '₦' + Math.round(latest).toLocaleString();
                }
            },
        });
        return () => controls.stop();
    }, [value, motionValue]);

    return <span ref={ref}>₦0</span>;
}

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type: 'one_time' | 'recurring';
    recurring_interval: string | null;
    status: 'draft' | 'active' | 'archived';
    assignments_count: number;
    targets_count: number;
    applies_to: 'all' | 'target';
    created_at: string;
};

type AnalyticsData = {
    trends: { date: string; expected: number; actual: number }[];
    activity: { id: number; actor: string; action: string; amount: number; timestamp: string }[];
    performance: { id: number; name: string; expected: number; collected: number; progress: number }[];
    distribution: { name: string; value: number }[];
    outstanding: { user_id: number; name: string; property: string; amount: number; days_overdue: number }[];
};

type Props = {
    collections: {
        data: Collection[];
        total: number;
        per_page: number;
        current_page: number;
        links: any[];
    };
    totalResidents: number;
    hasBanking: boolean;
    banks: { name: string; code: string }[];
    settlement: {
        bank_name: string | null;
        bank_code: string | null;
        account_number: string | null;
        account_name: string | null;
    };
    filters: {
        search: string;
        status: string;
    };
    stats: {
        total_expected: number;
        total_realised: number;
        active_collections: number;
        defaulters_count: number;
    };
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CollectionsIndex({ collections, totalResidents, hasBanking, banks, settlement, filters, stats }: Props) {
    const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const debouncedSearch = useDebounce(search, 300);

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
    const [daysFilter, setDaysFilter] = useState(30);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch, status }, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [debouncedSearch, filters.search, status]);

    useEffect(() => {
        setIsAnalyticsLoading(true);
        axios
            .get(analyticsIndex.url(), { params: { days: daysFilter } })
            .then((res) => {
                setAnalyticsData(res.data);
                setIsAnalyticsLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch analytics:', err);
                setIsAnalyticsLoading(false);
            });
    }, [daysFilter]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        router.get(index.url(), { search, status: newStatus }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        setStatus('');
        router.get(index.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const expected = Number(stats.total_expected || 0);
    const realised = Number(stats.total_realised || 0);
    const outstanding = expected - realised;
    const realisedPct = expected > 0 ? Math.round((realised / expected) * 100) : 0;

    const hasActiveFilters = Boolean(search || status);
    const showFilters = collections.total > 1 || hasActiveFilters;
    const showPagination = collections.total > collections.per_page;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
                    <p className="mb-2 text-xs font-bold text-slate-500 uppercase">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 py-1">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name === 'expected' ? 'Expected' : 'Collected'}
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(entry.value)}</span>
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

            {!hasBanking && (
                <div className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
                    <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-amber-900 dark:text-amber-500">Settlement Account Required</h2>
                                <p className="max-w-xl text-sm text-amber-700 dark:text-amber-400/80">
                                    To create collections and receive payments from residents, you must first set up your estate's settlement bank
                                    account.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95"
                        >
                            <Building2 className="h-5 w-5" />
                            Setup Bank Account
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Financial Dashboard</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Overview of estate revenue, outstanding balances, and collection performance.
                    </p>
                </div>

                <div className="flex flex-row items-center gap-3">
                    <button
                        onClick={() => setIsBankingModalOpen(true)}
                        className={cn(
                            'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition-all active:scale-95 sm:text-sm',
                            hasBanking
                                ? 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-slate-800'
                                : 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-700',
                        )}
                    >
                        <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="truncate">{hasBanking ? 'Settlement' : 'Setup Bank'}</span>
                    </button>

                    {hasBanking ? (
                        <Link
                            href={create.url()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F6FDB] px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 sm:text-sm"
                        >
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">New Collection</span>
                        </Link>
                    ) : (
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-200 px-4 py-3.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-300 sm:text-sm dark:bg-slate-800 dark:text-slate-500"
                        >
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">Setup Bank</span>
                        </button>
                    )}
                </div>
            </div>

            {/* SECTION 1 & 2: EXECUTIVE FINANCIAL OVERVIEW & KPIs */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Hero Card */}
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-[#0A0F1C] p-8 text-white shadow-2xl ring-1 ring-white/10 lg:col-span-2">
                    <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-[80px] transition-colors duration-700 group-hover:bg-indigo-400/30" />
                    <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-[80px] transition-colors duration-700 group-hover:bg-emerald-400/20" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Wallet className="h-5 w-5" />
                                <span className="text-[11px] font-black tracking-widest uppercase">Total Expected Revenue</span>
                            </div>
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black tracking-wider text-emerald-400 uppercase backdrop-blur-md">
                                {realisedPct}% Collection Rate
                            </span>
                        </div>

                        <div className="mt-4">
                            <h2 className="text-5xl font-black tracking-tight lg:text-6xl">
                                <AnimatedNumber value={expected} />
                            </h2>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-8">
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/50 ring-1 ring-white/10 backdrop-blur-sm ring-inset">
                                <motion.div
                                    className="relative h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${realisedPct}%` }}
                                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className="absolute inset-0 animate-pulse bg-white/20" />
                                </motion.div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Total Collected</span>
                                </div>
                                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                                    <AnimatedNumber value={realised} />
                                </p>
                            </div>
                            <div className="border-l border-white/10 pl-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Outstanding Balance</span>
                                </div>
                                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                                    <AnimatedNumber value={outstanding} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="flex flex-col gap-6">
                    <div className="flex-1 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md dark:bg-slate-900 dark:ring-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <Activity className="h-6 w-6" />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Live
                            </span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Active Collections</p>
                            <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{stats.active_collections}</h3>
                        </div>
                    </div>

                    <div className="flex-1 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md dark:bg-slate-900 dark:ring-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Overdue</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Defaulters</p>
                            <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{stats.defaulters_count}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* ANALYTICS SECTIONS */}
            {isAnalyticsLoading ? (
                <div className="mb-12 flex h-64 items-center justify-center rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <p className="text-sm font-semibold text-slate-500">Loading financial data...</p>
                    </div>
                </div>
            ) : analyticsData ? (
                <>
                    {/* SECTION 3 & 5: REVENUE TRENDS AND DISTRIBUTION */}
                    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Revenue Trends */}
                        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2 dark:bg-slate-900 dark:ring-white/10">
                            <div className="mb-6 flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Revenue Performance</h3>
                                    <p className="text-sm font-medium text-slate-500">Expected vs Actual collections over time.</p>
                                </div>
                                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                                    {[7, 30, 90].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setDaysFilter(days)}
                                            className={cn(
                                                'rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
                                                daysFilter === days
                                                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                                            )}
                                        >
                                            {days}D
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analyticsData.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                                            tickFormatter={(val) => `₦${val / 1000}k`}
                                        />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="expected"
                                            stroke="#818cf8"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorExpected)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="actual"
                                            stroke="#34d399"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorActual)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Distribution */}
                        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
                            <div className="mb-2 px-2">
                                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Revenue Distribution</h3>
                                <p className="text-sm font-medium text-slate-500">Total collected by category.</p>
                            </div>
                            <div className="flex h-[240px] items-center justify-center">
                                {analyticsData.distribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {analyticsData.distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <PieChart className="mb-2 h-8 w-8" />
                                        <p className="text-sm">No revenue data</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex flex-col gap-2 px-2">
                                {analyticsData.distribution.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                            />
                                            <span className="max-w-[120px] truncate text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4, 6 & 7: PERFORMANCE, ACTIVITY, OUTSTANDING */}
                    <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Collection Performance */}
                        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2 dark:bg-slate-900 dark:ring-white/10">
                            <div className="mb-6 px-2">
                                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Active Collection Performance</h3>
                                <p className="text-sm font-medium text-slate-500">Track progress of ongoing collections.</p>
                            </div>
                            <div className="flex flex-col gap-6 px-2">
                                {analyticsData.performance.length > 0 ? (
                                    analyticsData.performance.map((collection) => (
                                        <div key={collection.id}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{collection.name}</span>
                                                <span className="text-xs font-black text-slate-500">
                                                    {formatCurrency(collection.collected)} / {formatCurrency(collection.expected)}
                                                </span>
                                            </div>
                                            <div className="relative flex items-center gap-4">
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <motion.div
                                                        className="h-full rounded-full bg-indigo-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${collection.progress}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                    />
                                                </div>
                                                <span className="w-12 text-right text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                    {collection.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-sm text-slate-500">No active collections found.</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
                            <div className="mb-6 px-2">
                                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Recent Activity</h3>
                                <p className="text-sm font-medium text-slate-500">Latest financial events.</p>
                            </div>
                            <div className="flex flex-col gap-5 px-2">
                                {analyticsData.activity.length > 0 ? (
                                    analyticsData.activity.map((act, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="relative flex flex-col items-center">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                {i !== analyticsData.activity.length - 1 && (
                                                    <div className="absolute top-8 bottom-[-20px] w-px bg-slate-100 dark:bg-slate-800" />
                                                )}
                                            </div>
                                            <div className="pb-2">
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="font-bold text-slate-900 dark:text-white">{act.actor}</span> {act.action}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(act.amount)}
                                                    </span>
                                                    <span className="text-xs text-slate-400">• {act.timestamp}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-sm text-slate-500">No recent activity.</div>
                                )}
                            </div>
                        </div>

                        {/* Outstanding Balances */}
                        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-3 dark:bg-slate-900 dark:ring-white/10">
                            <div className="mb-6 flex items-center justify-between px-2">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Top Outstanding Balances</h3>
                                    <p className="text-sm font-medium text-slate-500">Accounts requiring immediate attention.</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="pb-3 pl-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">Resident</th>
                                            <th className="pb-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">Property</th>
                                            <th className="pb-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">Days Overdue</th>
                                            <th className="pb-3 text-right text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                                Amount Owed
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {analyticsData.outstanding.length > 0 ? (
                                            analyticsData.outstanding.map((out, i) => (
                                                <tr key={i} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">{out.name}</td>
                                                    <td className="py-4 font-semibold text-slate-500">{out.property}</td>
                                                    <td className="py-4">
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                                            <Clock className="h-3 w-3" />
                                                            {out.days_overdue} Days
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right font-black text-rose-600 dark:text-rose-400">
                                                        {formatCurrency(out.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                                                    No outstanding balances. Great job!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}

            {/* Filter controls for the table below */}
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">All Collections</h3>
            </div>

            {showFilters && (
                <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Search className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm font-semibold text-slate-900 shadow-xs placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
                            placeholder="Search collections by name..."
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Filter className="h-4.5 w-4.5 text-slate-400" />
                            </div>
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-8 pl-10 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-xs transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </button>
                    )}
                </div>
            )}

            <BankingSetupModal isOpen={isBankingModalOpen} onClose={() => setIsBankingModalOpen(false)} banks={banks} currentSettings={settlement} />

            <ConfirmationModal
                isOpen={isPublishModalOpen}
                onClose={() => {
                    setIsPublishModalOpen(false);
                    setSelectedCollection(null);
                }}
                onConfirm={handlePublish}
                title="Publish Collection"
                message={`Are you sure you want to publish "${selectedCollection?.name}"? This will generate assignments for residents.`}
                confirmLabel="Yes, Publish Now"
                cancelLabel="Cancel"
                type="info"
                isLoading={isPublishing}
            />

            {/* List View */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xs dark:border-white/10 dark:bg-slate-900">
                {collections.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th className="p-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Collection Details</th>
                                    <th className="p-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Amount per target</th>
                                    <th className="p-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Interval</th>
                                    <th className="p-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Audience</th>
                                    <th className="p-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Status</th>
                                    <th className="p-5 text-right text-[10px] font-black tracking-wider text-slate-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {collections.data.map((collection) => (
                                    <tr
                                        key={collection.ulid}
                                        onClick={() => router.visit(show.url(collection.ulid))}
                                        className="group cursor-pointer transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="max-w-md p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500 dark:bg-slate-800 dark:group-hover:bg-blue-500/10">
                                                    <Wallet className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                                        {collection.name}
                                                    </div>
                                                    {collection.description && (
                                                        <div className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-400">
                                                            {collection.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 font-black text-slate-900 dark:text-white">{formatCurrency(collection.amount)}</td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="capitalize">{collection.recurring_interval || 'Once'}</span>
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                <Users className="text-slate-450 h-4 w-4" />
                                                <span>
                                                    {collection.status === 'active'
                                                        ? collection.assignments_count
                                                        : collection.applies_to === 'all'
                                                          ? totalResidents
                                                          : collection.targets_count}{' '}
                                                    Targets
                                                </span>
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                                                    collection.status === 'active'
                                                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : collection.status === 'draft'
                                                          ? 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                                                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                {collection.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {collection.status === 'draft' && hasBanking && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCollection(collection);
                                                                setIsPublishModalOpen(true);
                                                            }}
                                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-emerald-500 shadow-xs ring-1 ring-slate-200 transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-100 dark:bg-slate-800 dark:ring-white/10 dark:hover:bg-emerald-500/10"
                                                            title="Publish Collection"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </button>
                                                        <Link
                                                            href={edit.url(collection.ulid)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200 transition-all hover:bg-blue-50 hover:text-blue-500 hover:ring-blue-100 dark:bg-slate-800 dark:ring-white/10 dark:hover:bg-blue-500/10"
                                                            title="Edit Collection"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Link>
                                                    </>
                                                )}
                                                <Link
                                                    href={show.url(collection.ulid)}
                                                    className="text-slate-650 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 transition-all hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600"
                                                >
                                                    <ArrowRight className="h-4.5 w-4.5" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300 dark:bg-slate-800">
                            <Wallet className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">No collections found</h3>
                        <p className="mt-2 max-w-sm text-slate-500">Create your first collection to start managing estate dues and levies.</p>
                        {hasBanking ? (
                            <Link
                                href={create.url()}
                                className="mt-8 flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-white/10 dark:hover:bg-slate-700"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create Collection
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsBankingModalOpen(true)}
                                className="mt-8 flex cursor-pointer items-center gap-2 rounded-2xl bg-amber-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95"
                            >
                                <Building2 className="h-5 w-5" />
                                Setup Bank Account First
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {showPagination && (
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-slate-900">
                    <p className="text-xs font-semibold text-slate-500">
                        Showing page <span className="font-bold text-slate-900 dark:text-white">{collections.current_page}</span> of total{' '}
                        <span className="font-bold text-slate-900 dark:text-white">{collections.total}</span> items.
                    </p>
                    <div className="flex items-center gap-1.5">
                        {collections.links.map((link, idx) => {
                            if (link.label.includes('Previous')) {
                                return link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className="text-slate-650 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    >
                                        <ChevronLeft className="h-4.5 w-4.5" />
                                    </Link>
                                ) : (
                                    <span
                                        key={idx}
                                        className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl bg-slate-50/50 text-slate-300 dark:bg-slate-800/50"
                                    >
                                        <ChevronLeft className="h-4.5 w-4.5" />
                                    </span>
                                );
                            }
                            if (link.label.includes('Next')) {
                                return link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className="text-slate-650 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    >
                                        <ChevronRight className="h-4.5 w-4.5" />
                                    </Link>
                                ) : (
                                    <span
                                        key={idx}
                                        className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl bg-slate-50/50 text-slate-300 dark:bg-slate-800/50"
                                    >
                                        <ChevronRight className="h-4.5 w-4.5" />
                                    </span>
                                );
                            }

                            // Number links
                            return link.active ? (
                                <span
                                    key={idx}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white"
                                >
                                    {link.label}
                                </span>
                            ) : link.url ? (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    {link.label}
                                </Link>
                            ) : (
                                <span key={idx} className="px-2 text-xs text-slate-400">
                                    ...
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

CollectionsIndex.layout = (page: any) => <AdminLayout children={page} />;
