import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { bulkDelete, index } from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import SecurityActions from '@/components/Admin/SecurityActions';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import AdminLayout from '@/layouts/AdminLayout';

type SecurityPerson = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    badge_number: string | null;
    status: 'pending' | 'accepted';
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
    security: PaginatedSecurity;
    filters: {
        search?: string;
        status?: string;
    };
};

export default function SecurityPersonnel({ security, filters }: Props) {
    const { can } = usePermission();
    const hasSecurity = security.data.length > 0;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    // Clear selection when page changes
    useEffect(() => {
        setSelectedIds([]);
    }, [security.current_page]);

    // Debounce search
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch, status }, { preserveState: true, replace: true });
        }
    }, [debouncedSearch, filters.search, status]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        router.get(index.url(), { search, status: newStatus }, { preserveState: true, replace: true });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        setStatus('');
        router.get(index.url(), {}, { preserveState: true, replace: true });
    }, []);

    const hasActiveFilters = Boolean(search || status);

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.length === security.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(security.data.map((s) => s.id));
        }
    }, [selectedIds.length, security.data]);

    const toggleSelect = useCallback((id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }, []);

    const handleBulkDelete = useCallback(() => {
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
    }, [selectedIds]);

    const isAllSelected = security.data.length > 0 && selectedIds.length === security.data.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < security.data.length;

    return (
        <AdminLayout>
            <Head title="Security Personnel" />

            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Security Personnel</h1>
                    <p className="mt-1 text-gray-500">Manage security staff for your estate.</p>
                </div>
                {can('security.create') && (
                    <Link
                        href={index.url() + '/create'}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Security
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Search by name or email..."
                    />
                </div>
                <div className="w-full sm:w-48">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <select
                            value={status}
                            onChange={handleStatusChange}
                            className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pr-8 pl-10 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && can('security.delete') && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-3"
                    >
                        <span className="text-sm font-medium text-primary-800">{selectedIds.length} personnel selected</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Clear
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="rounded-xl border border-gray-200 bg-white">
                {hasSecurity ? (
                    <>
                        {/* Table */}
                        <div className="overflow-x-auto lg:overflow-visible">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {can('security.delete') && (
                                            <th className="w-12 px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = isSomeSelected;
                                                    }}
                                                    onChange={toggleSelectAll}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Badge #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {security.data.map((person) => (
                                        <tr key={person.id} className={`hover:bg-gray-50 ${selectedIds.includes(person.id) ? 'bg-primary-50' : ''}`}>
                                            {can('security.delete') && (
                                                <td className="w-12 px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(person.id)}
                                                        onChange={() => toggleSelect(person.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{person.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{person.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{person.phone || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{person.badge_number || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        person.suspended_at
                                                            ? 'bg-red-100 text-red-800'
                                                            : person.status === 'accepted'
                                                              ? 'bg-green-100 text-green-800'
                                                              : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {person.suspended_at ? 'Suspended' : person.status === 'accepted' ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <SecurityActions security={person} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {security.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                                <div className="text-sm text-gray-500">
                                    Showing {(security.current_page - 1) * security.per_page + 1} to{' '}
                                    {Math.min(security.current_page * security.per_page, security.total)} of {security.total} personnel
                                </div>
                                <div className="flex gap-2">
                                    {security.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg px-3 py-1.5 text-sm ${
                                                link.active
                                                    ? 'bg-primary-600 text-white'
                                                    : link.url
                                                      ? 'text-gray-600 hover:bg-gray-100'
                                                      : 'cursor-not-allowed text-gray-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-gray-100 p-4">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No security personnel found</h3>
                        <p className="mt-1 max-w-sm text-sm text-gray-500">
                            {search || status
                                ? 'Try adjusting your search or filters to find what you are looking for.'
                                : "Get started by adding your first security personnel. They'll receive an invitation email to set up their account."}
                        </p>
                        {!(search || status) && can('security.create') && (
                            <Link
                                href={index.url() + '/create'}
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add Security
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
                            <h3 className="text-lg font-semibold text-gray-900">Delete {selectedIds.length} Security Personnel?</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                This action cannot be undone. The selected security personnel will be permanently removed from this estate.
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
        </AdminLayout>
    );
}
