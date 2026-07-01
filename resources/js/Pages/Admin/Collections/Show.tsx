import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    AlertCircle,
    Search,
    Bell,
    ChevronRight,
    Download,
    Info,
    User,
    CreditCard,
    ShieldCheck,
    Trash2,
    TrendingUp,
    Zap,
    ArrowRight,
    BarChart3,
    Edit2,
    X,
} from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import {
    index,
    publish,
    edit,
    remind,
    exportMethod,
    recordPayment,
    destroy,
} from '@/actions/App/Http/Controllers/Admin/CollectionController';
import ProfileController from '@/actions/App/Http/Controllers/Admin/ProfileController';
import ConfirmationModal from '@/Components/ConfirmationModal';
import SearchInput from '@/Components/SearchInput';
import AdminLayout from '@/Layouts/AdminLayout';

// ─── Types ──────────────────────────────────────────────────────────────────

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type: 'one_time' | 'recurring';
    recurring_interval: string | null;
    status: 'draft' | 'active' | 'archived';
    start_date: string;
    due_at: string | null;
    due_day: number;
    grace_days: number;
    applies_to: 'all' | 'target';
    targets_count?: number;
    created_at: string;
};

type Stats = {
    total_assignments: number;
    paid_count: number;
    pending_count: number;
    overdue_count: number;
    total_expected: number;
    total_collected: number;
};

type Assignment = {
    ulid: string;
    id: number;
    user: { id: number; name: string; email: string };
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'paid' | 'overdue' | 'partial' | 'grace';
    due_date: string;
    paid_at: string | null;
    created_at: string;
};

type PaginatedAssignments = {
    data: Assignment[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
};

type RecentPayment = {
    id: number;
    user_name: string;
    amount: number;
    provider: string;
    paid_at: string | null;
    paid_at_human: string | null;
};

type TrendPoint = { date: string; total: number };

type Props = {
    collection: Collection;
    stats: Stats;
    assignments: PaginatedAssignments;
    totalResidents: number;
    filters: { search?: string; status?: string };
    settlement: { bank_name: string | null; paystack_subaccount_code: string | null };
    hasBanking: boolean;
    canDelete: boolean;
    recentPayments?: RecentPayment[];
    dailyTrend?: TrendPoint[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
    }).format(n || 0);

const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
    return `₦${n}`;
};

function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const duration = 900;
        const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(ease * value));
            if (progress < 1) requestAnimationFrame(step);
            else setDisplay(value);
        };
        requestAnimationFrame(step);
    }, [value]);
    return <>{`${prefix}${display.toLocaleString()}${suffix}`}</>;
}

// ─── Radial Progress Ring ────────────────────────────────────────────────────

function ProgressRing({ pct, size = 140 }: { pct: number; size?: number }) {
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={10} />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - dash }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
            />
            <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// ─── Sparkline Chart ──────────────────────────────────────────────────────────

