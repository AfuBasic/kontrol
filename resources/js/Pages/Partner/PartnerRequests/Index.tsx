import {
    BuildingOffice2Icon,
    FunnelIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    Squares2X2Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import EmptyState from '@/Components/Partner/EmptyState';
import PageHeader from '@/Components/Partner/PageHeader';
import PartnerLayout from '@/Layouts/PartnerLayout';

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
    rejection_reason: string | null;
    info_request_message: string | null;
    created_at: string;
    updated_at: string;
    estate?: { ulid: string; name: string; status: string } | null;
}

interface Column {
    key: string;
    label: string;
}

interface Props {
    partnerRequests: PartnerRequest[];
    columns: Column[];
    filters?: {
        search?: string;
        status?: string;
    };
}

type ViewMode = 'kanban' | 'list';

function statusBadgeClasses(status: string): string {
    switch (status) {
        case 'approved':
        case 'estate_created':
            return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300';
        case 'rejected':
            return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300';
        case 'info_requested':
            return 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300';
        case 'reviewing':
            return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300';
        case 'submitted':
            return 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-500/10 dark:text-primary-300';
        default:
            return 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300';
    }
}

function statusIcon(status: string): string {
    switch (status) {
        case 'approved':
        case 'estate_created':
            return '✓';
        case 'rejected':
            return '✕';
        case 'info_requested':
            return '!';
        case 'reviewing':
            return '…';
        default:
            return '•';
    }
}

