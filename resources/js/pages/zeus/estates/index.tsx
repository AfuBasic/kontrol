import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/layouts/ZeusLayout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Estate {
    id: number;
    name: string;
    email: string;
    address: string | null;
    status: 'active' | 'inactive';
    admin_accepted: boolean;
    created_at: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedEstates {
    data: Estate[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLinks[];
    from: number | null;
    to: number | null;
}

interface Props {
    estates: PaginatedEstates;
    filters: {
        search: string;
        status: string;
    };
}

export default function EstatesIndex({ estates, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/zeus/estates', { search, status }, { preserveState: true });
    }

    function handleStatusChange(newStatus: string) {
        setStatus(newStatus);
        router.get('/zeus/estates', { search, status: newStatus }, { preserveState: true });
    }

    function handlePageChange(url: string | null) {
        if (url) {
            router.get(url, {}, { preserveState: true });
        }
    }

    function clearFilters() {
        setSearch('');
        setStatus('');
        router.get('/zeus/estates', {}, { preserveState: true });
    }

    function handleToggleStatus(estateId: number) {
        router.post(`/zeus/estates/${estateId}/toggle-status`, {}, { preserveState: true });
    }

    function handleResetPassword(estateId: number) {
        if (confirm('Send a password reset link to the estate admin?')) {
            router.post(`/zeus/estates/${estateId}/reset-password`, {}, { preserveState: true });
        }
    }

    function handleDelete(estateId: number, estateName: string) {
        if (confirm(`Are you sure you want to delete "${estateName}"? This action cannot be undone.`)) {
            router.delete(`/zeus/estates/${estateId}`, { preserveState: true });
        }
    }

    const hasFilters = filters.search || filters.status;

    return (
        <ZeusLayout>
            <Head title="Manage Estates" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-8 flex items-end justify-between gap-6"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Infrastructure
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Manage <span className="text-slate-400 font-light">Estates</span>
                    </h1>
                </div>
                <Link
                    href="/zeus/estates/create"
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-95"
                >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    New Estate
                </Link>
            </motion.div>

            {/* Estates Table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
                <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900">All Estates</h2>

                        {/* Search and Filters */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search estates..."
                                        className="rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-xl bg-linear-to-r from-primary-500 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px"
                                >
                                    Search
                                </button>
                            </form>

                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-200/80 bg-linear-to-r from-gray-50/80 to-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Estate</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Account</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Locale</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">State</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Registered</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {estates.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {hasFilters ? 'No estates match your filters.' : 'No estates found.'}
                                    </td>
                                </tr>
                            ) : (
                                estates.data.map((estate) => (
                                    <tr key={estate.id} className="group transition-colors hover:bg-primary-50/30">
                                        <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">{estate.name}</td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{estate.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {estate.address || <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    estate.status === 'active'
                                                        ? 'bg-green-50 ring-1 ring-green-200/80 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {estate.status === 'active' && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                )}
                                                {estate.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{formatDate(estate.created_at)}</td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Link
                                                    href={`/zeus/estates/${estate.id}/edit`}
                                                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                                    title="Edit"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </Link>
                                                {estate.admin_accepted && (
                                                    <button
                                                        onClick={() => handleToggleStatus(estate.id)}
                                                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                                        title={estate.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleResetPassword(estate.id)}
                                                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                                    title="Reset Password"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(estate.id, estate.name)}
                                                    className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {estates.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-6 py-3.5">
                        <p className="text-xs text-gray-500">
                            Showing {estates.from}–{estates.to} of {estates.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {estates.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-primary-600 text-white'
                                            : link.url
                                              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                              : 'cursor-not-allowed text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </ZeusLayout>
    );
}
