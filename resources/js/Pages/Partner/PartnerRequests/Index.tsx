import {
    ArrowRightIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ClipboardDocumentIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisHorizontalIcon,
    LinkIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission } from '@/Utils/money';

/* ─── Types ─── */

interface TimelineEvent {
    id: number | string;
    event_type: string;
    description: string;
    creator_name: string | null;
    created_at: string | null;
}

interface Referral {
    id: number;
    reference: string;
    estate_name: string;
    estate_address: string | null;
    chairman_name: string;
    chairman_email: string;
    chairman_phone: string | null;
    state: string | null;
    lga: string | null;
    status: string;
    status_label: string;
    stage: string;
    stage_label: string;
    rejection_reason: string | null;
    info_request_message: string | null;
    created_at: string;
    assigned_manager?: { name: string } | null;
    estate?: { id: number; ulid: string; name: string; status: string } | null;
    latest_activity: string;
    expected_next_step: string;
    timeline: TimelineEvent[];
}

interface PortfolioEstate {
    id: number;
    ulid: string;
    reference: string;
    name: string;
    email: string | null;
    address: string | null;
    location: string | null;
    chairman_name: string | null;
    chairman_email: string | null;
    portfolio_status: string;
    status_label: string;
    counts: {
        residents: number;
        subscribed: number;
        security: number;
        admins: number;
        members: number;
    };
    commission: {
        earned_kobo: number;
        pending_kobo: number;
        monthly_revenue_kobo: number;
    };
    progress: number;
    recent_activity: string;
    href: string;
    earnings_href: string;
}

interface PortfolioSummary {
    connected_estates: number;
    active_estates: number;
    residents: number;
    monthly_revenue_kobo: number;
    lifetime_commission_kobo: number;
    pending_settlement_kobo: number;
}

interface Props {
    partnerRequests?: Referral[];
    referrals?: Referral[];
    estates?: PortfolioEstate[];
    portfolio?: PortfolioSummary;
    activeTab?: 'estates' | 'referrals' | 'requests';
    commission?: { rate: string | null; type: string | null };
    filters?: { search?: string; status?: string; tab?: string };
    statusOptions?: { value: string; label: string }[];
}

type PageTab = 'estates' | 'referrals';

const REFERRAL_FLOW = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'info_requested', label: 'Info Requested' },
    { key: 'accepted', label: 'Approved' },
] as const;

const emptyPortfolio: PortfolioSummary = {
    connected_estates: 0,
    active_estates: 0,
    residents: 0,
    monthly_revenue_kobo: 0,
    lifetime_commission_kobo: 0,
    pending_settlement_kobo: 0,
};

/* ─── Helpers ─── */

function formatDate(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusTone(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20';
        case 'pending':
            return 'bg-amber-500/15 text-amber-200 ring-amber-400/20';
        case 'under_review':
            return 'bg-sky-500/15 text-sky-200 ring-sky-400/20';
        case 'suspended':
            return 'bg-rose-500/15 text-rose-200 ring-rose-400/20';
        case 'archived':
            return 'bg-white/10 text-white/55 ring-white/10';
        case 'rejected':
            return 'bg-rose-500/15 text-rose-300 ring-rose-400/25';
        case 'accepted':
            return 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20';
        case 'info_requested':
            return 'bg-amber-500/15 text-amber-200 ring-amber-400/20';
        default:
            return 'bg-primary-500/15 text-sky-200 ring-primary-400/20';
    }
}

