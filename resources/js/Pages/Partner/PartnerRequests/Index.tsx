import {
    ArrowDownTrayIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    ChevronDownIcon,
    FunnelIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    RectangleStackIcon,
    Squares2X2Icon,
    UserCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission } from '@/Utils/money';

interface TimelineEvent {
    id: number | string;
    event_type: string;
    description: string;
    creator_name: string | null;
    created_at: string | null;
    metadata?: Record<string, unknown> | null;
}

interface AdminNote {
    id: number;
    body: string;
    type: string | null;
    creator_name: string | null;
    created_at: string | null;
}

interface PartnerRequest {
    id: number;
    estate_name: string;
    estate_address: string | null;
    chairman_name: string;
    chairman_email: string;
    chairman_phone: string | null;
    number_of_houses: number | null;
    state: string | null;
    lga: string | null;
    notes: string | null;
    status: string;
    status_label: string;
    is_generating_revenue?: boolean;
    rejection_reason: string | null;
    info_request_message: string | null;
    challenges?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    updated_at: string;
    assigned_manager?: { name: string } | null;
    estate?: { ulid: string; name: string; status: string } | null;
    timeline?: TimelineEvent[];
    admin_notes?: AdminNote[];
}

interface Column {
    key: string;
    label: string;
}

interface Props {
    partnerRequests: PartnerRequest[];
    columns: Column[];
    commission?: { rate: string | null; type: string | null };
    filters?: { search?: string; status?: string };
}

type ViewMode = 'pipeline' | 'cards' | 'table';
type SortKey = 'newest' | 'oldest' | 'name' | 'houses' | 'stage';
type DrawerTab = 'overview' | 'timeline' | 'contact' | 'notes' | 'feedback';

/** ₦4,000/mo ARPU in kobo (matches annual plan economics). */
const EST_ARPU_KOBO = 400_000;

const STAGE_ORDER = ['submitted', 'accepted', 'rejected'];

const STAGE_META: Record<string, { tone: string; bar: string; label: string; progress: number; dot: string }> = {
    submitted: {
        tone: 'bg-sky-50 text-sky-700 ring-sky-500/15 dark:bg-sky-500/10 dark:text-sky-300',
        bar: 'bg-sky-500',
        label: 'Submitted',
        progress: 35,
        dot: 'bg-sky-500',
    },
    accepted: {
        tone: 'bg-emerald-50 text-emerald-700 ring-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        label: 'Accepted',
        progress: 100,
        dot: 'bg-emerald-500',
    },
    rejected: {
        tone: 'bg-rose-50 text-rose-700 ring-rose-500/15 dark:bg-rose-500/10 dark:text-rose-300',
        bar: 'bg-rose-500',
        label: 'Rejected',
        progress: 0,
        dot: 'bg-rose-500',
    },
};

function stageMeta(status: string) {
    return STAGE_META[status] ?? STAGE_META.submitted;
}

