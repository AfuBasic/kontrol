import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ClockIcon,
    DocumentTextIcon,
    FunnelIcon,
    HomeModernIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    PlusIcon,
    RectangleStackIcon,
    SparklesIcon,
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
type SavedView = 'all' | 'attention' | 'active' | 'won' | 'lost';

/** Rough ARPU assumption for opportunity estimates (kobo / household / mo). */
const EST_ARPU_KOBO = 250_000;
const RESIDENTS_PER_HOUSE = 4;

const STAGE_ORDER = ['submitted', 'reviewing', 'info_requested', 'approved', 'estate_created', 'rejected'];

const STAGE_META: Record<string, { tone: string; bar: string; label: string; progress: number }> = {
    submitted: {
        tone: 'bg-sky-50 text-sky-700 ring-sky-500/15 dark:bg-sky-500/10 dark:text-sky-300',
        bar: 'bg-sky-500',
        label: 'Submitted',
        progress: 15,
    },
    reviewing: {
        tone: 'bg-blue-50 text-blue-700 ring-blue-500/15 dark:bg-blue-500/10 dark:text-blue-300',
        bar: 'bg-blue-500',
        label: 'Under Review',
        progress: 35,
    },
    info_requested: {
        tone: 'bg-amber-50 text-amber-800 ring-amber-500/15 dark:bg-amber-500/10 dark:text-amber-300',
        bar: 'bg-amber-500',
        label: 'Info Requested',
        progress: 45,
    },
    approved: {
        tone: 'bg-violet-50 text-violet-700 ring-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300',
        bar: 'bg-violet-500',
        label: 'Approved',
        progress: 70,
    },
    estate_created: {
        tone: 'bg-emerald-50 text-emerald-700 ring-emerald-500/15 dark:bg-emerald-500/10 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        label: 'Activated',
        progress: 100,
    },
    rejected: {
        tone: 'bg-rose-50 text-rose-700 ring-rose-500/15 dark:bg-rose-500/10 dark:text-rose-300',
        bar: 'bg-rose-500',
        label: 'Rejected',
        progress: 0,
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

function estimates(
    request: PartnerRequest,
    commission?: { rate: string | null; type: string | null },
) {
    const houses = request.number_of_houses ?? 0;
    const residents = houses > 0 ? Math.round(houses * RESIDENTS_PER_HOUSE) : null;
    const potentialKobo = houses > 0 ? houses * EST_ARPU_KOBO : null;
    let commissionKobo: number | null = null;

    if (potentialKobo && commission?.rate && commission.type !== 'fixed') {
        commissionKobo = Math.round((potentialKobo * Number(commission.rate)) / 100);
    } else if (potentialKobo && commission?.rate && commission.type === 'fixed') {
        commissionKobo = Number(commission.rate);
    }

    return { houses, residents, potentialKobo, commissionKobo };
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

function StatusChip({ status, label }: { status: string; label?: string }) {
    const meta = stageMeta(status);

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.bar}`} />
            {label ?? meta.label}
        </span>
    );
}

function ProgressRail({ status }: { status: string }) {
    const meta = stageMeta(status);

    return (
        <div className="h-1 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
            <motion.div
                className={`h-full rounded-full ${meta.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${meta.progress}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
        </div>
    );
}

function EstateCard({
    request,
    onOpen,
    commission,
    compact = false,
    selected = false,
    onToggleSelect,
}: {
    request: PartnerRequest;
    onOpen: (r: PartnerRequest) => void;
    commission?: { rate: string | null; type: string | null };
    compact?: boolean;
    selected?: boolean;
    onToggleSelect?: (id: number) => void;
}) {
    const est = estimates(request, commission);
    const location = [request.lga, request.state].filter(Boolean).join(', ');

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className={`group relative overflow-hidden rounded-2xl bg-white/90 text-left shadow-[0_1px_0_rgba(28,25,23,0.04),0_12px_28px_-16px_rgba(28,25,23,0.18)] ring-1 transition dark:bg-white/[0.04] dark:shadow-none ${
                selected
                    ? 'ring-primary-500/40 dark:ring-primary-400/40'
                    : 'ring-stone-900/[0.05] hover:ring-primary-500/20 dark:ring-white/[0.07] dark:hover:ring-primary-400/25'
            } ${compact ? 'p-3' : 'p-4'}`}
        >
            <div className="pointer-events-none absolute -top-10 -right-8 h-24 w-24 rounded-full bg-primary-500/[0.06] blur-2xl dark:bg-primary-400/10" />

            <div className="relative flex items-start gap-2.5">
                {onToggleSelect && (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(request.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-3.5 w-3.5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                        aria-label={`Select ${request.estate_name}`}
                    />
                )}
                <button type="button" onClick={() => onOpen(request)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className={`font-semibold tracking-tight text-stone-900 dark:text-white ${compact ? 'text-[13px]' : 'text-[14px]'} line-clamp-2`}>
                                {request.estate_name}
                            </p>
                            {location && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500 dark:text-slate-400">
                                    <MapPinIcon className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{location}</span>
                                </p>
                            )}
                        </div>
                        <StatusChip status={request.status} label={request.status_label} />
                    </div>

                    <div className="mt-3">
                        <ProgressRail status={request.status} />
                    </div>

                    <div className={`mt-3 grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        <div>
                            <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Contact</p>
                            <p className="mt-0.5 truncate text-[12px] font-medium text-stone-700 dark:text-slate-200">
                                {request.chairman_name}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Houses</p>
                            <p className="mt-0.5 text-[12px] font-medium tabular-nums text-stone-700 dark:text-slate-200">
                                {est.houses || '—'}
                            </p>
                        </div>
                        {!compact && (
                            <div>
                                <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Est. commission</p>
                                <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-primary-700 dark:text-primary-300">
                                    {est.commissionKobo != null ? formatAmount(est.commissionKobo) : '—'}
                                    <span className="ml-0.5 text-[9px] font-medium text-stone-400">/mo</span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5 dark:border-white/[0.06]">
                        <p className="text-[11px] text-stone-400">
                            Submitted {formatDate(request.created_at, 'short')}
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary-600 opacity-0 transition group-hover:opacity-100 dark:text-primary-400">
                            Open
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                        </span>
                    </div>
                </button>
            </div>
        </motion.article>
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
    const stageIndex = stages.indexOf(request.status === 'rejected' ? 'submitted' : request.status);

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
                            <p className="text-[11px] font-medium tracking-wide text-white/50">Estate pipeline</p>
                            <h2 id="estate-drawer-title" className="mt-1 truncate text-xl font-semibold tracking-tight">
                                {request.estate_name}
                            </h2>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <StatusChip status={request.status} label={request.status_label} />
                                {request.is_generating_revenue && (
                                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
                                        Generating revenue
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
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
                                            className={`h-1.5 w-full rounded-full ${
                                                done ? 'bg-sky-400' : 'bg-white/15'
                                            } ${current ? 'ring-2 ring-sky-300/40 ring-offset-1 ring-offset-stone-950' : ''}`}
                                        />
                                        <span className={`text-[9px] font-medium ${done ? 'text-white/70' : 'text-white/30'}`}>
                                            {stageMeta(stage).label.split(' ')[0]}
                                        </span>
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
                                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-slate-400 dark:hover:bg-white/5'
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
                            transition={{ duration: 0.18 }}
                        >
                            {tab === 'overview' && (
                                <div className="space-y-4">
                                    {request.info_request_message && (
                                        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-500/15 dark:bg-amber-500/10">
                                            <p className="text-[11px] font-bold tracking-wide text-amber-800 uppercase dark:text-amber-300">
                                                Action needed
                                            </p>
                                            <p className="mt-1 text-[13px] text-amber-950 dark:text-amber-100">
                                                {request.info_request_message}
                                            </p>
                                        </div>
                                    )}
                                    {request.rejection_reason && (
                                        <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-500/15 dark:bg-rose-500/10">
                                            <p className="text-[11px] font-bold tracking-wide text-rose-800 uppercase dark:text-rose-300">
                                                Rejection reason
                                            </p>
                                            <p className="mt-1 text-[13px] text-rose-950 dark:text-rose-100">
                                                {request.rejection_reason}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Houses', value: est.houses || '—' },
                                            { label: 'Est. residents', value: est.residents ?? '—' },
                                            {
                                                label: 'Potential revenue',
                                                value: est.potentialKobo != null ? formatAmount(est.potentialKobo) : '—',
                                                hint: '/mo est.',
                                            },
                                            {
                                                label: 'Expected commission',
                                                value: est.commissionKobo != null ? formatAmount(est.commissionKobo) : '—',
                                                hint: commission?.rate
                                                    ? formatCommission(commission.rate, commission.type)
                                                    : undefined,
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10"
                                            >
                                                <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 text-[15px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                    {item.value}
                                                </p>
                                                {item.hint && (
                                                    <p className="mt-0.5 text-[10px] text-stone-400">{item.hint}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10">
                                        <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Location</p>
                                        <p className="mt-1 text-[13px] font-medium text-stone-800 dark:text-slate-200">
                                            {request.estate_address || '—'}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-stone-500">
                                            {[request.lga, request.state].filter(Boolean).join(', ') || '—'}
                                        </p>
                                    </div>

                                    {request.assigned_manager && (
                                        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
                                                <UserCircleIcon className="h-5 w-5" />
                                            </div>
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
                                        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-500/15 dark:bg-emerald-500/10">
                                            <p className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                                Live estate
                                            </p>
                                            <p className="mt-1 text-[14px] font-semibold text-emerald-950 dark:text-emerald-100">
                                                {request.estate.name}
                                            </p>
                                            <p className="mt-0.5 text-[12px] capitalize text-emerald-700/80 dark:text-emerald-300/80">
                                                Status: {request.estate.status}
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
                                            <p className="text-stone-400">Last activity</p>
                                            <p className="mt-0.5 font-medium text-stone-800 dark:text-slate-200">
                                                {formatDate(request.updated_at, 'full')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tab === 'timeline' && (
                                <ol className="relative space-y-0 pl-1">
                                    {timeline.length === 0 ? (
                                        <p className="py-8 text-center text-[13px] text-stone-500">No timeline events yet.</p>
                                    ) : (
                                        timeline.map((event, i) => (
                                            <li key={event.id} className="relative flex gap-3.5 pb-6 last:pb-0">
                                                <div className="relative flex flex-col items-center">
                                                    <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/15 dark:text-primary-300">
                                                        <CheckCircleIcon className="h-3.5 w-3.5" />
                                                    </span>
                                                    {i < timeline.length - 1 && (
                                                        <span className="mt-1 w-px flex-1 bg-linear-to-b from-stone-200 to-transparent dark:from-slate-700" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10">
                                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                        {event.description}
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-stone-500">
                                                        {event.creator_name || 'System'}
                                                        {' · '}
                                                        {formatDate(event.created_at, 'full')}
                                                    </p>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ol>
                            )}

                            {tab === 'contact' && (
                                <div className="space-y-3">
                                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10">
                                        <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Contact person</p>
                                        <p className="mt-1 text-[15px] font-semibold text-stone-900 dark:text-white">
                                            {request.chairman_name}
                                        </p>
                                        <p className="mt-2 text-[13px] text-stone-600 dark:text-slate-300">{request.chairman_email}</p>
                                        <p className="mt-0.5 text-[13px] text-stone-600 dark:text-slate-300">
                                            {request.chairman_phone || 'No phone on file'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {tab === 'notes' && (
                                <div className="space-y-3">
                                    {request.notes ? (
                                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10">
                                            <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                                                Your submission notes
                                            </p>
                                            <p className="mt-2 text-[13px] leading-relaxed text-stone-700 dark:text-slate-300">
                                                {request.notes}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="py-6 text-center text-[13px] text-stone-500">No partner notes on this submission.</p>
                                    )}
                                    {adminNotes.map((note) => (
                                        <div
                                            key={note.id}
                                            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/10"
                                        >
                                            <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                                                {note.creator_name || 'Kontrol'} · {formatDate(note.created_at, 'short')}
                                            </p>
                                            <p className="mt-2 text-[13px] leading-relaxed text-stone-700 dark:text-slate-300">
                                                {note.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tab === 'feedback' && (
                                <div className="space-y-3">
                                    {request.info_request_message || request.rejection_reason || request.challenges ? (
                                        <>
                                            {request.info_request_message && (
                                                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-500/15 dark:bg-amber-500/10">
                                                    <p className="text-[11px] font-bold text-amber-800 uppercase dark:text-amber-300">
                                                        Information request
                                                    </p>
                                                    <p className="mt-1 text-[13px] text-amber-950 dark:text-amber-100">
                                                        {request.info_request_message}
                                                    </p>
                                                </div>
                                            )}
                                            {request.rejection_reason && (
                                                <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-500/15 dark:bg-rose-500/10">
                                                    <p className="text-[11px] font-bold text-rose-800 uppercase dark:text-rose-300">
                                                        Rejection
                                                    </p>
                                                    <p className="mt-1 text-[13px] text-rose-950 dark:text-rose-100">
                                                        {request.rejection_reason}
                                                    </p>
                                                </div>
                                            )}
                                            {request.challenges && (
                                                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                                    <p className="text-[11px] font-bold tracking-wide text-stone-500 uppercase">
                                                        Challenges
                                                    </p>
                                                    <p className="mt-1 text-[13px] text-stone-700 dark:text-slate-300">
                                                        {request.challenges}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="py-10 text-center">
                                            <SparklesIcon className="mx-auto h-8 w-8 text-stone-300" />
                                            <p className="mt-3 text-[13px] font-medium text-stone-600 dark:text-slate-300">
                                                No administrator feedback yet
                                            </p>
                                            <p className="mt-1 text-[12px] text-stone-400">
                                                Review notes and requests will appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="border-t border-stone-200/80 p-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-stone-900 py-2.5 text-[13px] font-semibold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-900"
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
    const sharedCommission = (page.props as { partnerContext?: { commission_rate: string | null; commission_type: string | null } })
        .partnerContext;
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
    const [sort, setSort] = useState<SortKey>('newest');
    const [savedView, setSavedView] = useState<SavedView>('all');
    const [selected, setSelected] = useState<PartnerRequest | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

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
        const generating = partnerRequests.filter((r) => r.is_generating_revenue).length;

        return [
            { key: '', label: 'All', count: partnerRequests.length, icon: RectangleStackIcon },
            { key: 'submitted', label: 'Submitted', count: count('submitted'), icon: DocumentTextIcon },
            { key: 'reviewing', label: 'Under Review', count: count('reviewing'), icon: ClockIcon },
            { key: 'info_requested', label: 'Info Requested', count: count('info_requested'), icon: FunnelIcon },
            { key: 'approved', label: 'Approved', count: count('approved'), icon: CheckCircleIcon },
            { key: 'estate_created', label: 'Activated', count: count('estate_created'), icon: HomeModernIcon },
            { key: 'generating', label: 'Generating', count: generating, icon: ChartBarIcon },
            { key: 'rejected', label: 'Rejected', count: count('rejected'), icon: XMarkIcon },
        ];
    }, [partnerRequests]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        let rows = partnerRequests.filter((request) => {
            if (savedView === 'attention' && !['info_requested', 'submitted', 'reviewing'].includes(request.status)) {
                return false;
            }
            if (savedView === 'active' && !['submitted', 'reviewing', 'info_requested', 'approved'].includes(request.status)) {
                return false;
            }
            if (savedView === 'won' && request.status !== 'estate_created') {
                return false;
            }
            if (savedView === 'lost' && request.status !== 'rejected') {
                return false;
            }

            if (statusFilter === 'generating') {
                if (!request.is_generating_revenue) {
                    return false;
                }
            } else if (statusFilter && request.status !== statusFilter) {
                return false;
            }

            if (stateFilter && request.state !== stateFilter) {
                return false;
            }
            if (lgaFilter && request.lga !== lgaFilter) {
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
    }, [partnerRequests, search, statusFilter, stateFilter, lgaFilter, sort, savedView]);

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

    function toggleSelect(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }

    function clearFilters() {
        setSearch('');
        setStatusFilter('');
        setStateFilter('');
        setLgaFilter('');
        setSavedView('all');
        setSort('newest');
    }

    const hasActiveFilters =
        !!search || !!statusFilter || !!stateFilter || !!lgaFilter || savedView !== 'all' || sort !== 'newest';

    return (
        <PartnerLayout fullWidth={view === 'pipeline'}>
            <Head title="My Estates – Partner Portal" />

            <div className="relative space-y-5 pb-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-stone-400 uppercase dark:text-slate-500">
                            Commercial pipeline
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-[1.75rem] dark:text-white">
                            My Estates
                        </h1>
                        <p className="mt-1 max-w-xl text-[13px] text-stone-500 dark:text-slate-400">
                            Manage every estate from first conversation to full activation.
                        </p>
                    </div>
                    <Link
                        href="/partner/partner-requests/create"
                        className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-stone-900/15 transition hover:bg-stone-800 active:scale-[0.98] dark:bg-white dark:text-stone-900"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Submit estate
                    </Link>
                </div>

                {/* KPI filter strip */}
                {partnerRequests.length > 0 && (
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                        {kpis.map((kpi) => {
                            const active = statusFilter === kpi.key || (kpi.key === '' && !statusFilter);
                            const Icon = kpi.icon;

                            return (
                                <motion.button
                                    key={kpi.key || 'all'}
                                    type="button"
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setStatusFilter(kpi.key)}
                                    className={`group flex min-w-[112px] shrink-0 flex-col rounded-2xl px-3.5 py-3 text-left transition ${
                                        active
                                            ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20 dark:bg-white dark:text-stone-900'
                                            : 'bg-white/80 text-stone-700 shadow-sm ring-1 ring-stone-900/[0.04] hover:ring-primary-500/20 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <Icon
                                            className={`h-3.5 w-3.5 ${active ? 'opacity-70' : 'text-stone-400 dark:text-slate-500'}`}
                                        />
                                        <span className={`text-lg font-semibold tabular-nums ${active ? '' : 'text-stone-900 dark:text-white'}`}>
                                            {kpi.count}
                                        </span>
                                    </div>
                                    <span className={`mt-1 text-[11px] font-medium ${active ? 'opacity-80' : 'text-stone-500'}`}>
                                        {kpi.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                )}

                {partnerRequests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_1px_0_rgba(28,25,23,0.04),0_24px_48px_-24px_rgba(28,25,23,0.2)] ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:shadow-none dark:ring-white/[0.06]"
                    >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(31,111,219,0.08),transparent_55%)]" />
                        <div className="relative grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
                            <div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/15">
                                    <BuildingOffice2Icon className="h-7 w-7" />
                                </div>
                                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
                                    Submit your first estate
                                </h2>
                                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-stone-500 dark:text-slate-400">
                                    Your commercial pipeline starts here. Refer estates, track every approval, and earn
                                    commission when residents subscribe.
                                </p>
                                <ul className="mt-6 space-y-3">
                                    {[
                                        'Earn commission from resident subscriptions',
                                        'Track every approval and activation',
                                        'Receive clear monthly settlements',
                                        'One workspace for your entire pipeline',
                                    ].map((benefit) => (
                                        <li key={benefit} className="flex items-start gap-2.5 text-[13px] text-stone-600 dark:text-slate-300">
                                            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link
                                        href="/partner/partner-requests/create"
                                        className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-[13px] font-semibold text-white shadow-lg transition hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Submit first estate
                                    </Link>
                                    <Link
                                        href="/partner/support"
                                        className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-semibold text-stone-600 ring-1 ring-stone-900/10 transition hover:bg-stone-50 dark:text-slate-300 dark:ring-white/10"
                                    >
                                        Learn more
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden items-center justify-center lg:flex">
                                <div className="relative h-64 w-full max-w-sm">
                                    <div className="absolute inset-x-8 top-8 h-40 rounded-2xl bg-linear-to-br from-primary-500/20 to-sky-400/10 blur-2xl" />
                                    <div className="absolute left-6 top-10 w-56 rotate-[-6deg] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-stone-900/5 dark:bg-slate-900">
                                        <div className="h-2 w-20 rounded-full bg-stone-200 dark:bg-slate-700" />
                                        <div className="mt-3 h-2 w-32 rounded-full bg-stone-100 dark:bg-slate-800" />
                                        <div className="mt-4 h-1.5 rounded-full bg-sky-400/80" style={{ width: '40%' }} />
                                    </div>
                                    <div className="absolute right-4 top-24 w-56 rotate-[4deg] rounded-2xl bg-stone-900 p-4 text-white shadow-2xl">
                                        <p className="text-[11px] text-white/50">Expected commission</p>
                                        <p className="mt-1 text-2xl font-semibold">₦ —</p>
                                        <p className="mt-2 text-[11px] text-sky-300">Submit an estate to estimate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Toolbar */}
                        <div className="rounded-2xl bg-white/80 p-2.5 shadow-sm ring-1 ring-stone-900/[0.04] backdrop-blur-sm dark:bg-white/[0.03] dark:ring-white/[0.06]">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[180px] flex-1">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search estates, contacts, locations…"
                                        aria-label="Search my estates"
                                        className="w-full rounded-xl bg-stone-50 py-2.5 pr-3 pl-9 text-[13px] text-stone-900 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-primary-200 dark:bg-white/5 dark:text-white dark:focus:ring-primary-800"
                                    />
                                </div>

                                <select
                                    value={savedView}
                                    onChange={(e) => setSavedView(e.target.value as SavedView)}
                                    aria-label="Saved views"
                                    className="rounded-xl bg-stone-50 py-2.5 pr-8 pl-3 text-[12px] font-medium text-stone-700 outline-none ring-1 ring-transparent dark:bg-white/5 dark:text-slate-200"
                                >
                                    <option value="all">All estates</option>
                                    <option value="attention">Needs attention</option>
                                    <option value="active">Active pipeline</option>
                                    <option value="won">Activated</option>
                                    <option value="lost">Rejected</option>
                                </select>

                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as SortKey)}
                                    aria-label="Sort"
                                    className="rounded-xl bg-stone-50 py-2.5 pr-8 pl-3 text-[12px] font-medium text-stone-700 outline-none dark:bg-white/5 dark:text-slate-200"
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="name">Name A–Z</option>
                                    <option value="houses">Most houses</option>
                                    <option value="stage">By stage</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setShowFilters((v) => !v)}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                                        showFilters || stateFilter || lgaFilter
                                            ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300'
                                            : 'bg-stone-50 text-stone-600 dark:bg-white/5 dark:text-slate-300'
                                    }`}
                                >
                                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                    Filters
                                </button>

                                <div
                                    className="inline-flex rounded-xl bg-stone-100 p-1 dark:bg-white/5"
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
                                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
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

                                <button
                                    type="button"
                                    onClick={() =>
                                        exportCsv(
                                            selectedIds.size
                                                ? filtered.filter((r) => selectedIds.has(r.id))
                                                : filtered,
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-50 px-3 py-2.5 text-[12px] font-semibold text-stone-600 transition hover:bg-stone-100 dark:bg-white/5 dark:text-slate-300"
                                >
                                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                    <span className="hidden md:inline">Export</span>
                                </button>
                            </div>

                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2.5 dark:border-white/10">
                                            <select
                                                value={stateFilter}
                                                onChange={(e) => {
                                                    setStateFilter(e.target.value);
                                                    setLgaFilter('');
                                                }}
                                                aria-label="Filter by state"
                                                className="rounded-xl bg-stone-50 py-2 pr-8 pl-3 text-[12px] font-medium dark:bg-white/5 dark:text-slate-200"
                                            >
                                                <option value="">All states</option>
                                                {states.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={lgaFilter}
                                                onChange={(e) => setLgaFilter(e.target.value)}
                                                aria-label="Filter by LGA"
                                                className="rounded-xl bg-stone-50 py-2 pr-8 pl-3 text-[12px] font-medium dark:bg-white/5 dark:text-slate-200"
                                            >
                                                <option value="">All LGAs</option>
                                                {lgas.map((l) => (
                                                    <option key={l} value={l}>
                                                        {l}
                                                    </option>
                                                ))}
                                            </select>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={clearFilters}
                                                    className="text-[12px] font-semibold text-primary-600 dark:text-primary-400"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {selectedIds.size > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary-50 px-3.5 py-2.5 text-[12px] font-medium text-primary-800 ring-1 ring-primary-500/15 dark:bg-primary-500/10 dark:text-primary-200">
                                <span>{selectedIds.size} selected</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => exportCsv(filtered.filter((r) => selectedIds.has(r.id)))}
                                        className="font-semibold underline-offset-2 hover:underline"
                                    >
                                        Export selection
                                    </button>
                                    <button type="button" onClick={() => setSelectedIds(new Set())} className="font-semibold">
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-[12px] text-stone-500 dark:text-slate-400">
                            Showing <span className="font-semibold text-stone-700 dark:text-slate-200">{filtered.length}</span> of{' '}
                            {partnerRequests.length} estates
                            {commissionInfo.rate && (
                                <>
                                    {' · '}
                                    Your rate{' '}
                                    <span className="font-semibold text-stone-700 dark:text-slate-200">
                                        {formatCommission(commissionInfo.rate, commissionInfo.type)}
                                    </span>
                                </>
                            )}
                        </p>

                        {filtered.length === 0 ? (
                            <div className="rounded-2xl bg-white/80 py-8 text-center dark:bg-white/[0.03]">
                                <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-stone-300 dark:text-slate-600" />
                                <p className="mt-3 text-[14px] font-semibold text-stone-800 dark:text-white">No estates match</p>
                                <p className="mt-1 text-[13px] text-stone-500">
                                    Try adjusting search, status, or saved view filters.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 text-[13px] font-semibold text-primary-600 dark:text-primary-400"
                                >
                                    Reset filters
                                </button>
                            </div>
                        ) : view === 'pipeline' ? (
                            <div className="flex gap-3 overflow-x-auto pb-3">
                                {columns.map((col) => {
                                    const items = byStatus[col.key] ?? [];
                                    const meta = stageMeta(col.key);

                                    return (
                                        <div
                                            key={col.key}
                                            className="flex w-[280px] shrink-0 flex-col rounded-2xl bg-stone-100/80 ring-1 ring-stone-900/[0.04] dark:bg-white/[0.025] dark:ring-white/[0.06]"
                                        >
                                            <div className="flex items-center justify-between px-3.5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${meta.bar}`} />
                                                    <h3 className="text-[12px] font-semibold text-stone-800 dark:text-slate-100">
                                                        {col.label}
                                                    </h3>
                                                </div>
                                                <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-stone-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
                                                    {items.length}
                                                </span>
                                            </div>
                                            <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3">
                                                {items.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed border-stone-200/80 px-3 py-8 text-center text-[11px] text-stone-400 dark:border-white/10">
                                                        No estates
                                                    </div>
                                                ) : (
                                                    items.map((request) => (
                                                        <EstateCard
                                                            key={request.id}
                                                            request={request}
                                                            onOpen={setSelected}
                                                            commission={commissionInfo}
                                                            compact
                                                            selected={selectedIds.has(request.id)}
                                                            onToggleSelect={toggleSelect}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : view === 'cards' ? (
                            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                                {filtered.map((request) => (
                                    <EstateCard
                                        key={request.id}
                                        request={request}
                                        onOpen={setSelected}
                                        commission={commissionInfo}
                                        selected={selectedIds.has(request.id)}
                                        onToggleSelect={toggleSelect}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-[13px]">
                                        <thead className="sticky top-0 z-10 bg-stone-50/95 text-[10px] font-semibold tracking-wide text-stone-500 uppercase backdrop-blur dark:bg-slate-900/90 dark:text-slate-400">
                                            <tr>
                                                <th className="px-3 py-3 text-left">
                                                    <span className="sr-only">Select</span>
                                                </th>
                                                <th className="px-3 py-3 text-left">Estate</th>
                                                <th className="px-3 py-3 text-left">Location</th>
                                                <th className="px-3 py-3 text-left">Contact</th>
                                                <th className="px-3 py-3 text-right">Houses</th>
                                                <th className="px-3 py-3 text-right">Est. commission</th>
                                                <th className="px-3 py-3 text-left">Stage</th>
                                                <th className="px-3 py-3 text-left">Submitted</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100 dark:divide-white/[0.05]">
                                            {filtered.map((request) => {
                                                const est = estimates(request, commissionInfo);

                                                return (
                                                    <tr
                                                        key={request.id}
                                                        onClick={() => setSelected(request)}
                                                        className="cursor-pointer transition hover:bg-stone-50/80 dark:hover:bg-white/[0.03]"
                                                    >
                                                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(request.id)}
                                                                onChange={() => toggleSelect(request.id)}
                                                                className="h-3.5 w-3.5 rounded border-stone-300 text-primary-600"
                                                                aria-label={`Select ${request.estate_name}`}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <p className="font-semibold text-stone-900 dark:text-white">
                                                                {request.estate_name}
                                                            </p>
                                                            {request.estate && (
                                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                                                    Live · {request.estate.name}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-stone-600 dark:text-slate-300">
                                                            {[request.lga, request.state].filter(Boolean).join(', ') || '—'}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <p className="text-stone-800 dark:text-slate-200">{request.chairman_name}</p>
                                                            <p className="text-[11px] text-stone-400">{request.chairman_email}</p>
                                                        </td>
                                                        <td className="px-3 py-3 text-right tabular-nums text-stone-700 dark:text-slate-300">
                                                            {est.houses || '—'}
                                                        </td>
                                                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
                                                            {est.commissionKobo != null
                                                                ? formatAmount(est.commissionKobo)
                                                                : '—'}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <StatusChip status={request.status} label={request.status_label} />
                                                        </td>
                                                        <td className="px-3 py-3 text-stone-500">
                                                            {formatDate(request.created_at)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AnimatePresence>
                {selected && (
                    <DetailDrawer
                        request={selected}
                        commission={commissionInfo}
                        onClose={() => setSelected(null)}
                    />
                )}
            </AnimatePresence>
        </PartnerLayout>
    );
}