function RequestCard({
    request,
    onOpen,
    compact = false,
}: {
    request: PartnerRequest;
    onOpen: (request: PartnerRequest) => void;
    compact?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={() => onOpen(request)}
            className={`w-full rounded-lg border border-stone-200/90 bg-white text-left shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-700 ${
                compact ? 'p-2.5' : 'p-3'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">{request.estate_name}</p>
                <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset capitalize ${statusBadgeClasses(request.status)}`}
                >
                    <span aria-hidden>{statusIcon(request.status)}</span>
                    {request.status_label}
                </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
                {request.chairman_name}
                {(request.state || request.lga) && (
                    <span>
                        {' · '}
                        {[request.lga, request.state].filter(Boolean).join(', ')}
                    </span>
                )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {request.number_of_houses != null && <span>{request.number_of_houses} houses</span>}
                <span>{new Date(request.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
            </div>
        </button>
    );
}

export default function PartnerRequestsIndex({ partnerRequests, columns, filters }: Props) {
    const [view, setView] = useState<ViewMode>(() => (partnerRequests.length >= 2 ? 'kanban' : 'list'));
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [selected, setSelected] = useState<PartnerRequest | null>(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return partnerRequests.filter((request) => {
            if (statusFilter && request.status !== statusFilter) {
                return false;
            }

            if (!q) {
                return true;
            }

            return (
                request.estate_name.toLowerCase().includes(q) ||
                request.chairman_name.toLowerCase().includes(q) ||
                (request.state ?? '').toLowerCase().includes(q) ||
                (request.lga ?? '').toLowerCase().includes(q)
            );
        });
    }, [partnerRequests, search, statusFilter]);

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

    return (
        <PartnerLayout fullWidth={view === 'kanban'}>
            <Head title="Estate Pipeline – Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
                <PageHeader
                    title="Estate pipeline"
                    description="Track every estate from submission through activation."
                    actions={
                        <Link
                            href="/partner/partner-requests/create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-primary-500 active:scale-[0.98]"
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Submit estate
                        </Link>
                    }
                />

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[200px] flex-1">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search estates, chairmen, locations…"
                            aria-label="Search estate pipeline"
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="relative">
                        <FunnelIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Filter by status"
                            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-8 pl-9 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">All statuses</option>
                            {columns.map((col) => (
                                <option key={col.key} value={col.key}>
                                    {col.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="View mode">
                        <button
                            type="button"
                            onClick={() => setView('kanban')}
                            aria-pressed={view === 'kanban'}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                view === 'kanban' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            <Squares2X2Icon className="h-4 w-4" />
                            Board
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            aria-pressed={view === 'list'}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                view === 'list' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            <ListBulletIcon className="h-4 w-4" />
                            List
                        </button>
                    </div>
                </div>

                {partnerRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <EmptyState
                            icon={BuildingOffice2Icon}
                            title="Your pipeline is empty"
                            description="You haven't submitted any estates yet. Referrals appear here as cards so you can track review, approval, and activation."
                            nextStep="Submit your first estate — our team typically reviews within a few business days."
                            action={{ label: 'Submit first estate', href: '/partner/partner-requests/create' }}
                            secondaryAction={{ label: 'How commissions work', href: '/partner/support' }}
                        />
                    </div>
                ) : view === 'kanban' ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {columns.map((col) => (
                            <div
                                key={col.key}
                                className="flex w-64 shrink-0 flex-col rounded-xl border border-stone-200/90 bg-stone-50/70 dark:border-slate-800 dark:bg-slate-900/50"
                            >
                                <div className="flex items-center justify-between border-b border-stone-200/80 px-2.5 py-2 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ring-1 ring-inset ${statusBadgeClasses(col.key)}`}
                                        >
                                            {(byStatus[col.key] ?? []).length}
                                        </span>
                                        <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase dark:text-slate-200">
                                            {col.label}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col gap-2 p-2">
                                    {(byStatus[col.key] ?? []).length === 0 ? (
                                        <p className="px-2 py-6 text-center text-xs text-slate-400">No cards</p>
                                    ) : (
                                        (byStatus[col.key] ?? []).map((request) => (
                                            <RequestCard key={request.id} request={request} onOpen={setSelected} compact />
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Desktop list */}
                        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            Estate
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            Houses
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            Submitted
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                                                No requests match your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((request) => (
                                            <tr
                                                key={request.id}
                                                className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                                onClick={() => setSelected(request)}
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900 dark:text-white">{request.estate_name}</p>
                                                    {request.estate && (
                                                        <p className="text-xs text-slate-500">Live: {request.estate.name}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {[request.lga, request.state].filter(Boolean).join(', ') || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {request.chairman_name}
                                                    <br />
                                                    <span className="text-xs text-slate-400">{request.chairman_email}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {request.number_of_houses ?? '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadgeClasses(request.status)}`}
                                                    >
                                                        <span aria-hidden>{statusIcon(request.status)}</span>
                                                        {request.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(request.created_at).toLocaleDateString('en-NG', {
                                                        dateStyle: 'medium',
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile list cards */}
                        <div className="space-y-3 md:hidden">
                            {filtered.length === 0 ? (
                                <p className="py-10 text-center text-sm text-slate-500">No requests match your filters.</p>
                            ) : (
                                filtered.map((request) => (
                                    <RequestCard key={request.id} request={request} onOpen={setSelected} />
                                ))
                            )}
                        </div>
                    </>
                )}
            </motion.div>

            {/* Detail drawer */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setSelected(null)}
                            aria-hidden
                        />
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="request-drawer-title"
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                <h2 id="request-drawer-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Estate details
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    aria-label="Close details"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                                <div>
                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Estate</p>
                                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{selected.estate_name}</p>
                                    <span
                                        className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadgeClasses(selected.status)}`}
                                    >
                                        <span aria-hidden>{statusIcon(selected.status)}</span>
                                        {selected.status_label}
                                    </span>
                                </div>

                                {selected.info_request_message && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                                        <p className="text-xs font-bold tracking-wide text-amber-800 uppercase dark:text-amber-300">
                                            Info requested
                                        </p>
                                        <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">{selected.info_request_message}</p>
                                    </div>
                                )}

                                {selected.rejection_reason && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
                                        <p className="text-xs font-bold tracking-wide text-red-800 uppercase dark:text-red-300">
                                            Rejection reason
                                        </p>
                                        <p className="mt-1 text-sm text-red-900 dark:text-red-100">{selected.rejection_reason}</p>
                                    </div>
                                )}

                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="col-span-2">
                                        <dt className="text-xs text-slate-500">Address</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                                            {selected.estate_address || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500">State / LGA</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                                            {[selected.lga, selected.state].filter(Boolean).join(', ') || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500">Houses</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                                            {selected.number_of_houses ?? '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500">Contact person</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{selected.chairman_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500">Phone</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                                            {selected.chairman_phone || '—'}
                                        </dd>
                                    </div>
                                    <div className="col-span-2">
                                        <dt className="text-xs text-slate-500">Email</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{selected.chairman_email}</dd>
                                    </div>
                                    {selected.notes && (
                                        <div className="col-span-2">
                                            <dt className="text-xs text-slate-500">Notes</dt>
                                            <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{selected.notes}</dd>
                                        </div>
                                    )}
                                    {selected.estate && (
                                        <div className="col-span-2">
                                            <dt className="text-xs text-slate-500">Live estate</dt>
                                            <dd className="mt-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                                                {selected.estate.name} ({selected.estate.status})
                                            </dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-xs text-slate-500">Submitted</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                                            {new Date(selected.created_at).toLocaleString('en-NG')}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-500">Updated</dt>
                                        <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">
                                            {new Date(selected.updated_at).toLocaleString('en-NG')}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </PartnerLayout>
    );
}