function formatDate(iso: string | null | undefined, style: 'short' | 'medium' | 'full' = 'medium'): string {
    if (!iso) {
        return '—';
    }
    const d = new Date(iso);
    if (style === 'short') {
        return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    }
    if (style === 'full') {
        return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    }

    return d.toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

function estimates(request: PartnerRequest, commission?: { rate: string | null; type: string | null }) {
    const houses = request.number_of_houses ?? 0;
    const monthlyKobo = houses > 0 ? houses * EST_ARPU_KOBO : null;
    const annualKobo = monthlyKobo != null ? monthlyKobo * 12 : null;
    let commissionKobo: number | null = null;

    if (annualKobo && commission?.rate && commission.type !== 'fixed') {
        commissionKobo = Math.round((annualKobo * Number(commission.rate)) / 100);
    } else if (annualKobo && commission?.rate && commission.type === 'fixed') {
        commissionKobo = Number(commission.rate);
    }

    return { houses, commissionKobo };
}

function exportCsv(rows: PartnerRequest[]) {
    const header = ['Estate', 'Status', 'Contact', 'Email', 'Phone', 'State', 'LGA', 'Houses', 'Submitted'];
    const body = rows.map((r) => [
        r.estate_name,
        r.status_label,
        r.chairman_name,
        r.chairman_email,
        r.chairman_phone ?? '',
        r.state ?? '',
        r.lga ?? '',
        r.number_of_houses ?? '',
        r.created_at,
    ]);
    const csv = [header, ...body].map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontrol-my-estates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function highlightMatch(text: string, query: string) {
    const q = query.trim();
    if (!q) {
        return text;
    }
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) {
        return text;
    }

    return (
        <>
            {text.slice(0, idx)}
            <mark className="rounded-sm bg-primary-100 px-0.5 text-inherit dark:bg-primary-500/25">{text.slice(idx, idx + q.length)}</mark>
            {text.slice(idx + q.length)}
        </>
    );
}

function StatusChip({ status, label }: { status: string; label?: string }) {
    const meta = stageMeta(status);

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.tone}`}>
            <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
            {label ?? meta.label}
        </span>
    );
}

function EstateCard({
    request,
    onOpen,
    commission,
    search,
    dense = false,
}: {
    request: PartnerRequest;
    onOpen: (r: PartnerRequest) => void;
    commission?: { rate: string | null; type: string | null };
    search?: string;
    dense?: boolean;
}) {
    const est = estimates(request, commission);
    const location = [request.lga, request.state].filter(Boolean).join(', ');
    const q = search ?? '';

    return (
        <motion.button
            type="button"
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -1 }}
            onClick={() => onOpen(request)}
            className={`group w-full rounded-xl bg-white text-left shadow-sm ring-1 ring-stone-900/[0.05] transition hover:shadow-md hover:ring-primary-500/20 dark:bg-white/[0.04] dark:shadow-none dark:ring-white/[0.07] dark:hover:ring-primary-400/25 ${
                dense ? 'p-2.5' : 'p-3'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-stone-900 dark:text-white">
                    {highlightMatch(request.estate_name, q)}
                </p>
                <StatusChip status={request.status} label={request.status_label} />
            </div>

            {(location || request.chairman_name) && (
                <p className="mt-1 truncate text-[11px] text-stone-500 dark:text-slate-400">
                    {location ? highlightMatch(location, q) : null}
                    {location && request.chairman_name ? ' · ' : null}
                    {request.chairman_name ? highlightMatch(request.chairman_name, q) : null}
                </p>
            )}

            {request.status === 'rejected' && request.rejection_reason && (
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-rose-600 dark:text-rose-400">
                    {request.rejection_reason}
                </p>
            )}

            <div className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                <motion.div
                    className={`h-full rounded-full ${stageMeta(request.status).bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stageMeta(request.status).progress}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-stone-400">{formatDate(request.created_at, 'short')}</span>
                {est.commissionKobo != null && (
                    <span className="text-[10px] font-semibold tabular-nums text-stone-600 dark:text-slate-300">
                        ~{formatAmount(est.commissionKobo)}
                        <span className="font-medium text-stone-400">/yr</span>
                    </span>
                )}
            </div>
        </motion.button>
    );
}

function FiltersPanel({
    open,
    onClose,
    sort,
    setSort,
    view,
    setView,
    stateFilter,
    setStateFilter,
    lgaFilter,
    setLgaFilter,
    chairmanFilter,
    setChairmanFilter,
    minHouses,
    setMinHouses,
    states,
    lgas,
    onExport,
    onClear,
    activeCount,
}: {
    open: boolean;
    onClose: () => void;
    sort: SortKey;
    setSort: (v: SortKey) => void;
    view: ViewMode;
    setView: (v: ViewMode) => void;
    stateFilter: string;
    setStateFilter: (v: string) => void;
    lgaFilter: string;
    setLgaFilter: (v: string) => void;
    chairmanFilter: string;
    setChairmanFilter: (v: string) => void;
    minHouses: string;
    setMinHouses: (v: string) => void;
    states: string[];
    lgas: string[];
    onExport: () => void;
    onClear: () => void;
    activeCount: number;
}) {
    useEffect(() => {
        if (!open) {
            return;
        }
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose();
            }
        }
        document.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    const field =
        'w-full rounded-xl bg-stone-50 px-3 py-2.5 text-[13px] text-stone-800 outline-none ring-1 ring-stone-900/[0.05] focus:ring-primary-300 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10';

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-stone-950/30 backdrop-blur-[2px]"
                        onClick={onClose}
                        aria-hidden
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 32, stiffness: 360 }}
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950 sm:max-w-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filters"
                    >
                        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-white/10">
                            <div>
                                <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Filters</h2>
                                {activeCount > 0 && (
                                    <p className="mt-0.5 text-[12px] text-stone-500">{activeCount} active</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10"
                                aria-label="Close filters"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                    Sort
                                </label>
                                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={field}>
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="name">Name A–Z</option>
                                    <option value="houses">Most houses</option>
                                    <option value="stage">By stage</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                    View
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-100 p-1 dark:bg-white/5">
                                    {(
                                        [
                                            { key: 'pipeline' as const, label: 'Pipeline' },
                                            { key: 'cards' as const, label: 'Cards' },
                                            { key: 'table' as const, label: 'Table' },
                                        ] as const
                                    ).map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setView(item.key)}
                                            className={`rounded-lg py-2 text-[12px] font-semibold transition ${
                                                view === item.key
                                                    ? 'bg-white text-stone-900 shadow-sm dark:bg-white/15 dark:text-white'
                                                    : 'text-stone-500'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                        State
                                    </label>
                                    <select
                                        value={stateFilter}
                                        onChange={(e) => {
                                            setStateFilter(e.target.value);
                                            setLgaFilter('');
                                        }}
                                        className={field}
                                    >
                                        <option value="">All</option>
                                        {states.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                        LGA
                                    </label>
                                    <select value={lgaFilter} onChange={(e) => setLgaFilter(e.target.value)} className={field}>
                                        <option value="">All</option>
                                        {lgas.map((l) => (
                                            <option key={l} value={l}>
                                                {l}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                    Contact person
                                </label>
                                <input
                                    type="text"
                                    value={chairmanFilter}
                                    onChange={(e) => setChairmanFilter(e.target.value)}
                                    placeholder="Filter by name"
                                    className={field}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                                    Min. houses
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={minHouses}
                                    onChange={(e) => setMinHouses(e.target.value)}
                                    placeholder="Any"
                                    className={field}
                                />
                            </div>

                            <div className="border-t border-stone-100 pt-4 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={onExport}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-50 py-2.5 text-[13px] font-semibold text-stone-700 ring-1 ring-stone-900/[0.05] transition hover:bg-stone-100 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 border-t border-stone-100 p-4 dark:border-white/10">
                            <button
                                type="button"
                                onClick={onClear}
                                className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-stone-600 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-white/5"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl bg-stone-900 py-2.5 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                            >
                                Done
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

function DetailDrawer({
    request,
    commission,
    onClose,
}: {
    request: PartnerRequest;
    commission?: { rate: string | null; type: string | null };
    onClose: () => void;
}) {
    const [tab, setTab] = useState<DrawerTab>('overview');
    const est = estimates(request, commission);
    const timeline = request.timeline ?? [];
    const adminNotes = request.admin_notes ?? [];
    const stages = STAGE_ORDER.filter((s) => s !== 'rejected');
    const stageIndex = request.status === 'accepted' ? 1 : 0;

    const tabs: { key: DrawerTab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'timeline', label: 'Timeline' },
        { key: 'contact', label: 'Contact' },
        { key: 'notes', label: 'Notes' },
        { key: 'feedback', label: 'Feedback' },
    ];

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose();
            }
        }
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden
            />
            <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-[#faf9f7] shadow-2xl dark:bg-slate-950"
                role="dialog"
                aria-modal="true"
                aria-labelledby="estate-drawer-title"
            >
                <div className="relative overflow-hidden border-b border-stone-200/80 bg-stone-950 px-5 py-5 text-white dark:border-white/10">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,111,219,0.4),transparent_55%)]" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium tracking-wide text-white/50">Estate</p>
                            <h2 id="estate-drawer-title" className="mt-1 truncate text-xl font-semibold tracking-tight">
                                {request.estate_name}
                            </h2>
                            <div className="mt-2.5">
                                <StatusChip status={request.status} label={request.status_label} />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/15"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {request.status !== 'rejected' && (
                        <div className="relative mt-5 flex items-center gap-1">
                            {stages.map((stage, i) => {
                                const done = stageIndex >= i;
                                const current = request.status === stage;

                                return (
                                    <div key={stage} className="flex flex-1 flex-col items-center gap-1.5">
                                        <div
                                            className={`h-1.5 w-full rounded-full ${done ? 'bg-sky-400' : 'bg-white/15'} ${
                                                current ? 'ring-2 ring-sky-300/40 ring-offset-1 ring-offset-stone-950' : ''
                                            }`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex gap-1 overflow-x-auto border-b border-stone-200/80 px-3 py-2 dark:border-white/10">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                                tab === t.key
                                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                                    : 'text-stone-500 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-white/5'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tab}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.16 }}
                            className="space-y-4"
                        >
                            {tab === 'overview' && (
                                <>
                                    {request.status === 'rejected' && (
                                        <div className="rounded-xl bg-rose-50 p-4 ring-1 ring-rose-500/15 dark:bg-rose-500/10">
                                            <p className="text-[10px] font-bold tracking-wide text-rose-700 uppercase dark:text-rose-300">
                                                Rejection reason
                                            </p>
                                            <p className="mt-1.5 text-[13px] leading-relaxed text-rose-950 dark:text-rose-100">
                                                {request.rejection_reason || 'No reason was provided.'}
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {[
                                            { label: 'Houses', value: est.houses || '—' },
                                            {
                                                label: 'Est. commission',
                                                value: est.commissionKobo != null ? formatAmount(est.commissionKobo) : '—',
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10"
                                            >
                                                <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 text-[15px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                        <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Location</p>
                                        <p className="mt-1 text-[13px] font-medium text-stone-800 dark:text-slate-200">
                                            {request.estate_address || '—'}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-stone-500">
                                            {[request.lga, request.state].filter(Boolean).join(', ') || '—'}
                                        </p>
                                    </div>
                                    {request.assigned_manager && (
                                        <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                            <UserCircleIcon className="h-5 w-5 text-primary-600" />
                                            <div>
                                                <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                                                    Account manager
                                                </p>
                                                <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                    {request.assigned_manager.name}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {request.estate && (
                                        <div className="rounded-xl bg-emerald-50 p-3.5 ring-1 ring-emerald-500/15 dark:bg-emerald-500/10">
                                            <p className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                                Live estate
                                            </p>
                                            <p className="mt-1 text-[14px] font-semibold text-emerald-950 dark:text-emerald-100">
                                                {request.estate.name}
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                                        <div>
                                            <p className="text-stone-400">Submitted</p>
                                            <p className="mt-0.5 font-medium text-stone-800 dark:text-slate-200">
                                                {formatDate(request.created_at, 'full')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-stone-400">Updated</p>
                                            <p className="mt-0.5 font-medium text-stone-800 dark:text-slate-200">
                                                {formatDate(request.updated_at, 'full')}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {tab === 'timeline' && (
                                <ol className="space-y-0">
                                    {timeline.length === 0 ? (
                                        <p className="py-8 text-center text-[13px] text-stone-500">No timeline events yet.</p>
                                    ) : (
                                        timeline.map((event, i) => (
                                            <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                                                <div className="relative flex flex-col items-center">
                                                    <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
                                                        <CheckCircleIcon className="h-3.5 w-3.5" />
                                                    </span>
                                                    {i < timeline.length - 1 && (
                                                        <span className="mt-1 w-px flex-1 bg-stone-200 dark:bg-slate-700" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                        {event.description}
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-stone-500">
                                                        {event.creator_name || 'System'} · {formatDate(event.created_at, 'full')}
                                                    </p>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ol>
                            )}

                            {tab === 'contact' && (
                                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                    <p className="text-[15px] font-semibold text-stone-900 dark:text-white">{request.chairman_name}</p>
                                    <p className="mt-2 text-[13px] text-stone-600 dark:text-slate-300">{request.chairman_email}</p>
                                    <p className="mt-0.5 text-[13px] text-stone-600 dark:text-slate-300">
                                        {request.chairman_phone || 'No phone'}
                                    </p>
                                </div>
                            )}

                            {tab === 'notes' && (
                                <div className="space-y-3">
                                    {request.notes ? (
                                        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                            <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                                                Your notes
                                            </p>
                                            <p className="mt-2 text-[13px] leading-relaxed text-stone-700 dark:text-slate-300">
                                                {request.notes}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="py-6 text-center text-[13px] text-stone-500">No notes.</p>
                                    )}
                                    {adminNotes.map((note) => (
                                        <div
                                            key={note.id}
                                            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]"
                                        >
                                            <p className="text-[10px] text-stone-400">
                                                {note.creator_name || 'Kontrol'} · {formatDate(note.created_at, 'short')}
                                            </p>
                                            <p className="mt-2 text-[13px] text-stone-700 dark:text-slate-300">{note.body}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tab === 'feedback' && (
                                <>
                                    {request.rejection_reason || request.challenges || request.info_request_message ? (
                                        <div className="space-y-3 text-[13px]">
                                            {request.rejection_reason && (
                                                <div className="rounded-xl bg-rose-50 p-4 ring-1 ring-rose-500/15 dark:bg-rose-500/10">
                                                    <p className="text-[10px] font-bold tracking-wide text-rose-700 uppercase dark:text-rose-300">
                                                        Rejection reason
                                                    </p>
                                                    <p className="mt-1.5 leading-relaxed text-rose-950 dark:text-rose-100">
                                                        {request.rejection_reason}
                                                    </p>
                                                </div>
                                            )}
                                            {request.info_request_message && (
                                                <div className="rounded-xl bg-amber-50 p-3.5 dark:bg-amber-500/10">
                                                    {request.info_request_message}
                                                </div>
                                            )}
                                            {request.challenges && (
                                                <div className="rounded-xl bg-white p-3.5 ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                                    {request.challenges}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="py-10 text-center text-[13px] text-stone-500">No administrator feedback yet.</p>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="border-t border-stone-200/80 p-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-stone-900 py-2.5 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                    >
                        Close
                    </button>
                </div>
            </motion.aside>
        </>
    );
}

export default function PartnerRequestsIndex({ partnerRequests, columns, commission, filters }: Props) {
    const page = usePage();
    const sharedCommission = (
        page.props as { partnerContext?: { commission_rate: string | null; commission_type: string | null } }
    ).partnerContext;
    const commissionInfo = commission ?? {
        rate: sharedCommission?.commission_rate ?? null,
        type: sharedCommission?.commission_type ?? null,
    };

    const [view, setView] = useState<ViewMode>(() => {
        if (typeof window === 'undefined') {
            return 'pipeline';
        }

        return (localStorage.getItem('partner-estates-view') as ViewMode) || 'pipeline';
    });
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [stateFilter, setStateFilter] = useState('');
    const [lgaFilter, setLgaFilter] = useState('');
    const [chairmanFilter, setChairmanFilter] = useState('');
    const [minHouses, setMinHouses] = useState('');
    const [sort, setSort] = useState<SortKey>('newest');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selected, setSelected] = useState<PartnerRequest | null>(null);

    useEffect(() => {
        localStorage.setItem('partner-estates-view', view);
    }, [view]);

    const states = useMemo(() => {
        const set = new Set<string>();
        partnerRequests.forEach((r) => {
            if (r.state) {
                set.add(r.state);
            }
        });

        return Array.from(set).sort();
    }, [partnerRequests]);

    const lgas = useMemo(() => {
        const set = new Set<string>();
        partnerRequests.forEach((r) => {
            if (r.lga && (!stateFilter || r.state === stateFilter)) {
                set.add(r.lga);
            }
        });

        return Array.from(set).sort();
    }, [partnerRequests, stateFilter]);

    const kpis = useMemo(() => {
        const count = (key: string) => partnerRequests.filter((r) => r.status === key).length;

        return [
            { key: '', label: 'All', count: partnerRequests.length },
            { key: 'submitted', label: 'Submitted', count: count('submitted') },
            { key: 'accepted', label: 'Accepted', count: count('accepted') },
            { key: 'rejected', label: 'Rejected', count: count('rejected') },
        ];
    }, [partnerRequests]);

    const advancedActiveCount = useMemo(() => {
        let n = 0;
        if (stateFilter) {
            n++;
        }
        if (lgaFilter) {
            n++;
        }
        if (chairmanFilter.trim()) {
            n++;
        }
        if (minHouses) {
            n++;
        }
        if (sort !== 'newest') {
            n++;
        }

        return n;
    }, [stateFilter, lgaFilter, chairmanFilter, minHouses, sort]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const minH = minHouses ? Number(minHouses) : null;

        let rows = partnerRequests.filter((request) => {
            if (statusFilter && request.status !== statusFilter) {
                return false;
            }
            if (stateFilter && request.state !== stateFilter) {
                return false;
            }
            if (lgaFilter && request.lga !== lgaFilter) {
                return false;
            }
            if (chairmanFilter.trim() && !request.chairman_name.toLowerCase().includes(chairmanFilter.trim().toLowerCase())) {
                return false;
            }
            if (minH != null && !Number.isNaN(minH) && (request.number_of_houses ?? 0) < minH) {
                return false;
            }
            if (!q) {
                return true;
            }

            return (
                request.estate_name.toLowerCase().includes(q) ||
                request.chairman_name.toLowerCase().includes(q) ||
                (request.state ?? '').toLowerCase().includes(q) ||
                (request.lga ?? '').toLowerCase().includes(q) ||
                request.chairman_email.toLowerCase().includes(q)
            );
        });

        rows = [...rows].sort((a, b) => {
            switch (sort) {
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'name':
                    return a.estate_name.localeCompare(b.estate_name);
                case 'houses':
                    return (b.number_of_houses ?? 0) - (a.number_of_houses ?? 0);
                case 'stage':
                    return STAGE_ORDER.indexOf(a.status) - STAGE_ORDER.indexOf(b.status);
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        return rows;
    }, [partnerRequests, search, statusFilter, stateFilter, lgaFilter, chairmanFilter, minHouses, sort]);

    const byStatus = useMemo(() => {
        const map: Record<string, PartnerRequest[]> = {};
        for (const col of columns) {
            map[col.key] = [];
        }
        for (const request of filtered) {
            if (!map[request.status]) {
                map[request.status] = [];
            }
            map[request.status].push(request);
        }

        return map;
    }, [filtered, columns]);

    function clearAdvanced() {
        setStateFilter('');
        setLgaFilter('');
        setChairmanFilter('');
        setMinHouses('');
        setSort('newest');
    }

    return (
        <PartnerLayout fullWidth={view === 'pipeline'}>
            <Head title="My Estates – Partner Portal" />

            <div className="space-y-5 pb-2">
                {/* Title */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-[1.35rem] dark:text-white">
                            My Estates
                        </h1>
                        <p className="mt-0.5 text-[13px] text-stone-500 dark:text-slate-400">
                            From submission to activation.
                        </p>
                    </div>
                    {commissionInfo.rate && (
                        <p className="text-[12px] text-stone-400">
                            Rate{' '}
                            <span className="font-semibold text-stone-600 dark:text-slate-300">
                                {formatCommission(commissionInfo.rate, commissionInfo.type)}
                            </span>
                        </p>
                    )}
                </div>

                {/* Minimal top bar */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[160px] flex-1">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search estates…"
                            aria-label="Search estates"
                            className="w-full rounded-xl bg-white py-2.5 pr-3 pl-9 text-[13px] text-stone-900 shadow-sm outline-none ring-1 ring-stone-900/[0.06] transition placeholder:text-stone-400 focus:ring-2 focus:ring-primary-200 dark:bg-white/[0.04] dark:text-white dark:ring-white/10 dark:focus:ring-primary-800"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Status"
                            className="appearance-none rounded-xl bg-white py-2.5 pr-8 pl-3 text-[13px] font-medium text-stone-700 shadow-sm ring-1 ring-stone-900/[0.06] outline-none dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10"
                        >
                            <option value="">Status</option>
                            {columns.map((col) => (
                                <option key={col.key} value={col.key}>
                                    {col.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    </div>

                    <button
                        type="button"
                        onClick={() => setFiltersOpen(true)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold shadow-sm ring-1 transition ${
                            advancedActiveCount > 0
                                ? 'bg-primary-50 text-primary-700 ring-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300'
                                : 'bg-white text-stone-700 ring-stone-900/[0.06] hover:bg-stone-50 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10'
                        }`}
                    >
                        <FunnelIcon className="h-3.5 w-3.5" />
                        Filters
                        {advancedActiveCount > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                                {advancedActiveCount}
                            </span>
                        )}
                    </button>

                    <Link
                        href="/partner/partner-requests/create"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Submit estate</span>
                        <span className="sm:hidden">New</span>
                    </Link>
                </div>

                {partnerRequests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]"
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600">
                            <BuildingOffice2Icon className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-stone-900 dark:text-white">Submit your first estate</h2>
                        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-stone-500">
                            Track approvals and earn commission when residents subscribe.
                        </p>
                        <Link
                            href="/partner/partner-requests/create"
                            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Submit estate
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        {/* Compact KPI strip */}
                        <div className="flex gap-1 overflow-x-auto pb-0.5">
                            {kpis.map((kpi) => {
                                const active = statusFilter === kpi.key || (kpi.key === '' && !statusFilter);

                                return (
                                    <button
                                        key={kpi.key || 'all'}
                                        type="button"
                                        onClick={() => setStatusFilter(kpi.key)}
                                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-medium transition ${
                                            active
                                                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                                                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-slate-400 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <span>{kpi.label}</span>
                                        <span
                                            className={`tabular-nums ${
                                                active ? 'opacity-80' : 'text-stone-400 dark:text-slate-500'
                                            }`}
                                        >
                                            {kpi.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content header: count + view switch */}
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] text-stone-400">
                                <span className="font-semibold text-stone-600 dark:text-slate-300">{filtered.length}</span>
                                {filtered.length === 1 ? ' estate' : ' estates'}
                            </p>
                            <div
                                className="inline-flex rounded-lg bg-stone-100/90 p-0.5 dark:bg-white/5"
                                role="group"
                                aria-label="View mode"
                            >
                                {(
                                    [
                                        { key: 'pipeline' as const, icon: Squares2X2Icon, label: 'Pipeline' },
                                        { key: 'cards' as const, icon: RectangleStackIcon, label: 'Cards' },
                                        { key: 'table' as const, icon: ListBulletIcon, label: 'Table' },
                                    ] as const
                                ).map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setView(item.key)}
                                        aria-pressed={view === item.key}
                                        title={item.label}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                                            view === item.key
                                                ? 'bg-white text-stone-900 shadow-sm dark:bg-white/15 dark:text-white'
                                                : 'text-stone-500 dark:text-slate-400'
                                        }`}
                                    >
                                        <item.icon className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${view}-${statusFilter}-${search}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                            >
                                {filtered.length === 0 ? (
                                    <div className="rounded-2xl py-14 text-center">
                                        <MagnifyingGlassIcon className="mx-auto h-7 w-7 text-stone-300 dark:text-slate-600" />
                                        <p className="mt-3 text-[14px] font-semibold text-stone-800 dark:text-white">
                                            No matching estates
                                        </p>
                                        <p className="mt-1 text-[13px] text-stone-500">Try a different search or filter.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                setStatusFilter('');
                                                clearAdvanced();
                                            }}
                                            className="mt-4 text-[13px] font-semibold text-primary-600"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                ) : view === 'pipeline' ? (
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {columns.map((col) => {
                                            const items = byStatus[col.key] ?? [];
                                            const meta = stageMeta(col.key);

                                            return (
                                                <div key={col.key} className="flex w-[260px] shrink-0 flex-col">
                                                    <div className="mb-2.5 flex items-center gap-2 px-0.5">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                                        <h3 className="text-[12px] font-semibold text-stone-700 dark:text-slate-200">
                                                            {col.label}
                                                        </h3>
                                                        <span className="text-[11px] font-medium tabular-nums text-stone-400">
                                                            {items.length}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-1 flex-col gap-2">
                                                        {items.length === 0 ? (
                                                            <div className="rounded-xl px-3 py-8 text-center">
                                                                <p className="text-[12px] text-stone-400">No estates here.</p>
                                                            </div>
                                                        ) : (
                                                            items.map((request) => (
                                                                <EstateCard
                                                                    key={request.id}
                                                                    request={request}
                                                                    onOpen={setSelected}
                                                                    commission={commissionInfo}
                                                                    search={search}
                                                                    dense
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : view === 'cards' ? (
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {filtered.map((request) => (
                                            <EstateCard
                                                key={request.id}
                                                request={request}
                                                onOpen={setSelected}
                                                commission={commissionInfo}
                                                search={search}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-[13px]">
                                                <thead className="border-b border-stone-100 text-[10px] font-semibold tracking-wide text-stone-400 uppercase dark:border-white/10">
                                                    <tr>
                                                        <th className="px-3 py-2.5 text-left">Estate</th>
                                                        <th className="px-3 py-2.5 text-left">Location</th>
                                                        <th className="px-3 py-2.5 text-left">Contact</th>
                                                        <th className="px-3 py-2.5 text-right">Houses</th>
                                                        <th className="px-3 py-2.5 text-left">Stage</th>
                                                        <th className="px-3 py-2.5 text-left">Submitted</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-stone-50 dark:divide-white/[0.04]">
                                                    {filtered.map((request) => (
                                                        <tr
                                                            key={request.id}
                                                            onClick={() => setSelected(request)}
                                                            className="cursor-pointer transition hover:bg-stone-50/80 dark:hover:bg-white/[0.03]"
                                                        >
                                                            <td className="px-3 py-2.5 font-semibold text-stone-900 dark:text-white">
                                                                {highlightMatch(request.estate_name, search)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-stone-600 dark:text-slate-300">
                                                                {[request.lga, request.state].filter(Boolean).join(', ') || '—'}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-stone-600 dark:text-slate-300">
                                                                {request.chairman_name}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right tabular-nums text-stone-600">
                                                                {request.number_of_houses ?? '—'}
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <StatusChip status={request.status} label={request.status_label} />
                                                            </td>
                                                            <td className="px-3 py-2.5 text-stone-400">
                                                                {formatDate(request.created_at, 'short')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </>
                )}
            </div>

            <FiltersPanel
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                sort={sort}
                setSort={setSort}
                view={view}
                setView={setView}
                stateFilter={stateFilter}
                setStateFilter={setStateFilter}
                lgaFilter={lgaFilter}
                setLgaFilter={setLgaFilter}
                chairmanFilter={chairmanFilter}
                setChairmanFilter={setChairmanFilter}
                minHouses={minHouses}
                setMinHouses={setMinHouses}
                states={states}
                lgas={lgas}
                onExport={() => exportCsv(filtered)}
                onClear={clearAdvanced}
                activeCount={advancedActiveCount}
            />

            <AnimatePresence>
                {selected && (
                    <DetailDrawer request={selected} commission={commissionInfo} onClose={() => setSelected(null)} />
                )}
            </AnimatePresence>
        </PartnerLayout>
    );
}