function SparklineChart({ data }: { data: TrendPoint[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-slate-300">
                <BarChart3 className="h-8 w-8" />
            </div>
        );
    }

    const max = Math.max(...data.map((d) => d.total), 1);
    const width = 280;
    const height = 80;
    const barW = Math.max(2, Math.floor((width - data.length * 2) / data.length));
    const gap = Math.floor((width - data.length * barW) / (data.length + 1));

    return (
        <div className="mt-3">
            <svg width="100%" viewBox={`0 0 ${width} ${height + 24}`} className="overflow-visible">
                {data.map((d, i) => {
                    const barH = Math.max(4, (d.total / max) * height);
                    const x = gap + i * (barW + gap);
                    const y = height - barH;
                    const isToday = i === data.length - 1;
                    return (
                        <g key={d.date}>
                            <motion.rect
                                x={x}
                                y={y}
                                width={barW}
                                height={barH}
                                rx={2}
                                fill={isToday ? '#10b981' : '#e2e8f0'}
                                initial={{ scaleY: 0, originY: 1 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: i * 0.04, duration: 0.4 }}
                                style={{ transformOrigin: `${x}px ${height}px` }}
                            />
                        </g>
                    );
                })}
            </svg>
            <div className="mt-1 flex justify-between text-[9px] font-medium text-slate-400">
                <span>{data[0]?.date ? new Date(data[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
                <span>Today</span>
            </div>
        </div>
    );
}

// ─── Config Drawer ────────────────────────────────────────────────────────────

function ConfigDrawer({ collection, open, onClose }: { collection: Collection; open: boolean; onClose: () => void }) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                        className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <h3 className="font-bold text-slate-900">Collection Details</h3>
                            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-5 overflow-y-auto p-6">
                            {[
                                { label: 'Amount per Resident', value: fmt(collection.amount) },
                                { label: 'Schedule', value: collection.billing_type.replace('_', ' ') },
                                ...(collection.billing_type === 'recurring'
                                    ? [{ label: 'Interval', value: collection.recurring_interval || 'N/A' }]
                                    : []),
                                {
                                    label: collection.billing_type === 'recurring' ? 'Due Day' : 'Due Date',
                                    value:
                                        collection.billing_type === 'recurring'
                                            ? `Day ${collection.due_day} of each month`
                                            : collection.due_at
                                              ? new Date(collection.due_at).toLocaleDateString('en-NG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })
                                              : 'N/A',
                                },
                                { label: 'Grace Period', value: `${collection.grace_days} days after due date` },
                                {
                                    label: 'Applies To',
                                    value: collection.applies_to === 'all' ? 'All residents' : `${collection.targets_count} specific residents`,
                                },
                                {
                                    label: 'Created',
                                    value: new Date(collection.created_at).toLocaleDateString('en-NG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    }),
                                },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">{item.label}</p>
                                    <p className="text-sm font-semibold text-slate-900 capitalize">{item.value}</p>
                                </div>
                            ))}
                        </div>
                        {collection.status === 'draft' && (
                            <div className="border-t border-slate-100 p-4">
                                <Link
                                    href={edit.url(collection.ulid)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800"
                                >
                                    <Edit2 className="h-4 w-4" /> Edit Collection
                                </Link>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShowCollection({
    collection,
    stats,
    assignments,
    totalResidents,
    filters,
    settlement,
    hasBanking,
    canDelete,
    recentPayments,
    dailyTrend,
}: Props) {
    const { post, processing } = useForm();
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);
    const [isReminding, setIsReminding] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [recordData, setRecordData] = useState({ amount: '', method: 'bank_transfer' });
    const [isRecording, setIsRecording] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);

    const collectionRate = useMemo(() => {
        if (stats.total_expected === 0) return 0;
        return Math.round((stats.total_collected / stats.total_expected) * 100);
    }, [stats.total_collected, stats.total_expected]);

    const daysLeft = daysUntil(collection.due_at);
    const outstanding = stats.total_expected - stats.total_collected;

    // ── Intelligence Banner logic
    const banner = useMemo(() => {
        if (collection.status === 'draft') {
            return { icon: '📋', text: 'This collection is in draft mode. Publish to start collecting payments.', color: 'indigo' };
        }
        if (collection.status === 'archived') {
            return { icon: '📦', text: 'This collection is archived.', color: 'slate' };
        }
        if (stats.total_assignments === 0) {
            return { icon: '⏳', text: 'Waiting for assignments to be generated…', color: 'amber' };
        }
        if (collectionRate === 100) {
            return { icon: '🎉', text: 'Outstanding — all residents have paid. Collection is complete!', color: 'emerald' };
        }
        if (stats.overdue_count > 0 && collectionRate < 50) {
            return {
                icon: '⚠️',
                text: `Collections are behind target — ${collectionRate}% collected with ${stats.overdue_count} overdue ${stats.overdue_count === 1 ? 'resident' : 'residents'}.`,
                color: 'rose',
            };
        }
        if (daysLeft !== null && daysLeft <= 3 && collectionRate < 80) {
            return {
                icon: '⏰',
                text: `Closing soon — only ${collectionRate}% collected with ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining. Consider sending reminders.`,
                color: 'amber',
            };
        }
        return {
            icon: '✅',
            text: `Collections are on track — ${collectionRate}% collected${daysLeft !== null ? ` with ${daysLeft} days remaining` : ''}.`,
            color: 'emerald',
        };
    }, [collection.status, stats, collectionRate, daysLeft]);

    const handleRemind = () => {
        setIsReminding(true);
        router.post(remind.url(collection.ulid), {}, {
            preserveScroll: true,
            onFinish: () => { setIsReminding(false); setIsRemindModalOpen(false); },
        });
    };

    const handleExport = () => { window.location.href = exportMethod.url(collection.ulid); };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(destroy.url(collection.ulid), {
            onFinish: () => { setIsDeleting(false); setIsDeleteModalOpen(false); },
        });
    };

    const handleRecordPayment = () => {
        if (!selectedAssignment || !recordData.amount) return;
        setIsRecording(true);
        router.post(recordPayment.url(selectedAssignment.ulid), { amount: recordData.amount, method: recordData.method }, {
            preserveScroll: true,
            onFinish: () => {
                setIsRecording(false);
                setIsRecordModalOpen(false);
                setSelectedAssignment(null);
                setRecordData({ amount: '', method: 'bank_transfer' });
            },
        });
    };

    const handleFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        router.get(window.location.pathname, { search: searchQuery, status: newStatus }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleSearchChange = (newSearch: string) => {
        setSearchQuery(newSearch);
        router.get(window.location.pathname, { search: newSearch, status: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handlePublish = () => {
        if (confirm('Publish this collection? This will notify residents and generate payment assignments.')) {
            post(publish.url(collection.ulid));
        }
    };

    const paidPct = stats.total_assignments > 0 ? (stats.paid_count / stats.total_assignments) * 100 : 0;
    const pendingPct = stats.total_assignments > 0 ? (stats.pending_count / stats.total_assignments) * 100 : 0;
    const overduePct = stats.total_assignments > 0 ? (stats.overdue_count / stats.total_assignments) * 100 : 0;

    const bannerColors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-800 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
        amber: 'bg-amber-50 text-amber-800 border-amber-100',
        rose: 'bg-rose-50 text-rose-800 border-rose-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return (
        <>
            <Head title={`${collection.name} — Collection`} />
            <ConfigDrawer collection={collection} open={configOpen} onClose={() => setConfigOpen(false)} />

            <div className="space-y-6">
                {/* ── Banking Alert ── */}
                {!settlement.paystack_subaccount_code && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden">
                        <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-100">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Settlement account not configured</p>
                                    <p className="text-xs text-slate-500">Set up a bank account to receive payments.</p>
                                </div>
                            </div>
                            <Link
                                href={ProfileController.edit.url()}
                                className="shrink-0 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                            >
                                Configure
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    ZONE 1 — CINEMATIC HERO
                ══════════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A3D91] via-[#0f4fb5] to-[#041E4A] p-8 shadow-2xl shadow-[#0A3D91]/20 lg:p-10"
                >
                    {/* Background decoration */}
                    <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/3" />

                    {/* Breadcrumb */}
                    <nav className="relative mb-8 flex items-center gap-2">
                        <Link href={index.url()} className="text-xs font-bold tracking-widest text-white/50 uppercase transition-colors hover:text-white">
                            Collections
                        </Link>
                        <ChevronRight className="h-3 w-3 text-white/30" />
                        <span className="text-xs font-bold tracking-widest text-white/80 uppercase">Details</span>
                    </nav>

                    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left — Title + Revenue */}
                        <div className="flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-3">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${
                                        collection.status === 'active'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : collection.status === 'draft'
                                              ? 'bg-amber-500/20 text-amber-300'
                                              : 'bg-white/10 text-white/50'
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            collection.status === 'active'
                                                ? 'animate-pulse bg-emerald-400'
                                                : collection.status === 'draft'
                                                  ? 'bg-amber-400'
                                                  : 'bg-white/30'
                                        }`}
                                    />
                                    {collection.status}
                                </span>
                                {collection.billing_type === 'recurring' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white/60 uppercase">
                                        <TrendingUp className="h-3 w-3" /> Recurring
                                    </span>
                                )}
                            </div>

                            <h1 className="mb-2 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{collection.name}</h1>

                            {daysLeft !== null && collection.status === 'active' && (
                                <p className="mb-6 text-sm font-medium text-white/60">
                                    {daysLeft > 0 ? `Collection closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : `Collection closed ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago`}
                                </p>
                            )}

                            {/* Revenue pillars */}
                            <div className="grid grid-cols-3 gap-4 sm:gap-6">
                                <div>
                                    <p className="mb-0.5 text-[10px] font-bold tracking-widest text-emerald-300/60 uppercase">Collected</p>
                                    <p className="text-xl font-black tracking-tight text-white sm:text-2xl">{fmtCompact(stats.total_collected)}</p>
                                </div>
                                <div>
                                    <p className="mb-0.5 text-[10px] font-bold tracking-widest text-white/40 uppercase">Target</p>
                                    <p className="text-xl font-black tracking-tight text-white/70 sm:text-2xl">{fmtCompact(stats.total_expected)}</p>
                                </div>
                                <div>
                                    <p className="mb-0.5 text-[10px] font-bold tracking-widest text-rose-400/60 uppercase">Outstanding</p>
                                    <p className="text-xl font-black tracking-tight text-rose-300 sm:text-2xl">{fmtCompact(outstanding)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right — Progress ring + actions */}
                        <div className="flex flex-row items-center gap-6 lg:flex-col lg:items-end">
                            {/* Radial progress */}
                            <div className="relative flex-shrink-0">
                                <ProgressRing pct={collectionRate} size={130} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-white">{collectionRate}%</span>
                                    <span className="text-[9px] font-bold tracking-widest text-white/50 uppercase">Collected</span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setConfigOpen(true)}
                                    className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/20"
                                >
                                    <Info className="h-3.5 w-3.5" /> Details
                                </button>
                                {collection.status === 'active' && (
                                    <button
                                        onClick={() => setIsRemindModalOpen(true)}
                                        className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/20"
                                    >
                                        <Bell className="h-3.5 w-3.5" /> Remind
                                    </button>
                                )}
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/20"
                                >
                                    <Download className="h-3.5 w-3.5" /> Export
                                </button>
                                {canDelete && (
                                    <button
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/30"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Draft publish CTA */}
                    {collection.status === 'draft' && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur-sm sm:flex-row sm:items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">Ready to launch?</p>
                                    <p className="text-sm text-white/60">Publishing will notify residents and start collections.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePublish}
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0A3D91] transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-50"
                                >
                                    Publish Now <ArrowRight className="h-4 w-4" />
                                </button>
                                <Link
                                    href={edit.url(collection.ulid)}
                                    className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/20"
                                >
                                    Edit
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* ══════════════════════════════════════════════════════════
                    ZONE 2 — INTELLIGENCE BANNER
                ══════════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium ${bannerColors[banner.color]}`}
                >
                    <span className="text-lg">{banner.icon}</span>
                    <span>{banner.text}</span>
                </motion.div>

                {/* ══════════════════════════════════════════════════════════
                    ZONE 3 — KPI CARDS
                ══════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {/* Paid */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-50 hover:-translate-y-0.5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Residents Paid</p>
                            <p className="text-3xl font-black tracking-tight text-slate-900">
                                <AnimatedNumber value={stats.paid_count} />
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                    {stats.total_assignments > 0 ? Math.round(paidPct) : 0}%
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">of total</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Awaiting */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-amber-50 hover:-translate-y-0.5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Awaiting Payment</p>
                            <p className="text-3xl font-black tracking-tight text-slate-900">
                                <AnimatedNumber value={stats.pending_count} />
                            </p>
                            <div className="mt-2">
                                <span className="text-[10px] font-medium text-slate-400">
                                    {daysLeft !== null && daysLeft > 0 ? `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'Payment due'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Overdue */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-rose-50 hover:-translate-y-0.5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                <AlertCircle className={`h-5 w-5 ${stats.overdue_count > 0 ? 'animate-pulse' : ''}`} />
                            </div>
                            <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Overdue</p>
                            <p className={`text-3xl font-black tracking-tight ${stats.overdue_count > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                <AnimatedNumber value={stats.overdue_count} />
                            </p>
                            <div className="mt-2">
                                <span className={`text-[10px] font-medium ${stats.overdue_count > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {stats.overdue_count > 0 ? 'Needs attention' : 'None overdue'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Revenue */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-blue-50 hover:-translate-y-0.5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Revenue</p>
                            <p className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                {fmtCompact(stats.total_collected)}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{collectionRate}%</span>
                                <span className="text-[10px] font-medium text-slate-400">of target</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    ZONE 4 — PROGRESS PANEL + TREND CHART
                ══════════════════════════════════════════════════════════ */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Progress Panel (2/3) */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 sm:p-8 lg:col-span-2"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900">Revenue Performance</h3>
                                <p className="text-xs text-slate-400">Total volume and collection health</p>
                            </div>
                        </div>

                        {/* Three revenue pillars */}
                        <div className="mb-8 grid grid-cols-3 gap-4">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Target</p>
                                <p className="text-lg font-black text-slate-900">{fmtCompact(stats.total_expected)}</p>
                                <p className="text-[10px] text-slate-400">{fmt(stats.total_expected)}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 px-4 py-3">
                                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-emerald-500/70 uppercase">Collected</p>
                                <p className="text-lg font-black text-emerald-700">{fmtCompact(stats.total_collected)}</p>
                                <p className="text-[10px] text-emerald-500/70">{fmt(stats.total_collected)}</p>
                            </div>
                            <div className="rounded-xl bg-rose-50 px-4 py-3">
                                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-rose-400/70 uppercase">Outstanding</p>
                                <p className="text-lg font-black text-rose-700">{fmtCompact(outstanding)}</p>
                                <p className="text-[10px] text-rose-400/70">{fmt(outstanding)}</p>
                            </div>
                        </div>

                        {/* Animated progress bar */}
                        <div className="mb-3 flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700">Overall Progress</span>
                            <span className="text-emerald-600">
                                {stats.paid_count} of {stats.total_assignments} paid ({collectionRate}%)
                            </span>
                        </div>
                        <div className="relative h-5 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-50">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${collectionRate}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                        </div>

                        {/* Segmented distribution bar */}
                        {stats.total_assignments > 0 && (
                            <div className="mt-6">
                                <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Resident Distribution</p>
                                <div className="flex h-2.5 overflow-hidden rounded-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${paidPct}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="bg-emerald-500"
                                    />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pendingPct}%` }}
                                        transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
                                        className="bg-amber-400"
                                    />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${overduePct}%` }}
                                        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                                        className="bg-rose-500"
                                    />
                                </div>
                                <div className="mt-2 flex gap-4 text-[10px] font-bold tracking-widest uppercase">
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid ({stats.paid_count})
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <span className="h-2 w-2 rounded-full bg-amber-400" /> Pending ({stats.pending_count})
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <span className="h-2 w-2 rounded-full bg-rose-500" /> Overdue ({stats.overdue_count})
                                    </span>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Trend Chart (1/3) */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 sm:p-8"
                    >
                        <div className="mb-1 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-slate-400" />
                            <h3 className="font-bold text-slate-900">Payment Activity</h3>
                        </div>
                        <p className="mb-4 text-xs text-slate-400">Last 14 days</p>
                        {dailyTrend === undefined ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${60 + i * 8}%` }} />
                                ))}
                            </div>
                        ) : (
                            <SparklineChart data={dailyTrend} />
                        )}
                    </motion.div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    ZONE 5 — RECENT PAYMENTS TIMELINE
                ══════════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 sm:p-8"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900">Recent Payments</h3>
                            <p className="text-xs text-slate-400">Live payment activity</p>
                        </div>
                    </div>

                    {recentPayments === undefined ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                                        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
                                    </div>
                                    <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    ) : recentPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <TrendingUp className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-sm font-medium">No payments recorded yet</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute top-0 left-4 h-full w-px bg-slate-100" />
                            <div className="space-y-5">
                                {recentPayments.map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="relative flex items-start gap-4 pl-10"
                                    >
                                        <div className="absolute left-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 ring-4 ring-white">
                                            {p.user_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-bold text-slate-900">{p.user_name}</p>
                                                <span className="shrink-0 text-sm font-bold text-emerald-600">{fmt(p.amount)}</span>
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <span className="text-[10px] font-medium text-slate-400">{p.paid_at_human || '—'}</span>
                                                <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                    {p.provider === 'manual' ? 'manual' : p.provider}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ══════════════════════════════════════════════════════════
                    ZONE 6 — RESIDENT WORK AREA
                ══════════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100"
                >
                    {/* Table toolbar */}
                    <div className="border-b border-slate-50 bg-slate-50/50 p-5 sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-slate-900">Resident Status</h3>
                                <p className="text-xs text-slate-400">{assignments.total} total assignments</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsRemindModalOpen(true)}
                                    className="flex items-center gap-2 rounded-xl bg-[#0A3D91] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0f4fb5] active:scale-95"
                                >
                                    <Bell className="h-3.5 w-3.5" /> Send Reminders
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                                >
                                    <Download className="h-3.5 w-3.5" /> Export
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex-1">
                                <SearchInput value={searchQuery} onChange={handleSearchChange} placeholder="Search residents by name or email…" />
                            </div>
                            <div className="no-scrollbar flex overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
                                {(['all', 'paid', 'pending', 'overdue'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => handleFilterChange(f)}
                                        className={`rounded-lg px-4 py-1.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-all ${
                                            statusFilter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left">
                            <thead>
                                <tr className="border-b border-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                    <th className="px-6 py-4">Resident</th>
                                    <th className="px-6 py-4 text-right">Amount Due</th>
                                    <th className="px-6 py-4 text-right">Paid</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="hidden px-6 py-4 sm:table-cell">Due Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {assignments.data.map((a) => (
                                        <motion.tr
                                            key={a.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className={`group transition-colors hover:bg-slate-50/60 ${
                                                a.status === 'paid'
                                                    ? 'border-l-2 border-l-emerald-300/50'
                                                    : a.status === 'overdue'
                                                      ? 'border-l-2 border-l-rose-300/50'
                                                      : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                            a.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : a.status === 'overdue'
                                                                  ? 'bg-rose-50 text-rose-600'
                                                                  : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        {a.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-900">{a.user.name}</p>
                                                        <p className="truncate text-xs text-slate-400">{a.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-900">{fmt(a.amount_due)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {a.amount_paid > 0 ? (
                                                    <span className="text-sm font-bold text-emerald-600">{fmt(a.amount_paid)}</span>
                                                ) : (
                                                    <span className="text-sm text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${
                                                        a.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : a.status === 'overdue'
                                                              ? 'bg-rose-50 text-rose-600'
                                                              : a.status === 'partial'
                                                                ? 'bg-blue-50 text-blue-600'
                                                                : 'bg-amber-50 text-amber-600'
                                                    }`}
                                                >
                                                    {a.status === 'paid' && <CheckCircle className="h-2.5 w-2.5" />}
                                                    {a.status === 'overdue' && <AlertCircle className="h-2.5 w-2.5" />}
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="hidden px-6 py-4 sm:table-cell">
                                                <p className="text-sm text-slate-600">
                                                    {new Date(a.due_date).toLocaleDateString('en-NG', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                {a.paid_at && (
                                                    <p className="text-[10px] font-medium text-emerald-500">
                                                        Paid {new Date(a.paid_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {a.status !== 'paid' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAssignment(a);
                                                            setRecordData({ ...recordData, amount: (a.amount_due - a.amount_paid).toString() });
                                                            setIsRecordModalOpen(true);
                                                        }}
                                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-emerald-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-emerald-50 hover:ring-emerald-200 active:scale-95"
                                                        title="Record Payment"
                                                    >
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Record</span>
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>

                                {assignments.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-16 text-center">
                                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                                <Search className="h-7 w-7" />
                                            </div>
                                            <p className="font-bold text-slate-900">No results found</p>
                                            <p className="text-sm text-slate-400">Try adjusting your search or filter.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {assignments.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-50 px-6 py-4">
                            <p className="text-xs font-bold text-slate-400">
                                Page <span className="text-slate-900">{assignments.current_page}</span> of{' '}
                                <span className="text-slate-900">{assignments.last_page}</span>
                            </p>
                            <div className="flex gap-1.5">
                                {assignments.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        preserveState
                                        className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2.5 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-slate-900 text-white'
                                                : link.url
                                                  ? 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                                                  : 'cursor-not-allowed text-slate-300 opacity-40'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Modals ── */}
            <ConfirmationModal
                isOpen={isRemindModalOpen}
                onClose={() => setIsRemindModalOpen(false)}
                onConfirm={handleRemind}
                title="Send Payment Reminders"
                message={`You are about to send reminders to ${Number(stats.pending_count) + Number(stats.overdue_count)} residents with outstanding payments.`}
                confirmLabel="Yes, Send Reminders"
                cancelLabel="Cancel"
                type="info"
                isLoading={isReminding}
            />

            <ConfirmationModal
                isOpen={isRecordModalOpen}
                onClose={() => { setIsRecordModalOpen(false); setSelectedAssignment(null); }}
                onConfirm={handleRecordPayment}
                title="Record Manual Payment"
                message={`Record a manual payment for ${selectedAssignment?.user.name}.`}
                confirmLabel="Record Payment"
                cancelLabel="Cancel"
                type="info"
                isLoading={isRecording}
            >
                <div className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-[10px] font-black tracking-widest text-slate-400 uppercase">Amount (NGN)</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={recordData.amount}
                            onChange={(e) => setRecordData({ ...recordData, amount: e.target.value })}
                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-base font-bold shadow-sm transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-4 focus:ring-[#1F6FDB]/10 focus:outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-[10px] font-black tracking-widest text-slate-400 uppercase">Payment Method</label>
                        <select
                            value={recordData.method}
                            onChange={(e) => setRecordData({ ...recordData, method: e.target.value })}
                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-base font-bold shadow-sm transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-4 focus:ring-[#1F6FDB]/10 focus:outline-none"
                        >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Collection"
                message={`Are you sure you want to delete "${collection.name}"? This will permanently remove all ${stats.total_assignments} assignment(s). This cannot be undone.`}
                confirmLabel="Yes, Delete Collection"
                cancelLabel="Cancel"
                type="danger"
                isLoading={isDeleting}
            />
        </>
    );
}

ShowCollection.layout = (page: React.ReactNode) => <AdminLayout children={page} title="Collections" />;
