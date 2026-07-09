import {
    ArrowRightIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    ChevronDownIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    RectangleStackIcon,
    Squares2X2Icon,
    TrashIcon,
    UserCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
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
type DrawerTab = 'overview' | 'timeline' | 'contact' | 'notes' | 'feedback';

/** ₦4,000/mo ARPU in kobo */
const EST_ARPU_KOBO = 400_000;

const STAGE_META: Record<string, { tone: string; bar: string; label: string; progress: number; dot: string }> = {
    submitted: {
        tone: 'text-sky-700 bg-sky-500/10 dark:text-sky-300',
        bar: 'bg-sky-500',
        label: 'Submitted',
        progress: 40,
        dot: 'bg-sky-500',
    },
    accepted: {
        tone: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        label: 'Accepted',
        progress: 100,
        dot: 'bg-emerald-500',
    },
    rejected: {
        tone: 'text-rose-700 bg-rose-500/10 dark:text-rose-300',
        bar: 'bg-rose-500',
        label: 'Rejected',
        progress: 0,
        dot: 'bg-rose-500',
    },
};

function stageMeta(status: string) {
    return STAGE_META[status] ?? STAGE_META.submitted;
}

function formatDate(iso: string | null | undefined, style: 'short' | 'full' = 'short'): string {
    if (!iso) {
        return '—';
    }
    const d = new Date(iso);
    if (style === 'full') {
        return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    }

    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function locationOf(r: PartnerRequest): string {
    return [r.lga, r.state].filter(Boolean).join(', ');
}

function nextAction(r: PartnerRequest): string {
    if (r.status === 'rejected') {
        return r.rejection_reason ? 'Rejected — see reason' : 'Rejected';
    }
    if (r.status === 'accepted') {
        if (r.is_generating_revenue) {
            return 'Generating commissions';
        }
        if (r.estate) {
            return 'Activated — residents can subscribe';
        }

        return 'Accepted — estate setup in progress';
    }
    if (r.info_request_message) {
        return 'Information requested by Kontrol';
    }

    return 'Waiting for review';
}

function estimates(request: PartnerRequest, commission?: { rate: string | null; type: string | null }) {
    const houses = request.number_of_houses ?? 0;
    const annualKobo = houses > 0 ? houses * EST_ARPU_KOBO * 12 : null;
    let commissionKobo: number | null = null;

    if (annualKobo && commission?.rate && commission.type !== 'fixed') {
        commissionKobo = Math.round((annualKobo * Number(commission.rate)) / 100);
    } else if (annualKobo && commission?.rate && commission.type === 'fixed') {
        commissionKobo = Number(commission.rate);
    }

    return { houses, commissionKobo };
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
    const meta = stageMeta(status);

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {label ?? meta.label}
        </span>
    );
}

/** Compact stage journey: Submitted → Accepted */
function StageJourney({ status }: { status: string }) {
    if (status === 'rejected') {
        return (
            <div className="flex items-center gap-2 text-[11px] text-rose-600 dark:text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Rejected
            </div>
        );
    }

    const steps = [
        { key: 'submitted', label: 'Submitted' },
        { key: 'accepted', label: 'Accepted' },
    ];
    const current = status === 'accepted' ? 1 : 0;

    return (
        <div className="flex items-center gap-1.5">
            {steps.map((step, i) => {
                const done = current >= i;
                const active = current === i;

                return (
                    <div key={step.key} className="flex items-center gap-1.5">
                        {i > 0 && (
                            <span
                                className={`h-px w-5 sm:w-7 ${done ? 'bg-emerald-400' : 'bg-stone-200 dark:bg-slate-700'}`}
                                aria-hidden
                            />
                        )}
                        <span className="flex items-center gap-1">
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    done
                                        ? active
                                            ? 'bg-emerald-500 ring-2 ring-emerald-500/25'
                                            : 'bg-emerald-500'
                                        : 'bg-stone-200 dark:bg-slate-600'
                                }`}
                            />
                            <span
                                className={`text-[10px] font-medium ${
                                    active
                                        ? 'text-stone-800 dark:text-white'
                                        : done
                                          ? 'text-stone-500'
                                          : 'text-stone-300 dark:text-slate-600'
                                }`}
                            >
                                {step.label}
                            </span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function matchesQuery(r: PartnerRequest, q: string): boolean {
    if (!q) {
        return true;
    }
    const hay = [
        r.estate_name,
        r.chairman_name,
        r.chairman_email,
        r.chairman_phone ?? '',
        r.state ?? '',
        r.lga ?? '',
        r.estate_address ?? '',
    ]
        .join(' ')
        .toLowerCase();

    return hay.includes(q);
}

/* ─── Command search ─── */
function EstateCommandSearch({
    estates,
    value,
    onChange,
    onSelect,
}: {
    estates: PartnerRequest[];
    value: string;
    onChange: (v: string) => void;
    onSelect: (r: PartnerRequest) => void;
}) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestions = useMemo(() => {
        const q = value.trim().toLowerCase();
        if (!q) {
            return [];
        }

        return estates.filter((r) => matchesQuery(r, q)).slice(0, 8);
    }, [estates, value]);

    useEffect(() => {
        setActiveIndex(0);
    }, [value]);

    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDown);

        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    function onKeyDown(e: React.KeyboardEvent) {
        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter') && suggestions.length) {
            setOpen(true);

            return;
        }
        if (!open) {
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && suggestions[activeIndex]) {
            e.preventDefault();
            onSelect(suggestions[activeIndex]);
            setOpen(false);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }

    return (
        <div className="relative min-w-0 flex-1" ref={rootRef}>
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
                ref={inputRef}
                type="search"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder="Search estates, contacts, locations…"
                aria-label="Search estates"
                aria-expanded={open && suggestions.length > 0}
                aria-controls="estate-search-results"
                autoComplete="off"
                className="w-full rounded-2xl bg-white py-2.5 pr-3 pl-10 text-[13.5px] text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.04)] outline-none ring-1 ring-stone-900/[0.06] transition placeholder:text-stone-400 focus:ring-2 focus:ring-primary-200 dark:bg-white/[0.04] dark:text-white dark:ring-white/10 dark:focus:ring-primary-800"
            />

            <AnimatePresence>
                {open && value.trim() && (
                    <motion.div
                        id="estate-search-results"
                        role="listbox"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-900/10 dark:bg-slate-900 dark:ring-white/10"
                    >
                        {suggestions.length === 0 ? (
                            <p className="px-4 py-6 text-center text-[13px] text-stone-500">No estates match “{value.trim()}”</p>
                        ) : (
                            <ul className="max-h-80 overflow-y-auto py-1.5">
                                {suggestions.map((r, i) => (
                                    <li key={r.id} role="option" aria-selected={i === activeIndex}>
                                        <button
                                            type="button"
                                            onMouseEnter={() => setActiveIndex(i)}
                                            onClick={() => {
                                                onSelect(r);
                                                setOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition ${
                                                i === activeIndex
                                                    ? 'bg-stone-50 dark:bg-white/[0.06]'
                                                    : 'hover:bg-stone-50/80 dark:hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-stone-900 dark:text-white">
                                                    {r.estate_name}
                                                </p>
                                                <p className="mt-0.5 truncate text-[11px] text-stone-500">
                                                    {locationOf(r) || '—'} · {r.chairman_name}
                                                </p>
                                            </div>
                                            <StatusBadge status={r.status} label={r.status_label} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="border-t border-stone-100 px-3 py-1.5 text-[10px] text-stone-400 dark:border-white/10">
                            <kbd className="rounded bg-stone-100 px-1 py-0.5 font-mono dark:bg-white/10">↑↓</kbd> navigate
                            <span className="mx-1.5">·</span>
                            <kbd className="rounded bg-stone-100 px-1 py-0.5 font-mono dark:bg-white/10">↵</kbd> open
                            <span className="mx-1.5">·</span>
                            <kbd className="rounded bg-stone-100 px-1 py-0.5 font-mono dark:bg-white/10">esc</kbd> close
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Estate opportunity card ─── */
function EstateOpportunity({
    request,
    onOpen,
    commission,
    dense = false,
}: {
    request: PartnerRequest;
    onOpen: (r: PartnerRequest) => void;
    commission?: { rate: string | null; type: string | null };
    dense?: boolean;
}) {
    const est = estimates(request, commission);
    const loc = locationOf(request);
    const action = nextAction(request);

    return (
        <motion.button
            type="button"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpen(request)}
            className={`group w-full rounded-2xl bg-white text-left shadow-[0_1px_2px_rgba(28,25,23,0.04)] ring-1 ring-stone-900/[0.04] transition hover:shadow-[0_12px_28px_-16px_rgba(28,25,23,0.18)] hover:ring-stone-900/[0.08] dark:bg-white/[0.035] dark:shadow-none dark:ring-white/[0.06] dark:hover:ring-white/12 ${
                dense ? 'p-3' : 'p-4'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className={`truncate font-semibold tracking-tight text-stone-900 dark:text-white ${dense ? 'text-[13px]' : 'text-[15px]'}`}>
                        {request.estate_name}
                    </p>
                    {loc && <p className="mt-0.5 truncate text-[11px] text-stone-400">{loc}</p>}
                </div>
                <StatusBadge status={request.status} label={request.status_label} />
            </div>

            <div className="mt-3">
                <StageJourney status={request.status} />
            </div>

            <div className={`mt-3 grid gap-2 ${dense ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                    <p className="text-[10px] text-stone-400">Contact</p>
                    <p className="truncate text-[12px] font-medium text-stone-700 dark:text-slate-200">{request.chairman_name}</p>
                </div>
                {!dense && (
                    <div>
                        <p className="text-[10px] text-stone-400">Houses</p>
                        <p className="text-[12px] font-medium tabular-nums text-stone-700 dark:text-slate-200">
                            {est.houses || '—'}
                        </p>
                    </div>
                )}
            </div>

            {request.status === 'rejected' && request.rejection_reason && (
                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-rose-600 dark:text-rose-400">
                    {request.rejection_reason}
                </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5 dark:border-white/[0.05]">
                <p className="truncate text-[11px] font-medium text-stone-500 dark:text-slate-400">{action}</p>
                <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-primary-600 opacity-0 transition group-hover:opacity-100 dark:text-primary-400">
                    Open
                    <ArrowRightIcon className="h-3 w-3" />
                </span>
            </div>

            {!dense && est.commissionKobo != null && request.status !== 'rejected' && (
                <p className="mt-1.5 text-[10px] text-stone-400">
                    Est. ~{formatAmount(est.commissionKobo)}
                    <span className="text-stone-300"> /yr</span>
                </p>
            )}
        </motion.button>
    );
}

/* ─── Detail drawer ─── */
function DetailDrawer({
    request,
    commission,
    onClose,
    onDeleted,
}: {
    request: PartnerRequest;
    commission?: { rate: string | null; type: string | null };
    onClose: () => void;
    onDeleted?: () => void;
}) {
    const [tab, setTab] = useState<DrawerTab>('overview');
    const [deleting, setDeleting] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const est = estimates(request, commission);
    const timeline = request.timeline ?? [];
    const adminNotes = request.admin_notes ?? [];
    const canSoftDelete = request.status === 'rejected';

    function confirmSoftDelete() {
        if (deleting || !canSoftDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/partner/partner-requests/${request.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmDeleteOpen(false);
                onDeleted?.();
                onClose();
            },
            onFinish: () => setDeleting(false),
        });
    }

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
                className="fixed inset-0 z-50 bg-stone-950/35 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden
            />
            <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 360 }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-[#faf9f7] shadow-2xl dark:bg-slate-950"
                role="dialog"
                aria-modal="true"
                aria-labelledby="estate-drawer-title"
            >
                <div className="border-b border-stone-200/70 bg-white px-5 py-5 dark:border-white/10 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-stone-400">Estate opportunity</p>
                            <h2 id="estate-drawer-title" className="mt-1 truncate text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                                {request.estate_name}
                            </h2>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <StatusBadge status={request.status} label={request.status_label} />
                                <span className="text-[12px] text-stone-500">{nextAction(request)}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-4">
                        <StageJourney status={request.status} />
                    </div>
                </div>

                <div className="flex gap-1 overflow-x-auto border-b border-stone-200/70 px-3 py-2 dark:border-white/10">
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
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-4"
                        >
                            {tab === 'overview' && (
                                <>
                                    {request.status === 'rejected' && (
                                        <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
                                            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                                                Rejection reason
                                            </p>
                                            <p className="mt-1.5 text-[13px] leading-relaxed text-rose-950 dark:text-rose-100">
                                                {request.rejection_reason || 'No reason was provided.'}
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                            <p className="text-[10px] text-stone-400">Houses</p>
                                            <p className="mt-1 text-[16px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {est.houses || '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                            <p className="text-[10px] text-stone-400">Est. commission</p>
                                            <p className="mt-1 text-[16px] font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {est.commissionKobo != null ? formatAmount(est.commissionKobo) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                        <p className="text-[10px] text-stone-400">Location</p>
                                        <p className="mt-1 text-[13px] font-medium text-stone-800 dark:text-slate-200">
                                            {request.estate_address || '—'}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-stone-500">{locationOf(request) || '—'}</p>
                                    </div>
                                    {request.estate && (
                                        <div className="rounded-2xl bg-emerald-50 p-3.5 dark:bg-emerald-500/10">
                                            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
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
                                <ol>
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
                                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-white/10">
                                            <UserCircleIcon className="h-5 w-5 text-stone-500" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold text-stone-900 dark:text-white">
                                                {request.chairman_name}
                                            </p>
                                            <p className="text-[13px] text-stone-500">{request.chairman_email}</p>
                                            <p className="text-[13px] text-stone-500">{request.chairman_phone || 'No phone'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tab === 'notes' && (
                                <div className="space-y-3">
                                    {request.notes ? (
                                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                                            <p className="text-[10px] text-stone-400">Your notes</p>
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
                                            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]"
                                        >
                                            <p className="text-[10px] text-stone-400">
                                                {note.creator_name || 'Kontrol'} · {formatDate(note.created_at)}
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
                                                <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
                                                    <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                                                        Rejection reason
                                                    </p>
                                                    <p className="mt-1.5 leading-relaxed text-rose-950 dark:text-rose-100">
                                                        {request.rejection_reason}
                                                    </p>
                                                </div>
                                            )}
                                            {request.info_request_message && (
                                                <div className="rounded-2xl bg-amber-50 p-3.5 dark:bg-amber-500/10">
                                                    {request.info_request_message}
                                                </div>
                                            )}
                                            {request.challenges && (
                                                <div className="rounded-2xl bg-white p-3.5 ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
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

                <div className="space-y-2 border-t border-stone-200/70 p-4 dark:border-white/10">
                    {canSoftDelete ? (
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteOpen(true)}
                            disabled={deleting}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2.5 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                            <TrashIcon className="h-4 w-4" />
                            Delete rejected estate
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-stone-900 py-2.5 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                    >
                        Close
                    </button>
                </div>
            </motion.aside>

            <ConfirmationModal
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    if (!deleting) {
                        setConfirmDeleteOpen(false);
                    }
                }}
                onConfirm={confirmSoftDelete}
                title="Remove rejected estate?"
                message={`“${request.estate_name}” will be removed from your list. You won’t see it again, but Kontrol keeps a copy for records.`}
                confirmLabel={deleting ? 'Removing…' : 'Remove from my list'}
                cancelLabel="Keep it"
                type="danger"
                isLoading={deleting}
            />
        </>
    );
}

/* ─── Page ─── */
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
    const [selected, setSelected] = useState<PartnerRequest | null>(null);

    useEffect(() => {
        localStorage.setItem('partner-estates-view', view);
    }, [view]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return partnerRequests.filter((r) => {
            if (statusFilter && r.status !== statusFilter) {
                return false;
            }

            return matchesQuery(r, q);
        });
    }, [partnerRequests, search, statusFilter]);

    const byStatus = useMemo(() => {
        const map: Record<string, PartnerRequest[]> = {};
        for (const col of columns) {
            map[col.key] = [];
        }
        for (const r of filtered) {
            if (!map[r.status]) {
                map[r.status] = [];
            }
            map[r.status].push(r);
        }

        return map;
    }, [filtered, columns]);

    const emptyPipelineCopy: Record<string, string> = {
        submitted: 'New referrals will land here while Kontrol reviews them.',
        accepted: 'Once accepted, estates appear here and can go live.',
        rejected: 'Rejected referrals will show here with a reason.',
    };

    return (
        <PartnerLayout fullWidth={view === 'pipeline'}>
            <Head title="My Estates – Partner Portal" />

            <div className="space-y-6 pb-4">
                {/* Commercial workspace header */}
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase dark:text-slate-500">
                            Commercial pipeline
                        </p>
                        <h1 className="mt-1 text-[1.65rem] font-semibold tracking-tight text-stone-900 dark:text-white">
                            My Estates
                        </h1>
                        <p className="mt-1 max-w-lg text-[13px] text-stone-500 dark:text-slate-400">
                            Manage every estate from first conversation to activation.
                        </p>
                    </div>
                    {commissionInfo.rate && (
                        <p className="text-[12px] text-stone-400">
                            Your rate{' '}
                            <span className="font-semibold text-stone-700 dark:text-slate-200">
                                {formatCommission(commissionInfo.rate, commissionInfo.type)}
                            </span>
                        </p>
                    )}
                </header>

                {/* Minimal controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <EstateCommandSearch
                        estates={partnerRequests}
                        value={search}
                        onChange={setSearch}
                        onSelect={setSelected}
                    />

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Status"
                            className="appearance-none rounded-2xl bg-white py-2.5 pr-9 pl-3.5 text-[13px] font-medium text-stone-700 shadow-[0_1px_2px_rgba(28,25,23,0.04)] outline-none ring-1 ring-stone-900/[0.06] dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10"
                        >
                            <option value="">All statuses</option>
                            <option value="submitted">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    </div>

                    <Link
                        href="/partner/partner-requests/create"
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-stone-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-stone-800 active:scale-[0.98] dark:bg-white dark:text-stone-900"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Submit estate</span>
                        <span className="sm:hidden">New</span>
                    </Link>
                </div>

                {partnerRequests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[1.75rem] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]"
                    >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600">
                            <BuildingOffice2Icon className="h-7 w-7" />
                        </div>
                        <h2 className="mt-5 text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                            Submit your first estate
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-stone-500">
                            Refer an estate to start your pipeline. Track review, acceptance, and when residents begin
                            generating commission.
                        </p>
                        <Link
                            href="/partner/partner-requests/create"
                            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Submit estate
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        {/* Content chrome: count + secondary view switch */}
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] text-stone-400">
                                <span className="font-semibold text-stone-700 dark:text-slate-200">{filtered.length}</span>
                                {filtered.length === 1 ? ' estate' : ' estates'}
                                {search.trim() ? ` matching “${search.trim()}”` : ''}
                            </p>
                            <div
                                className="inline-flex rounded-xl bg-stone-100/80 p-0.5 dark:bg-white/5"
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
                                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
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
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {filtered.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <MagnifyingGlassIcon className="mx-auto h-7 w-7 text-stone-300" />
                                        <p className="mt-3 text-[14px] font-semibold text-stone-800 dark:text-white">
                                            No estates match
                                        </p>
                                        <p className="mt-1 text-[13px] text-stone-500">Try a different search or status.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                setStatusFilter('');
                                            }}
                                            className="mt-4 text-[13px] font-semibold text-primary-600"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                ) : view === 'pipeline' ? (
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {columns.map((col) => {
                                            const items = byStatus[col.key] ?? [];
                                            const meta = stageMeta(col.key);

                                            return (
                                                <section key={col.key} className="flex w-[280px] shrink-0 flex-col">
                                                    <header className="mb-3 flex items-center gap-2 px-0.5">
                                                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                                                        <h2 className="text-[13px] font-semibold text-stone-800 dark:text-slate-100">
                                                            {col.label}
                                                        </h2>
                                                        <span className="text-[12px] tabular-nums text-stone-400">{items.length}</span>
                                                    </header>
                                                    <div className="flex flex-1 flex-col gap-2.5">
                                                        {items.length === 0 ? (
                                                            <div className="rounded-2xl px-4 py-10 text-center">
                                                                <p className="text-[13px] font-medium text-stone-500">
                                                                    No estates here
                                                                </p>
                                                                <p className="mt-1 text-[12px] leading-relaxed text-stone-400">
                                                                    {emptyPipelineCopy[col.key] ?? 'Nothing in this stage yet.'}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            items.map((request) => (
                                                                <EstateOpportunity
                                                                    key={request.id}
                                                                    request={request}
                                                                    onOpen={setSelected}
                                                                    commission={commissionInfo}
                                                                    dense
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                </section>
                                            );
                                        })}
                                    </div>
                                ) : view === 'cards' ? (
                                    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                                        {filtered.map((request) => (
                                            <EstateOpportunity
                                                key={request.id}
                                                request={request}
                                                onOpen={setSelected}
                                                commission={commissionInfo}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-stone-100 text-left text-[11px] font-medium text-stone-400 dark:border-white/10">
                                                        <th className="px-4 py-3 font-medium">Estate</th>
                                                        <th className="px-4 py-3 font-medium">Stage</th>
                                                        <th className="px-4 py-3 font-medium">Next</th>
                                                        <th className="px-4 py-3 font-medium text-right">Houses</th>
                                                        <th className="px-4 py-3 font-medium">Submitted</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filtered.map((request) => (
                                                        <tr
                                                            key={request.id}
                                                            onClick={() => setSelected(request)}
                                                            className="cursor-pointer border-b border-stone-50 transition last:border-0 hover:bg-stone-50/80 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
                                                        >
                                                            <td className="px-4 py-4">
                                                                <p className="text-[14px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                                                    {request.estate_name}
                                                                </p>
                                                                <p className="mt-0.5 text-[12px] text-stone-500">
                                                                    {locationOf(request) || '—'} · {request.chairman_name}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="space-y-1.5">
                                                                    <StatusBadge
                                                                        status={request.status}
                                                                        label={request.status_label}
                                                                    />
                                                                    <StageJourney status={request.status} />
                                                                </div>
                                                            </td>
                                                            <td className="max-w-[180px] px-4 py-4 text-[12px] text-stone-600 dark:text-slate-300">
                                                                {nextAction(request)}
                                                            </td>
                                                            <td className="px-4 py-4 text-right text-[13px] tabular-nums text-stone-700 dark:text-slate-200">
                                                                {request.number_of_houses ?? '—'}
                                                            </td>
                                                            <td className="px-4 py-4 text-[12px] text-stone-400">
                                                                {formatDate(request.created_at)}
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

            <AnimatePresence>
                {selected && (
                    <DetailDrawer
                        request={selected}
                        commission={commissionInfo}
                        onClose={() => setSelected(null)}
                        onDeleted={() => setSelected(null)}
                    />
                )}
            </AnimatePresence>
        </PartnerLayout>
    );
}
