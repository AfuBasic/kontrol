import {
    BanknotesIcon,
    BuildingOfficeIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Partner {
    id: number;
    name: string;
    email: string;
    contact_person: string | null;
    commission_type: 'percentage' | 'fixed';
    commission_rate: number;
    status: 'active' | 'inactive' | 'suspended';
    estates_count: number;
}

interface Props {
    partners: {
        data: Partner[];
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

function formatCommission(rate: number, type: 'percentage' | 'fixed'): string {
    if (type === 'fixed') {
        return '₦' + (rate / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
    return `${Number(rate).toFixed(2)}%`;
}

export default function PartnersIndex({ partners, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/zeus/partners', { search, status }, { preserveState: true });
    }

    function handleStatusChange(newStatus: string) {
        setStatus(newStatus);
        router.get('/zeus/partners', { search, status: newStatus }, { preserveState: true });
    }

    function handleDelete(partnerId: number, name: string) {
        if (confirm(`Delete ${name}? This action cannot be undone.`)) {
            router.delete(`/zeus/partners/${partnerId}`, { preserveState: true });
        }
    }

    function clearFilters() {
        setSearch('');
        setStatus('');
        router.get('/zeus/partners', {}, { preserveState: true });
    }

    const hasFilters = search || status;

    // Calculate quick stats from current page or totals
    const activePartnersCount = partners.data.filter(p => p.status === 'active').length;
    const totalEstatesCount = partners.data.reduce((acc, p) => acc + p.estates_count, 0);

    return (
        <ZeusLayout>
            <Head title="Partners Management" />

            <div className="space-y-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <div className="mb-1.5 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-sm" />
                            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Strategic Network</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">
                            Partner <span className="font-light text-gray-500">Accounts</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Manage external partners, update commission rates, and track performance.</p>
                    </div>
                    <div>
                        <Link
                            href="/zeus/partners/create"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-lg transition-all duration-200 active:scale-95"
                        >
                            <PlusIcon className="h-5 w-5" />
                            New Partner
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="grid gap-6 sm:grid-cols-3"
                >
                    <div className="relative overflow-hidden rounded-2xl border border-gray-150 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Total Partners</span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <UsersIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-4">{partners.total}</p>
                        <p className="text-xs text-gray-400 mt-1">{activePartnersCount} currently active</p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-gray-150 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Estates Referred</span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                <BuildingOfficeIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-4">{totalEstatesCount}</p>
                        <p className="text-xs text-gray-400 mt-1">Referred across current partner lists</p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-gray-150 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Financial Settlements</span>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                <BanknotesIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-4">Active</p>
                        <p className="text-xs text-gray-400 mt-1">First-year monthly payouts enabled</p>
                    </div>
                </motion.div>

                {/* Filters Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                            <div className="flex-1">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Search</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute top-3 left-3.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, email..."
                                        className="w-full rounded-xl border border-gray-250 py-2.5 pr-4 pl-10 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="w-full sm:w-48">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full rounded-xl border border-gray-250 py-2.5 px-4 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors active:scale-95"
                            >
                                <FunnelIcon className="h-4 w-4" />
                                Filter
                            </button>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors active:scale-95"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>

                {/* Partners Table */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="rounded-2xl border border-gray-255 bg-white shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 text-left">Partner Details</th>
                                    <th className="px-6 py-4 text-left">Commission Rate</th>
                                    <th className="px-6 py-4 text-center">Estates</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partners.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                            {hasFilters ? 'No partners match your filter criteria.' : 'No partners found. Create one to get started.'}
                                        </td>
                                    </tr>
                                ) : (
                                    partners.data.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-[14px]">{partner.name}</p>
                                                    <p className="text-gray-500 text-xs mt-0.5">{partner.email}</p>
                                                    {partner.contact_person && (
                                                        <p className="text-gray-400 text-[10px] mt-1">Attn: {partner.contact_person}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">
                                                        {formatCommission(partner.commission_rate, partner.commission_type)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase mt-0.5">
                                                        {partner.commission_type === 'fixed' ? 'Fixed Fee' : 'Percentage'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700 text-xs">
                                                    {partner.estates_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        partner.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : partner.status === 'inactive'
                                                            ? 'bg-gray-100 text-gray-600'
                                                            : 'bg-rose-50 text-rose-700'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        partner.status === 'active'
                                                            ? 'bg-emerald-500'
                                                            : partner.status === 'inactive'
                                                            ? 'bg-gray-400'
                                                            : 'bg-rose-500'
                                                    }`} />
                                                    {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <Link
                                                        href={`/zeus/partners/${partner.id}/earnings`}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                                                    >
                                                        <BanknotesIcon className="h-4 w-4" />
                                                        Earnings
                                                    </Link>
                                                    <Link
                                                        href={`/zeus/partners/${partner.id}/edit`}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(partner.id, partner.name)}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
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
                    {partners.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
                            <p className="text-sm text-gray-500">
                                Showing {partners.from} to {partners.to} of {partners.total} partners
                            </p>
                            <div className="flex gap-2">
                                {partners.links.map((link, idx) => {
                                    if (!link.url) return null;
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </ZeusLayout>
    );
}