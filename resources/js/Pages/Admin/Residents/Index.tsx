import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, PlusIcon, ArrowRightIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { LinkIcon, Mail, Trash2, MapPin, Phone, User, Loader2, Check } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index as inviteLinkIndex } from '@/actions/App/Http/Controllers/Admin/InviteLinkController';
import { index as approvalsIndex } from '@/actions/App/Http/Controllers/Admin/ResidentApprovalController';
import { bulkDelete, index } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import ResidentActions from '@/Components/Admin/ResidentActions';
import ResidentsSkeleton from '@/Components/Admin/ResidentsSkeleton';

import { useDebounce } from '@/Hooks/useDebounce';
import { usePermission } from '@/Hooks/usePermission';
import AdminLayout from '@/Layouts/AdminLayout';

// Wayfinder actions are used for routing instead of global route()

type Resident = {
    ulid: string;
    id: number;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    property_owner_name: string | null;
    status: 'pending' | 'accepted';
    is_property_owner: boolean;
    suspended_at: string | null;
    email_verified_at: string | null;
    created_at: string;
};

type PaginatedResidents = {
    data: Resident[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    residents: PaginatedResidents & { next_page_url: string | null };
    filters: {
        search?: string;
        status?: string;
    };
    pendingCount: number;
};

export default function Residents({ residents, filters, pendingCount }: Props) {
    const { can } = usePermission();
    const hasResidents = residents && residents.data && residents.data.length > 0;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [allSelected, setAllSelected] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    // Clear selection when page changes (unless globally selected)
    useEffect(() => {
        if (!allSelected) {
            setSelectedIds([]);
        }
    }, [residents?.current_page, allSelected]);

    // Debounce search
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch, status }, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [debouncedSearch, filters.search, status]);

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

    const hasActiveFilters = Boolean(search || status);

    const toggleSelectAll = useCallback(() => {
        if (!residents?.data) return;
        if (selectedIds.length === residents.data.length || allSelected) {
            setSelectedIds([]);
            setAllSelected(false);
        } else {
            setSelectedIds(residents.data.map((r) => r.id));
        }
    }, [selectedIds.length, residents?.data, allSelected]);

    const toggleSelect = useCallback((id: number) => {
        setAllSelected(false);
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }, []);

    const selectAllAcrossPages = () => {
        setAllSelected(true);
        // We don't necessarily need all IDs if the backend supports a "select all" flag for bulk actions
        // But for UI feedback, we can show the total count
    };

    const handleBulkDelete = useCallback(() => {
        if (selectedIds.length === 0 && !allSelected) return;

        setIsDeleting(true);
        router.delete(bulkDelete.url(), {
            data: {
                ids: selectedIds,
                all: allSelected,
                filters: { search, status },
            },
            onSuccess: () => {
                setSelectedIds([]);
                setAllSelected(false);
                setShowDeleteConfirm(false);
            },
            onFinish: () => setIsDeleting(false),
        });
    }, [selectedIds, allSelected, search, status]);

    const isAllSelected = (residents?.data?.length ?? 0) > 0 && selectedIds.length === (residents?.data?.length ?? 0);
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < (residents?.data?.length ?? 0);

    const loadMore = () => {
        if (residents.next_page_url && !isLoadingMore) {
            setIsLoadingMore(true);
            router.get(
                residents.next_page_url,
                {},
                {
                    preserveScroll: true,
                    only: ['residents'],
                    // @ts-expect-error - merge is a new Inertia v2 feature
                    merge: true,
                    onFinish: () => setIsLoadingMore(false),
                },
            );
        }
    };

    return (
        <>
            <Head title="Residents" />

            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Residents</h1>
                    <p className="mt-1 text-slate-500">Manage and oversee all estate residents.</p>
                </div>
                {can('residents.create') && (
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <Link
                            href={inviteLinkIndex.url()}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <LinkIcon className="h-4 w-4" />
                            Manage Invite Link
                        </Link>
                        <Link
                            href={index.url() + '/create'}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-[#1F6FDB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Resident
                        </Link>
                    </div>
                )}
            </div>

            {/* Pending Approvals Notice - Glassmorphism Redesign */}
            <AnimatePresence>
                {pendingCount && pendingCount > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-8">
                        <Link
                            href={approvalsIndex.url()}
                            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50/50 to-indigo-50/50 p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 shadow-inner ring-4 ring-blue-50">
                                    <Mail className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-lg font-black tracking-tight text-blue-900">
                                        {pendingCount} Pending Application{pendingCount > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm leading-relaxed text-blue-700/80">Approvals required for new resident sign-ups.</p>
                                </div>
                            </div>
                            <div className="flex w-full items-center justify-between border-t border-blue-100 pt-4 sm:w-auto sm:border-0 sm:pt-0">
                                <span className="text-sm font-bold text-blue-600 sm:hidden">Action Required</span>
                                <div className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all group-hover:bg-blue-700 group-hover:px-5">
                                    Review
                                    <ArrowRightIcon className="h-4 w-4" />
                                </div>
                            </div>
                            {/* Decorative Blobs */}
                            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-blue-400/5 blur-3xl" />
                            <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-indigo-400/5 blur-3xl" />
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters Section - Modernized */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full rounded-2xl border-0 bg-white py-3.5 pl-11 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#1F6FDB]"
                        placeholder="Search residents..."
                    />
                </div>
                <div className="w-full sm:w-56">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <FunnelIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <select
                            value={status}
                            onChange={handleStatusChange}
                            className="block w-full appearance-none rounded-2xl border-0 bg-white py-3.5 pr-10 pl-11 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#1F6FDB]"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Residents</option>
                            <option value="property_owner">Property Owners</option>
                            <option value="pending">Pending Invites</option>
                            <option value="suspended">Suspended Users</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <ChevronDownIcon className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Reset
                    </button>
                )}
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && can('residents.delete') && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 flex flex-col rounded-lg border border-primary-200 bg-primary-50 px-4 py-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black tracking-tight text-primary-900">
                                {allSelected ? residents.total : selectedIds.length} resident(s) selected
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedIds([]);
                                        setAllSelected(false);
                                    }}
                                    className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                                >
                                    Unselect All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Selected
                                </button>
                            </div>
                        </div>

                        {/* Intelligent Cross-Page Selection */}
                        <AnimatePresence>
                            {isAllSelected && residents.total > residents.data.length && !allSelected && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 border-t border-primary-200 pt-3"
                                >
                                    <p className="text-center text-xs font-medium text-primary-700">
                                        All {residents.data.length} residents on this page are selected.{' '}
                                        <button
                                            type="button"
                                            onClick={selectAllAcrossPages}
                                            className="font-black text-primary-900 underline decoration-primary-900/30 underline-offset-4 hover:decoration-primary-900"
                                        >
                                            Select all {residents.total} residents in the estate
                                        </button>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Container */}
            <div className="space-y-4">
                {!residents ? (
                    <ResidentsSkeleton />
                ) : hasResidents ? (
                    <>
                        {/* Mobile Card List (Hidden on Desktop) */}
                        <div className="flex flex-col gap-4 sm:hidden">
                            <AnimatePresence mode="popLayout">
                                {residents.data.map((resident) => (
                                    <motion.div
                                        layout
                                        key={resident.ulid ?? String(resident.id)}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all active:bg-slate-50 ${
                                            selectedIds.includes(resident.id) ? 'bg-blue-50/30 ring-2 ring-blue-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelect(resident.id);
                                                    }}
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black shadow-inner transition-colors ${
                                                        selectedIds.includes(resident.id) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                                                    }`}
                                                >
                                                    {selectedIds.includes(resident.id) ? (
                                                        <Check className="h-6 w-6" strokeWidth={3} />
                                                    ) : (
                                                        resident.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div onClick={() => toggleSelect(resident.id)}>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-black tracking-tight text-slate-900">{resident.name}</h3>
                                                        {resident.is_property_owner && (
                                                            <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-indigo-700 uppercase">
                                                                Property Owner
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                        <MapPin className="h-3 w-3" />
                                                        {resident.unit_number || 'Unit Pending'}
                                                    </div>
                                                    {resident.property_owner_name && (
                                                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                            <User className="h-2.5 w-2.5" />
                                                            via {resident.property_owner_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                                                        resident.suspended_at
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : !resident.email_verified_at
                                                              ? 'bg-slate-100 text-slate-700'
                                                              : resident.status === 'accepted'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {resident.suspended_at
                                                        ? 'Suspended'
                                                        : !resident.email_verified_at
                                                          ? 'Inactive'
                                                          : resident.status === 'accepted'
                                                            ? 'Active'
                                                            : 'Pending'}
                                                </span>
                                                <ResidentActions resident={resident} />
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-3 rounded-2xl bg-slate-50/50 p-4 ring-1 ring-slate-100">
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <span className="truncate">{resident.email}</span>
                                            </div>
                                            {resident.phone && (
                                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {resident.phone}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Desktop Table (Hidden on Mobile) */}
                        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:block">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        {can('residents.delete') && (
                                            <th className="w-12 px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = isSomeSelected;
                                                    }}
                                                    onChange={toggleSelectAll}
                                                    className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Resident
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Contact
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Unit</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Status
                                        </th>
                                        <th className="relative px-6 py-4">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {residents.data.map((resident) => (
                                        <tr
                                            key={resident.ulid ?? String(resident.id)}
                                            className={`transition-colors hover:bg-slate-50/50 ${selectedIds.includes(resident.id) ? 'bg-blue-50/50' : ''}`}
                                        >
                                            {can('residents.delete') && (
                                                <td className="w-12 px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(resident.id)}
                                                        onChange={() => toggleSelect(resident.id)}
                                                        className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 font-bold text-slate-500">
                                                        {resident.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-bold text-slate-900">{resident.name}</div>
                                                            {resident.is_property_owner && (
                                                                <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-indigo-700 uppercase">
                                                                    Property Owner
                                                                </span>
                                                            )}
                                                        </div>
                                                        {resident.property_owner_name && (
                                                            <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                                <User className="h-2.5 w-2.5" />
                                                                via {resident.property_owner_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col text-xs font-medium text-slate-500">
                                                    <span className="font-bold text-slate-900">{resident.email}</span>
                                                    <span>{resident.phone || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                    {resident.unit_number || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ${
                                                        resident.suspended_at
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : !resident.email_verified_at
                                                              ? 'bg-slate-100 text-slate-700'
                                                              : resident.status === 'accepted'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {resident.suspended_at
                                                        ? 'Suspended'
                                                        : !resident.email_verified_at
                                                          ? 'Inactive'
                                                          : resident.status === 'accepted'
                                                            ? 'Active'
                                                            : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <ResidentActions resident={resident} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Strategy - Load More for Mobile, Links for Desktop */}
                        <div className="mt-8 flex flex-col items-center justify-center gap-6 pb-12">
                            {residents.next_page_url ? (
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-black tracking-tight text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 sm:hidden"
                                >
                                    {isLoadingMore ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    ) : (
                                        <>
                                            Load More Residents
                                            <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                residents.total > 0 && (
                                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase sm:hidden">End of listing</p>
                                )
                            )}

                            {/* Desktop Pagination */}
                            {residents.last_page > 1 && (
                                <div className="hidden w-full items-center justify-between sm:flex">
                                    <p className="text-sm font-bold text-slate-500">
                                        Showing <span className="text-slate-900">{residents.data.length}</span> of{' '}
                                        <span className="text-slate-900">{residents.total}</span> residents
                                    </p>
                                    <div className="flex gap-2">
                                        {residents.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                preserveScroll
                                                preserveState
                                                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                                                    link.active
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                        : link.url
                                                          ? 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                                          : 'cursor-not-allowed text-slate-400 opacity-30'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-gray-100 p-4">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No residents found</h3>
                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                            {search || status
                                ? 'Try adjusting your search or filters to find what you are looking for.'
                                : "Get started by adding your first resident. They'll receive an invitation email to set up their account."}
                        </p>
                        {!(search || status) && can('residents.create') && (
                            <Link
                                href={index.url() + '/create'}
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add Resident
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete {selectedIds.length} Resident(s)?</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                This action cannot be undone. The selected residents will be permanently removed from this estate.
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