function matchesEstate(estate: PortfolioEstate, q: string): boolean {
    if (!q) {
        return true;
    }
    const hay = [
        estate.name,
        estate.chairman_name,
        estate.location,
        estate.address,
        estate.reference,
        estate.ulid,
        estate.status_label,
        estate.portfolio_status,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return hay.includes(q);
}

/* ─── Estate command search ─── */

function EstateCommandSearch({
    estates,
    value,
    onChange,
    onSelect,
}: {
    estates: PortfolioEstate[];
    value: string;
    onChange: (v: string) => void;
    onSelect: (e: PortfolioEstate) => void;
}) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);

    const suggestions = useMemo(() => {
        const q = value.trim().toLowerCase();
        if (!q) {
            return estates.slice(0, 6);
        }

        return estates.filter((e) => matchesEstate(e, q)).slice(0, 8);
    }, [estates, value]);

    useEffect(() => {
        setActiveIndex(0);
    }, [value, open]);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDoc);

        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    return (
        <div ref={rootRef} className="relative min-w-[220px] flex-1 sm:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
                type="search"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                        setOpen(true);
                        return;
                    }
                    if (e.key === 'Escape') {
                        setOpen(false);
                        return;
                    }
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveIndex((i) => Math.min(i + 1, Math.max(0, suggestions.length - 1)));
                    }
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveIndex((i) => Math.max(i - 1, 0));
                    }
                    if (e.key === 'Enter' && suggestions[activeIndex]) {
                        e.preventDefault();
                        onSelect(suggestions[activeIndex]);
                        setOpen(false);
                    }
                }}
                placeholder="Search estates…"
                aria-label="Search estates"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pr-4 pl-10 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20"
            />
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1224] shadow-2xl shadow-black/40"
                    >
                        {suggestions.length === 0 ? (
                            <p className="px-4 py-6 text-center text-[13px] text-white/40">No estates match</p>
                        ) : (
                            <ul className="max-h-72 overflow-y-auto py-1.5">
                                {suggestions.map((estate, i) => (
                                    <li key={estate.id}>
                                        <button
                                            type="button"
                                            onMouseEnter={() => setActiveIndex(i)}
                                            onClick={() => {
                                                onSelect(estate);
                                                setOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                                                i === activeIndex ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-white">{estate.name}</p>
                                                <p className="mt-0.5 truncate text-[11px] text-white/40">
                                                    {estate.location || estate.reference} · {estate.chairman_name || '—'}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusTone(estate.portfolio_status)}`}>
                                                {estate.status_label}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Referral timeline drawer ─── */

function ReferralTimelineDrawer({
    referral,
    onClose,
    onDeleted,
}: {
    referral: Referral;
    onClose: () => void;
    onDeleted?: () => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const canDelete = referral.status === 'rejected';
    const events = [...(referral.timeline ?? [])].reverse();

    useEffect(() => {
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
    }, [onClose]);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm" onClick={onClose} />
            <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 360 }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-[#faf9f7] shadow-2xl dark:bg-slate-950"
            >
                <div className="border-b border-stone-200/70 bg-white px-5 py-5 dark:border-white/10 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-stone-400">Referral timeline</p>
                            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-stone-900 dark:text-white">
                                {referral.estate_name}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusTone(referral.stage)}`}>
                                    {referral.stage_label}
                                </span>
                                <span className="text-[12px] text-stone-400">{referral.reference}</span>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-6">
                    <div className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04]">
                        <p className="text-[11px] font-semibold text-stone-500">Expected next step</p>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-stone-800 dark:text-slate-200">{referral.expected_next_step}</p>
                    </div>

                    <ol className="space-y-0">
                        {events.map((event, i) => {
                            const isLast = i === events.length - 1;

                            return (
                                <motion.li
                                    key={String(event.id)}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex gap-3"
                                >
                                    <div className="flex w-4 shrink-0 flex-col items-center">
                                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500 ring-4 ring-primary-500/15" />
                                        {!isLast ? (
                                            <span className="mt-1 w-px flex-1 min-h-[1.5rem] bg-stone-200 dark:bg-white/15" />
                                        ) : null}
                                    </div>
                                    <div className={`min-w-0 ${isLast ? 'pb-0' : 'pb-7'}`}>
                                        <p className="text-[14px] font-semibold leading-snug text-stone-900 dark:text-white">
                                            {event.description}
                                        </p>
                                        <p className="mt-1 text-[12px] text-stone-400">
                                            {formatDate(event.created_at)}
                                            {event.creator_name ? ` · ${event.creator_name}` : ''}
                                        </p>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </ol>
                </div>

                <div className="space-y-2 border-t border-stone-200/70 p-4 dark:border-white/10">
                    {canDelete ? (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2.5 text-[13px] font-semibold text-rose-700 dark:border-rose-500/30 dark:text-rose-300"
                        >
                            <TrashIcon className="h-4 w-4" />
                            Remove rejected referral
                        </button>
                    ) : null}
                    <button type="button" onClick={onClose} className="w-full rounded-xl bg-stone-900 py-2.5 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900">
                        Close
                    </button>
                </div>
            </motion.aside>

            <ConfirmationModal
                isOpen={confirmDelete}
                onClose={() => !deleting && setConfirmDelete(false)}
                onConfirm={() => {
                    setDeleting(true);
                    router.delete(`/partner/partner-requests/${referral.id}`, {
                        preserveScroll: true,
                        onSuccess: () => {
                            setConfirmDelete(false);
                            onDeleted?.();
                            onClose();
                        },
                        onFinish: () => setDeleting(false),
                    });
                }}
                title="Remove rejected referral?"
                message={`“${referral.estate_name}” will leave your referrals list. Kontrol keeps a record.`}
                confirmLabel={deleting ? 'Removing…' : 'Remove'}
                type="danger"
                isLoading={deleting}
            />
        </>
    );
}

/* ─── Page ─── */

export default function PartnerRequestsIndex({
    partnerRequests,
    referrals,
    estates = [],
    portfolio = emptyPortfolio,
    activeTab = 'estates',
    commission,
    filters,
    statusOptions = [],
}: Props) {
    const page = usePage();
    const sharedCommission = (page.props as { partnerContext?: { commission_rate: string | null; commission_type: string | null } })
        .partnerContext;
    const commissionInfo = commission ?? {
        rate: sharedCommission?.commission_rate ?? null,
        type: sharedCommission?.commission_type ?? null,
    };

    const referralList = referrals ?? partnerRequests ?? [];
    const initialTab: PageTab =
        activeTab === 'referrals' || activeTab === 'requests' || filters?.tab === 'referrals' || filters?.tab === 'requests'
            ? 'referrals'
            : 'estates';

    const [tab, setTab] = useState<PageTab>(initialTab);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    useEffect(() => {
        setTab(initialTab);
    }, [initialTab]);

    const filteredEstates = useMemo(() => {
        const q = search.trim().toLowerCase();

        return estates.filter((estate) => {
            if (statusFilter && estate.portfolio_status !== statusFilter) {
                return false;
            }

            return matchesEstate(estate, q);
        });
    }, [estates, search, statusFilter]);

    const referralsByStage = useMemo(() => {
        const map: Record<string, Referral[]> = {};
        for (const col of REFERRAL_FLOW) {
            map[col.key] = [];
        }
        map.rejected = [];
        for (const r of referralList) {
            const key = r.stage || r.status;
            if (!map[key]) {
                map[key] = [];
            }
            map[key].push(r);
        }

        return map;
    }, [referralList]);

    function switchTab(next: PageTab) {
        setTab(next);
        setSearch('');
        setStatusFilter('');
        setSelectedReferral(null);
        router.get(
            '/partner/partner-requests',
            { tab: next === 'estates' ? undefined : next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    async function copyEstateLink(estate: PortfolioEstate) {
        const url = `${window.location.origin}${estate.href}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // ignore
        }
        setMenuOpenId(null);
    }

    const kpis = [
        { label: 'Connected Estates', value: String(portfolio.connected_estates) },
        { label: 'Active Estates', value: String(portfolio.active_estates) },
        { label: 'Residents', value: String(portfolio.residents) },
        { label: 'Monthly Revenue', value: formatAmount(portfolio.monthly_revenue_kobo) },
        { label: 'Lifetime Commission', value: formatAmount(portfolio.lifetime_commission_kobo) },
        { label: 'Pending Settlement', value: formatAmount(portfolio.pending_settlement_kobo) },
    ];

    return (
        <PartnerLayout fullWidth>
            <Head title="My Estates – Partner Portal" />

            <div className="space-y-7 pb-8">
                {/* Hero header */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[1.75rem] text-white shadow-[0_24px_64px_-28px_rgba(6,18,48,0.55)]"
                >
                    <div className="absolute inset-0 bg-[#061230]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,111,219,0.4),transparent_55%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.1),transparent_45%)]" />

                    <div className="relative px-5 py-7 sm:px-8 sm:py-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-white/40 uppercase">Portfolio</p>
                                <h1 className="mt-1.5 text-[1.85rem] font-semibold tracking-tight sm:text-[2.1rem]">My Estates</h1>
                                <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/50">
                                    Manage live estates as commercial assets — performance, residents, and commission in one place.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {commissionInfo.rate ? (
                                    <p className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] text-white/60">
                                        Your rate{' '}
                                        <span className="font-semibold text-white">
                                            {formatCommission(commissionInfo.rate, commissionInfo.type)}
                                        </span>
                                    </p>
                                ) : null}
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 shadow-sm transition hover:bg-sky-50"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Submit estate
                                </Link>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="mt-7 inline-flex rounded-2xl border border-white/10 bg-white/[0.06] p-1" role="tablist">
                            {(
                                [
                                    { key: 'estates' as const, label: 'Estates', count: estates.length },
                                    { key: 'referrals' as const, label: 'Referrals', count: referralList.length },
                                ] as const
                            ).map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === item.key}
                                    onClick={() => switchTab(item.key)}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition ${
                                        tab === item.key
                                            ? 'bg-white text-stone-900 shadow-sm'
                                            : 'text-white/55 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                    <span
                                        className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
                                            tab === item.key ? 'bg-stone-100 text-stone-700' : 'bg-white/10 text-white/60'
                                        }`}
                                    >
                                        {item.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {tab === 'estates' ? (
                    <>
                        {/* KPI pills */}
                        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {kpis.map((kpi, i) => (
                                <motion.div
                                    key={kpi.label}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.03 * i }}
                                    className="min-w-[9.5rem] shrink-0 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_0_rgba(28,25,23,0.04),0_12px_28px_-22px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/[0.04] dark:bg-white/[0.04] dark:ring-white/[0.07]"
                                >
                                    <p className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">{kpi.label}</p>
                                    <p className="mt-1 text-[15px] font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white">
                                        {kpi.value}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Search + status */}
                        <div className="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-stone-900/[0.05] bg-[#0b1224] p-2.5 shadow-sm dark:border-white/10">
                            <EstateCommandSearch
                                estates={estates}
                                value={search}
                                onChange={setSearch}
                                onSelect={(estate) => router.visit(estate.href)}
                            />
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    aria-label="Status"
                                    className="appearance-none rounded-xl border border-white/10 bg-white/[0.06] py-3 pr-9 pl-3.5 text-[13px] font-medium text-white outline-none"
                                >
                                    {(statusOptions.length
                                        ? statusOptions
                                        : [
                                              { value: '', label: 'All' },
                                              { value: 'active', label: 'Active' },
                                              { value: 'pending', label: 'Pending' },
                                              { value: 'under_review', label: 'Under Review' },
                                              { value: 'suspended', label: 'Suspended' },
                                              { value: 'archived', label: 'Archived' },
                                          ]
                                    ).map((opt) => (
                                        <option key={opt.value || 'all'} value={opt.value} className="text-stone-900">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                            </div>
                        </div>

                        {estates.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-[#061230] via-[#0a1a3a] to-[#0c274f] px-6 py-16 text-center text-white shadow-[0_24px_64px_-28px_rgba(6,18,48,0.5)]"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                                <div className="relative">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                                        <BuildingOffice2Icon className="h-8 w-8 text-sky-200" />
                                    </div>
                                    <h2 className="mt-6 text-2xl font-semibold tracking-tight">No estates yet</h2>
                                    <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-white/55">
                                        Start by submitting your first estate. Once approved, it appears here as a portfolio asset you can follow.
                                    </p>
                                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                        <Link
                                            href="/partner/partner-requests/create"
                                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[13px] font-semibold text-stone-900"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            Submit Estate
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => switchTab('referrals')}
                                            className="text-[13px] font-semibold text-sky-200/90 underline-offset-4 hover:underline"
                                        >
                                            How referrals work
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : filteredEstates.length === 0 ? (
                            <div className="rounded-[1.5rem] bg-white px-6 py-14 text-center ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03]">
                                <MagnifyingGlassIcon className="mx-auto h-7 w-7 text-stone-300" />
                                <p className="mt-3 text-[15px] font-semibold text-stone-900 dark:text-white">No estates match</p>
                                <p className="mt-1 text-[13px] text-stone-500">Try another search or status.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setStatusFilter('');
                                    }}
                                    className="mt-4 text-[13px] font-semibold text-primary-600"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-5 lg:grid-cols-2">
                                {filteredEstates.map((estate, index) => (
                                    <motion.article
                                        key={estate.id}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.04, 0.24) }}
                                        whileHover={{ y: -3 }}
                                        className="group relative overflow-hidden rounded-[1.5rem] bg-white p-6 shadow-[0_1px_0_rgba(28,25,23,0.04),0_24px_48px_-28px_rgba(28,25,23,0.22)] ring-1 ring-stone-900/[0.05] transition dark:bg-white/[0.035] dark:ring-white/[0.07]"
                                    >
                                        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary-500/[0.07] blur-3xl" />

                                        <div className="relative flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-[1.35rem] font-semibold tracking-tight text-stone-900 dark:text-white">
                                                        {estate.name}
                                                    </h3>
                                                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${statusTone(estate.portfolio_status)}`}>
                                                        {estate.status_label}
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-[13px] text-stone-500">
                                                    {estate.location || estate.address || 'Location pending'}
                                                    {estate.chairman_name ? ` · ${estate.chairman_name}` : ''}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium tracking-wide text-stone-400 uppercase">
                                                    {estate.reference}
                                                </p>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setMenuOpenId(menuOpenId === estate.id ? null : estate.id)}
                                                    className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10"
                                                    aria-label="More actions"
                                                >
                                                    <EllipsisHorizontalIcon className="h-5 w-5" />
                                                </button>
                                                {menuOpenId === estate.id ? (
                                                    <div className="absolute top-10 right-0 z-20 w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-slate-900">
                                                        {[
                                                            { label: 'Open Estate', href: estate.href },
                                                            { label: 'View Commission', href: estate.earnings_href },
                                                        ].map((item) => (
                                                            <Link
                                                                key={item.label}
                                                                href={item.href}
                                                                className="block px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-50 dark:text-slate-200 dark:hover:bg-white/5"
                                                                onClick={() => setMenuOpenId(null)}
                                                            >
                                                                {item.label}
                                                            </Link>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => copyEstateLink(estate)}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50 dark:text-slate-200 dark:hover:bg-white/5"
                                                        >
                                                            <LinkIcon className="h-3.5 w-3.5" />
                                                            Copy Estate Link
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            {[
                                                { label: 'Residents', value: estate.counts.residents, icon: UsersIcon },
                                                { label: 'Subscribed', value: estate.counts.subscribed, icon: UserGroupIcon },
                                                {
                                                    label: 'Revenue',
                                                    value: formatAmount(estate.commission.monthly_revenue_kobo),
                                                    icon: ChartBarIcon,
                                                },
                                                {
                                                    label: 'Commission',
                                                    value: formatAmount(estate.commission.earned_kobo),
                                                    icon: BanknotesIcon,
                                                },
                                            ].map((cell) => (
                                                <div
                                                    key={cell.label}
                                                    className="rounded-2xl bg-stone-50/90 px-3 py-3 ring-1 ring-stone-900/[0.03] dark:bg-white/[0.04] dark:ring-white/[0.05]"
                                                >
                                                    <div className="flex items-center gap-1.5 text-stone-400">
                                                        <cell.icon className="h-3.5 w-3.5" />
                                                        <p className="text-[10px] font-medium tracking-wide uppercase">{cell.label}</p>
                                                    </div>
                                                    <p className="mt-1.5 text-[15px] font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white">
                                                        {cell.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="relative mt-5">
                                            <div className="mb-1.5 flex items-center justify-between text-[11px] text-stone-400">
                                                <span>Progress</span>
                                                <span className="font-semibold tabular-nums text-stone-600 dark:text-slate-300">
                                                    {estate.progress}%
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                                                <motion.div
                                                    className="h-full rounded-full bg-linear-to-r from-primary-500 to-sky-400"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${estate.progress}%` }}
                                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                />
                                            </div>
                                            <p className="mt-2 text-[12px] text-stone-500">{estate.recent_activity}</p>
                                        </div>

                                        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-5 dark:border-white/[0.06]">
                                            <Link
                                                href={estate.href}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-[12px] font-semibold text-white dark:bg-white dark:text-stone-900"
                                            >
                                                Open Estate
                                                <ArrowRightIcon className="h-3.5 w-3.5" />
                                            </Link>
                                            <Link
                                                href={estate.earnings_href}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-stone-700 dark:border-white/10 dark:bg-transparent dark:text-slate-200"
                                            >
                                                View Earnings
                                            </Link>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-medium text-stone-400">
                                                <ClockIcon className="h-3.5 w-3.5" />
                                                Timeline
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-medium text-stone-400">
                                                <DocumentTextIcon className="h-3.5 w-3.5" />
                                                Documents
                                            </span>
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* ─── Referrals workflow ─── */
                    <div className="space-y-6">
                        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06] sm:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                {REFERRAL_FLOW.map((step, i) => (
                                    <div key={step.key} className="flex items-center gap-2">
                                        <div className="rounded-full bg-stone-100 px-3 py-1.5 text-[12px] font-semibold text-stone-700 dark:bg-white/10 dark:text-slate-200">
                                            {step.label}
                                            <span className="ml-1.5 tabular-nums text-stone-400">
                                                {(referralsByStage[step.key] ?? []).length}
                                            </span>
                                        </div>
                                        {i < REFERRAL_FLOW.length - 1 ? (
                                            <ArrowRightIcon className="hidden h-3.5 w-3.5 text-stone-300 sm:block" />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-[13px] text-stone-500">
                                Referrals are temporary workflow items that convert into portfolio estates once approved.
                            </p>
                        </div>

                        {referralList.length === 0 ? (
                            <div className="rounded-[1.5rem] bg-white px-6 py-14 text-center ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03]">
                                <ClipboardDocumentIcon className="mx-auto h-8 w-8 text-stone-300" />
                                <h2 className="mt-4 text-xl font-semibold text-stone-900 dark:text-white">No referrals in flight</h2>
                                <p className="mx-auto mt-2 max-w-md text-[14px] text-stone-500">
                                    Submit an estate to start the review pipeline. You’ll see stage-by-stage progress here.
                                </p>
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Submit estate
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {referralList.map((referral, i) => (
                                    <motion.button
                                        key={referral.id}
                                        type="button"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.03, 0.2) }}
                                        onClick={() => setSelectedReferral(referral)}
                                        className="group flex w-full flex-col gap-3 rounded-[1.25rem] bg-white p-5 text-left shadow-[0_1px_0_rgba(28,25,23,0.04),0_16px_32px_-24px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/[0.035] dark:ring-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-[16px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                                    {referral.estate_name}
                                                </h3>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusTone(referral.stage)}`}>
                                                    {referral.stage_label}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[13px] text-stone-500">
                                                {referral.chairman_name}
                                                {referral.lga || referral.state
                                                    ? ` · ${[referral.lga, referral.state].filter(Boolean).join(', ')}`
                                                    : ''}
                                                {' · '}
                                                Submitted {formatDate(referral.created_at)}
                                            </p>
                                            <p className="mt-2 text-[12px] text-stone-400">
                                                <span className="font-medium text-stone-600 dark:text-slate-300">Latest · </span>
                                                {referral.latest_activity}
                                            </p>
                                            <p className="mt-1 text-[12px] text-stone-500">
                                                <span className="font-medium text-stone-600 dark:text-slate-300">Next · </span>
                                                {referral.expected_next_step}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                            {referral.assigned_manager?.name ? (
                                                <p className="text-[11px] text-stone-400">
                                                    Reviewer · {referral.assigned_manager.name}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-stone-400">Reviewer · Unassigned</p>
                                            )}
                                            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary-600 group-hover:gap-1.5">
                                                Open Timeline
                                                <ArrowRightIcon className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedReferral ? (
                    <ReferralTimelineDrawer
                        referral={selectedReferral}
                        onClose={() => setSelectedReferral(null)}
                        onDeleted={() => setSelectedReferral(null)}
                    />
                ) : null}
            </AnimatePresence>
        </PartnerLayout>
    );
}
