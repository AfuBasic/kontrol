import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Users, ShieldCheck, UserMinus, AlertCircle, Clock, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { bulkDelete, index } from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import SecurityActions from '@/Components/Admin/SecurityActions';
import SectionErrorBoundary from '@/Components/SectionErrorBoundary';
import { TableRowSkeleton } from '@/Components/Skeletons';
import { useDebounce } from '@/Hooks/useDebounce';
import { usePermission } from '@/Hooks/usePermission';
import AdminLayout from '@/Layouts/AdminLayout';

type SecurityPerson = {
    ulid: string;
    id: number;
    name: string;
    email: string;
    phone: string | null;
    badge_number: string | null;
    zone_id?: number | null;
    zone_name?: string | null;
    status: 'pending' | 'accepted' | 'inactive';
    suspended_at: string | null;
    created_at: string;
};

type PaginatedSecurity = {
    data: SecurityPerson[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    security?: PaginatedSecurity | null;
    filters: {
        search?: string;
        status?: string;
    };
    stats: {
        total: number;
        active: number;
        pending: number;
        inactive: number;
    };
    insights?: string[] | null;
};

export default function SecurityPersonnel({
    security: initialSecurity,
    filters: initialFilters,
    stats: initialStats,
    insights: initialInsights,
}: Props) {
    const { can } = usePermission();
    const filters = !Array.isArray(initialFilters) ? initialFilters || {} : {};
    const stats = initialStats || { total: 0, active: 0, pending: 0, inactive: 0 };
    const insights = initialInsights || [];
    const security = initialSecurity || { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0, links: [] };
    const isLoadingSecurity = initialSecurity === undefined;

    const hasSecurity = security.data.length > 0;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    // Apply filters
    const applyFilters = useCallback(
        (updatedFilters: Record<string, string>) => {
            router.get(
                index.url(),
                {
                    search,
                    status,
                    ...updatedFilters,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [search, status],
    );

    // Handle search debounce
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            applyFilters({ search: debouncedSearch });
        }
    }, [debouncedSearch]);

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'status') setStatus(value);
        applyFilters({ [key]: value });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(index.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const hasActiveFilters = Boolean(search || status);

    const toggleSelectAll = () => {
        if (selectedIds.length === security.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(security.data.map((s) => s.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        router.delete(bulkDelete.url(), {
            data: { ids: selectedIds },
            onSuccess: () => {
                setSelectedIds([]);
                setShowDeleteConfirm(false);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <>
            <Head title="Security Personnel" />

            {/* Top Workspace Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Security Workspace</h1>
                    <p className="text-xs font-semibold text-slate-500">Monitor guard status, manage badge allocations, and gate privileges.</p>
                </div>
                {can('security.create') && (
                    <Link
                        href={index.url() + '/create'}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4.5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <PlusIcon className="h-4 w-4" strokeWidth={3} />
                        Add Security Staff
                    </Link>
                )}
            </div>

            <div className="space-y-6">
                {/* SECTION 1 - STATS STRIP */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Total Personnel</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <Users className="h-4 w-4 shrink-0 text-blue-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Active Guards</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.active}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Pending Access</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.pending}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Suspended Guards</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <UserMinus className="h-4 w-4 shrink-0 text-rose-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.inactive}</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2 - INSIGHTS PANEL */}
                <Deferred data="insights" fallback={<div className="h-16 animate-pulse rounded-2xl bg-blue-50/40" />}>
                    {insights.length > 0 && (
                        <div className="rounded-2xl border border-blue-100/50 bg-linear-to-br from-blue-50/40 to-indigo-50/20 p-4.5 shadow-xs">
                            <div className="mb-2.5 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <h3 className="text-xs font-black tracking-wider text-blue-900 uppercase">Attention Required</h3>
                            </div>
                            <ul className="space-y-2">
                                {insights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-blue-950">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Deferred>

                {/* SECTION 3 - SEARCH & FILTERS */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search security personnel by name or email..."
                                className="w-full rounded-xl border-slate-200 py-3 pr-4 pl-11 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                            />
                        </div>

                        {/* Status dropdown */}
                        <div className="flex gap-2 sm:w-80">
                            <select
                                value={status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>

                            <button
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black tracking-wider text-slate-600 uppercase shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <X className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* SECTION 4 - TABLE */}
                <SectionErrorBoundary name="security-table">
                    <Deferred data="security" fallback={<TableRowSkeleton rows={6} columns={5} />}>
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50">
                            {isLoadingSecurity ? (
                                <TableRowSkeleton rows={6} columns={5} />
                            ) : hasSecurity ? (
                                <div className="min-h-[280px] overflow-x-auto">
                                    <table className="w-full table-auto border-collapse">
                                        <thead className="border-b border-slate-100 bg-slate-50/70">
                                            <tr>
                                                {can('security.delete') && (
                                                    <th className="w-10 px-4 py-3.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.length === security.data.length && security.data.length > 0}
                                                            onChange={toggleSelectAll}
                                                            className="border-slate-350 h-4 w-4 rounded text-slate-900 focus:ring-slate-900"
                                                        />
                                                    </th>
                                                )}
                                                <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                    Guards
                                                </th>
                                                <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                    Contact
                                                </th>
                                                <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                    Coverage / Zone
                                                </th>
                                                <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                    Badge #
                                                </th>
                                                <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                    Status
                                                </th>
                                                <th className="w-20 px-6 py-3.5 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {security.data.map((person, idx) => {
                                                const isSelected = selectedIds.includes(person.id);
                                                const initial = person.name ? person.name.charAt(0).toUpperCase() : 'S';

                                                // Soft premium colors for avatars
                                                const bgColors = [
                                                    'bg-blue-50 text-blue-700',
                                                    'bg-indigo-50 text-indigo-700',
                                                    'bg-purple-50 text-purple-700',
                                                    'bg-emerald-50 text-emerald-700',
                                                ];
                                                const avatarColor = bgColors[idx % bgColors.length];

                                                return (
                                                    <tr
                                                        key={person.id}
                                                        className={`group transition-colors hover:bg-slate-50/50 ${isSelected ? 'bg-slate-50/70' : ''}`}
                                                    >
                                                        {can('security.delete') && (
                                                            <td className="px-4 py-3.5 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelect(person.id)}
                                                                    className="border-slate-350 h-4 w-4 rounded text-slate-900 focus:ring-slate-900"
                                                                />
                                                            </td>
                                                        )}

                                                        {/* Avatar & Name */}
                                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${avatarColor}`}
                                                                >
                                                                    {initial}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <Link
                                                                        href={`/admin/residents/${person.id}`}
                                                                        className="block max-w-[150px] truncate text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline"
                                                                    >
                                                                        {person.name}
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Contact */}
                                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                                            <div className="text-xs font-semibold text-slate-800">
                                                                <span className="block max-w-[180px] truncate">{person.email}</span>
                                                                <span className="mt-0.5 block text-[10px] font-bold text-slate-400">
                                                                    {person.phone || '-'}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Coverage / Zone */}
                                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${person.zone_name && person.zone_name !== 'Entire estate' ? 'border border-blue-100 bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
                                                            >
                                                                {person.zone_name || 'Entire estate'}
                                                            </span>
                                                        </td>
                                                        {/* Badge */}
                                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                                            <span className="border-slate-150 inline-flex rounded-full border bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700">
                                                                {person.badge_number || '-'}
                                                            </span>
                                                        </td>

                                                        {/* Status Badge */}
                                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                                                                    person.suspended_at
                                                                        ? 'bg-rose-50 text-rose-700'
                                                                        : person.status === 'accepted'
                                                                          ? 'bg-emerald-50 text-emerald-700'
                                                                          : 'bg-amber-50 text-amber-700'
                                                                }`}
                                                            >
                                                                {person.suspended_at
                                                                    ? 'Suspended'
                                                                    : person.status === 'accepted'
                                                                      ? 'Active'
                                                                      : person.status}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="relative px-6 py-3.5 text-right whitespace-nowrap">
                                                            <SecurityActions security={person} />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Redesigned Empty State */
                                <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-inner">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-black tracking-wide text-slate-900 uppercase">No personnel found</h3>
                                    <p className="mt-1 max-w-xs text-xs font-semibold text-slate-400">
                                        {hasActiveFilters
                                            ? 'No records match your selected criteria. Try resetting or adjusting your search term.'
                                            : 'Get started by inviting your first security guard to join the estate personnel list.'}
                                    </p>
                                    {!hasActiveFilters && can('security.create') && (
                                        <Link
                                            href={index.url() + '/create'}
                                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                                        >
                                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                                            Add Security Staff
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {security.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 pt-5 pb-8">
                                <p className="text-slate-505 text-xs font-bold">
                                    Showing <span className="text-slate-950">{security.data.length}</span> of{' '}
                                    <span className="text-slate-950">{security.total}</span> staff members
                                </p>
                                <div className="flex gap-1.5">
                                    {security.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                                link.active
                                                    ? 'bg-slate-950 text-white shadow-sm'
                                                    : link.url
                                                      ? 'text-slate-655 border-slate-205 border bg-white hover:bg-slate-50'
                                                      : 'cursor-not-allowed border border-slate-100 text-slate-300 opacity-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Deferred>
                </SectionErrorBoundary>
            </div>

            {/* FLOATING BULK ACTIONS TOOLBAR */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-6 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4"
                    >
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-slate-950/95 px-6 py-4.5 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                                <span className="text-xs font-black tracking-wider text-white uppercase">{selectedIds.length} Selected</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="rounded-xl bg-red-600 px-4.5 py-2 text-[11px] font-black tracking-wider text-white uppercase shadow-sm transition hover:bg-red-700 active:bg-red-800"
                                >
                                    Delete Selected
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                >
                                    <X className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Delete Confirm Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-inner">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-black tracking-wide text-slate-900 uppercase">Confirm Bulk Removal</h3>
                            <p className="mt-2 text-xs leading-relaxed font-semibold text-slate-600">
                                You are about to permanently remove {selectedIds.length} staff member(s). This will delete their credentials and
                                records. This action is irreversible.
                            </p>
                            <div className="mt-6 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-500/20 hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Yes, Delete Selected'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
