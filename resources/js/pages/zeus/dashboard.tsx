import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/layouts/ZeusLayout';

interface Estate {
    id: number;
    name: string;
    email: string;
    address: string | null;
    status: 'active' | 'inactive';
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
    stats: {
        total: number;
        active: number;
        inactive: number;
    };
    estates: PaginatedEstates;
    filters: {
        search: string;
        status: string;
    };
}

export default function Dashboard({ stats, estates, filters }: Props) {
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
        router.get('/zeus/dashboard', { search, status }, { preserveState: true });
    }

    function handleStatusChange(newStatus: string) {
        setStatus(newStatus);
        router.get('/zeus/dashboard', { search, status: newStatus }, { preserveState: true });
    }

    function handlePageChange(url: string | null) {
        if (url) {
            router.get(url, {}, { preserveState: true });
        }
    }

    function clearFilters() {
        setSearch('');
        setStatus('');
        router.get('/zeus/dashboard', {}, { preserveState: true });
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
            <Head title="Zeus Dashboard" />

            {/* Page Title */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="mb-8 flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-gray-500">Overview of all estates on the platform.</p>
                </div>
                <Link
                    href="/zeus/estates/create"
                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                    Create Estate
                </Link>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="text-sm font-medium text-gray-500">Total Estates</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="text-sm font-medium text-gray-500">Active Estates</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">{stats.active}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="text-sm font-medium text-gray-500">Inactive Estates</div>
                    <div className="mt-2 text-3xl font-bold text-gray-400">{stats.inactive}</div>
                </div>
            </motion.div>

            {/* Estates Table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Estates</h2>

                        {/* Search and Filters */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search estates..."
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                                >
                                    Search
                                </button>
                            </form>

                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            {hasFilters && (
                                <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {estates.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {hasFilters ? 'No estates match your filters.' : 'No estates found.'}
                                    </td>
                                </tr>
                            ) : (
                                estates.data.map((estate) => (
                                    <tr key={estate.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">{estate.name}</td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{estate.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {estate.address || <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    estate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {estate.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{formatDate(estate.created_at)}</td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/zeus/estates/${estate.id}/edit`} className="text-gray-600 hover:text-gray-900">
                                                    Edit
                                                </Link>
                                                <button onClick={() => handleToggleStatus(estate.id)} className="text-gray-600 hover:text-gray-900">
                                                    {estate.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button onClick={() => handleResetPassword(estate.id)} className="text-gray-600 hover:text-gray-900">
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(estate.id, estate.name)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Delete
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
                    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
                        <div className="text-sm text-gray-500">
                            Showing {estates.from} to {estates.to} of {estates.total} estates
                        </div>
                        <div className="flex items-center gap-1">
                            {estates.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-gray-900 text-white'
                                            : link.url
                                              ? 'text-gray-600 hover:bg-gray-100'
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
