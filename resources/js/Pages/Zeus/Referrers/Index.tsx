import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { HandRaisedIcon, PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Referrer {
    id: number;
    name: string;
    email: string;
    contact_person: string | null;
    commission_rate: number;
    status: 'active' | 'inactive' | 'suspended';
    estates_count: number;
}

interface Props {
    referrers: {
        data: Referrer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
    };
    statuses: string[];
    filters: {
        search: string;
        status: string;
    };
}

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
};

export default function ReferrersIndex({ referrers, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/zeus/referrers', { search, status }, { preserveState: true });
    }

    function handleStatusChange(newStatus: string) {
        setStatus(newStatus);
        router.get('/zeus/referrers', { search, status: newStatus }, { preserveState: true });
    }

    function handleDelete(referrerId: number, name: string) {
        if (confirm(`Delete ${name}? This action cannot be undone.`)) {
            router.delete(`/zeus/referrers/${referrerId}`, { preserveState: true });
        }
    }

    function clearFilters() {
        setSearch('');
        setStatus('');
        router.get('/zeus/referrers', {}, { preserveState: true });
    }

    const hasFilters = filters.search || filters.status;

    return (
        <ZeusLayout>
            <Head title="Referrers Management" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-10 flex items-end justify-between gap-6"
            >
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Partner Network</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Strategic <span className="font-light text-slate-400">Referrers</span>
                    </h1>
                </div>
                <Link
                    href="/zeus/referrers/create"
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-95"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Referrer
                </Link>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="mb-8 rounded-lg border border-slate-200 bg-white p-5"
            >
                <form onSubmit={handleSearch} className="grid gap-6 lg:grid-cols-4">
                    <div>
                        <label className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Search Partners</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Name or email..."
                                className="w-full rounded border border-slate-200 py-2 pr-4 pl-10 text-[13px] text-slate-900 transition-all placeholder:text-slate-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Status Filter</label>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full rounded border border-slate-200 px-4 py-2 text-[13px] text-slate-900 transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                        >
                            <option value="">All States</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2 lg:col-span-2">
                        <button
                            type="submit"
                            className="flex-1 rounded bg-slate-900 px-4 py-2 text-[13px] font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                            Execute Search
                        </button>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-400 transition-all hover:bg-slate-50 active:scale-95"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>

            {/* Referrers Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-100 bg-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                                    Partner Details
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">Commission</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                                    Network Size
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                                    Current State
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {referrers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {hasFilters ? 'No referrers match your filters.' : 'No referrers found. Create one to get started!'}
                                    </td>
                                </tr>
                            ) : (
                                referrers.data.map((referrer) => (
                                    <tr key={referrer.id} className="bg-white transition-colors hover:bg-slate-50/50">
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-[13px] font-bold text-slate-900">{referrer.name}</p>
                                                <p className="text-[11px] text-slate-500">{referrer.email}</p>
                                                {referrer.contact_person && (
                                                    <p className="mt-0.5 text-[10px] text-slate-400">Attn: {referrer.contact_person}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[13px] font-black text-slate-900">{referrer.commission_rate}%</span>
                                            <span className="ml-1 text-[10px] font-bold text-slate-300">COMM</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[14px] font-bold text-slate-700">{referrer.estates_count}</span>
                                        </td>
                                        <td className="px-6 py-5 text-left">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${
                                                    referrer.status === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {referrer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Link
                                                    href={`/zeus/referrers/${referrer.id}/edit`}
                                                    className="text-[12px] font-bold tracking-tight text-blue-500 uppercase transition-colors hover:text-blue-600"
                                                >
                                                    Manage
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(referrer.id, referrer.name)}
                                                    className="text-[12px] font-bold tracking-tight text-slate-400 uppercase transition-colors hover:text-red-500"
                                                >
                                                    Retire
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
                {referrers.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <p className="text-sm text-gray-600">
                            Showing {referrers.from} to {referrers.to} of {referrers.total} referrers
                        </p>
                    </div>
                )}
            </motion.div>
        </ZeusLayout>
    );
}
