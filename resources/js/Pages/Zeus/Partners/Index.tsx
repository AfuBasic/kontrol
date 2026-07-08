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

            <div className="relative mx-auto max-w-7xl px-4 py-8 text-[#F2F3F6] bg-[#0A0B10] min-h-screen space-y-8">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.6)]" />
                            <span className="text-[10px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">PARTNER ACCOUNTS</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-[#F2F3F6]">
                            Strategic <span className="font-light text-[#9297A8]">Partners</span>
                        </h1>
                        <p className="text-sm text-[#9297A8] mt-2">Manage external partners, update commission structures, and audit referrals.</p>
                    </div>
                    <div>
                        <Link
                            href="/zeus/partners/create"
                            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#6C5DFD] to-violet-650 px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#6C5DFD]/10 hover:shadow-xl active:scale-[0.98] transition-all"
                        >
                            <PlusIcon className="h-4.5 w-4.5 stroke-[3]" />
                            Create Partner
                        </Link>
                    </div>
                </motion.div>

                {/* KPI Metrics Dashboard Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="grid gap-4 sm:grid-cols-3"
                >
                    {/* Stat Card 1 */}
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#6C5DFD]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Strategic Partners</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#F2F3F6]">{partners.total}</span>
                            <span className="text-xs font-semibold text-[#9297A8]">registered</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            <span>{activePartnersCount} live and active</span>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#34D399]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Estates Referred</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#F2F3F6]">{totalEstatesCount}</span>
                            <span className="text-xs font-semibold text-[#9297A8]">estates</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#60A5FA]">
                            <BuildingOfficeIcon className="h-3.5 w-3.5" />
                            <span>Across all partner lists</span>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#A78BFA]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Settlement Program</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#F2F3F6]">Active</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#A78BFA]">
                            <BanknotesIcon className="h-3.5 w-3.5" />
                            <span>Monthly payouts enabled</span>
                        </div>
                    </div>
                </motion.div>

                {/* Filters Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl"
                >
                    <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                            <div className="flex-1">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Search Partners</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute top-3.5 left-3.5 h-4 w-4 text-[#9297A8]" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, email..."
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-10 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="w-full sm:w-48">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Status Filter</label>
                                <select
                                    value={status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 px-4 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
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
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-[rgba(255,255,255,0.08)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
                            >
                                <FunnelIcon className="h-4 w-4" />
                                Filter
                            </button>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-5 py-3 text-sm font-semibold text-[#9297A8] hover:bg-gray-850 hover:text-white transition-colors"
                                >
                                    Reset
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
                    className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#12141C] border-b border-[rgba(255,255,255,0.08)] text-xs font-semibold uppercase tracking-wider text-[#9297A8]">
                                <tr>
                                    <th className="px-6 py-4 text-left">Partner Details</th>
                                    <th className="px-6 py-4 text-left">Commission Rate</th>
                                    <th className="px-6 py-4 text-center">Referrals</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                {partners.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-[#9297A8]">
                                            {hasFilters ? 'No partners match your filter criteria.' : 'No partners found. Create one to get started.'}
                                        </td>
                                    </tr>
                                ) : (
                                    partners.data.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-[#12141C]/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="font-bold text-[#F2F3F6] text-[14px]">{partner.name}</p>
                                                    <p className="text-[#9297A8] text-xs mt-0.5">{partner.email}</p>
                                                    {partner.contact_person && (
                                                        <p className="text-gray-650 text-[10px] mt-1">Attn: {partner.contact_person}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#F2F3F6]">
                                                        {formatCommission(partner.commission_rate, partner.commission_type)}
                                                    </span>
                                                    <span className="text-[10px] text-[#9297A8] uppercase mt-0.5">
                                                        {partner.commission_type === 'fixed' ? 'Fixed Fee' : 'Percentage'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0A0B10] border border-[rgba(255,255,255,0.08)] font-semibold text-[#F2F3F6] text-xs">
                                                    {partner.estates_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                                                        partner.status === 'active'
                                                            ? 'bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20'
                                                            : partner.status === 'inactive'
                                                            ? 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20'
                                                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        partner.status === 'active'
                                                            ? 'bg-[#34D399]'
                                                            : partner.status === 'inactive'
                                                            ? 'bg-[#F5A623]'
                                                            : 'bg-rose-500'
                                                    }`} />
                                                    {partner.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <Link
                                                        href={`/zeus/partners/${partner.id}/earnings`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#34D399] hover:underline"
                                                    >
                                                        <BanknotesIcon className="h-4 w-4" />
                                                        Earnings
                                                    </Link>
                                                    <Link
                                                        href={`/zeus/partners/${partner.id}/edit`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C5DFD] hover:underline"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(partner.id, partner.name)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:underline"
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
                        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] bg-[#12141C] px-6 py-4">
                            <p className="text-sm text-[#9297A8]">
                                Showing {partners.from} to {partners.to} of {partners.total} partners
                            </p>
                            <div className="flex gap-2">
                                {partners.links.map((link, idx) => {
                                    if (!link.url) return null;
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                                link.active
                                                    ? 'bg-[#6C5DFD] text-white shadow-sm'
                                                    : 'bg-[#0A0B10] border border-[rgba(255,255,255,0.08)] text-[#9297A8] hover:bg-[#12141C]'
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