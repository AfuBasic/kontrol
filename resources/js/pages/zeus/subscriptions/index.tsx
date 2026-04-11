import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/layouts/ZeusLayout';
import { UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Estate {
    id: number;
    name: string;
    email: string;
    plan_id: number | null;
    plan_name: string;
    status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'no_plan';
    billing_interval: 'quarterly' | 'semi-annually' | 'annually';
    trial_ends_at: string | null;
    current_period_end: string | null;
    is_overridden: boolean;
    override_notes: string | null;
}

interface Plan {
    id: number;
    name: string;
}

interface Props {
    estates: {
        data: Estate[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
    };
    plans: Plan[];
    statuses: string[];
    filters: {
        search: string;
        status: string;
    };
}

const statusColors: Record<string, string> = {
    trial: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    past_due: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    no_plan: 'bg-gray-100 text-gray-800',
};

export default function SubscriptionsIndex({ estates, plans, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [overrideEstate, setOverrideEstate] = useState<Estate | null>(null);
    const [overrideData, setOverrideData] = useState({
        plan_id: '',
        status: 'active',
        billing_interval: 'monthly',
        notes: '',
    });

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/zeus/subscriptions', { search, status }, { preserveState: true });
    }

    function handleStatusChange(newStatus: string) {
        setStatus(newStatus);
        router.get('/zeus/subscriptions', { search, status: newStatus }, { preserveState: true });
    }

    function handleOverride(e: React.FormEvent) {
        e.preventDefault();
        if (!overrideEstate) return;

        router.patch(`/zeus/subscriptions/${overrideEstate.id}`, overrideData, {
            onSuccess: () => {
                setOverrideEstate(null);
                setOverrideData({ plan_id: '', status: 'active', billing_interval: 'monthly', notes: '' });
            },
        });
    }

    function clearFilters() {
        setSearch('');
        setStatus('');
        router.get('/zeus/subscriptions', {}, { preserveState: true });
    }

    const hasFilters = filters.search || filters.status;

    return (
        <ZeusLayout>
            <Head title="Subscriptions Oversight" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-10"
            >
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Access Management
                    </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Active <span className="text-slate-400 font-light">Subscriptions</span>
                </h1>
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
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Search Estates</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Name or email..."
                                className="w-full rounded border border-slate-200 pl-10 pr-4 py-2 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">State Filter</label>
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full rounded border border-slate-200 px-4 py-2 text-[13px] text-slate-900 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                        >
                            <option value="">All States</option>
                            <option value="trial">Trialing</option>
                            <option value="active">Active</option>
                            <option value="past_due">Delinquent</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2 lg:col-span-2">
                        <button
                            type="submit"
                            className="flex-1 rounded bg-slate-900 px-4 py-2 text-[13px] font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                            Apply Filters
                        </button>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-400 transition-all hover:bg-slate-50 active:scale-95"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>

            {/* Subscriptions Table */}
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
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Account</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Current Plan</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Engine State</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Billing</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Term End</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {estates.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {hasFilters ? 'No estates match your filters.' : 'No subscriptions found.'}
                                    </td>
                                </tr>
                            ) : (
                                estates.data.map((estate) => (
                                    <tr key={estate.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{estate.name}</p>
                                                <p className="text-sm text-gray-600">{estate.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{estate.plan_name}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                                                        estate.status === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {estate.status === 'no_plan' ? 'None' : estate.status}
                                                </span>
                                                {estate.is_overridden && (
                                                    <span className="inline-flex rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-amber-500">
                                                        Manual Override
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{estate.billing_interval}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {estate.current_period_end ? (
                                                new Date(estate.current_period_end).toLocaleDateString()
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setOverrideEstate(estate);
                                                    setOverrideData({
                                                        plan_id: String(estate.plan_id || ''),
                                                        status: estate.status === 'no_plan' ? 'active' : estate.status,
                                                        billing_interval: estate.billing_interval,
                                                        notes: estate.override_notes || '',
                                                    });
                                                }}
                                                className="text-[12px] font-bold uppercase tracking-tight text-blue-500 hover:text-blue-600 transition-colors"
                                            >
                                                Configure
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {estates.last_page > 1 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {estates.from} to {estates.to} of {estates.total} subscriptions
                        </p>
                        <div className="flex gap-2">
                            {estates.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (link.url) router.get(link.url, {}, { preserveState: true });
                                    }}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                        link.active
                                            ? 'bg-primary-600 text-white'
                                            : link.url
                                              ? 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                                              : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Override Modal */}
            {overrideEstate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
                    >
                        <h2 className="mb-1 text-lg font-bold text-slate-900">Subscription Override</h2>
                        <p className="mb-6 text-[13px] text-slate-500">
                            Modifying access for <span className="font-bold text-slate-700">{overrideEstate.name}</span>
                        </p>

                        <form onSubmit={handleOverride} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Selected Plan</label>
                                <select
                                    value={overrideData.plan_id}
                                    onChange={(e) => setOverrideData({ ...overrideData, plan_id: e.target.value })}
                                    className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                >
                                    <option value="">Select a plan</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Engine State</label>
                                    <select
                                        value={overrideData.status}
                                        onChange={(e) => setOverrideData({ ...overrideData, status: e.target.value })}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    >
                                        <option value="trial">Trialing</option>
                                        <option value="active">Active</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Billing Term</label>
                                    <select
                                        value={overrideData.billing_interval}
                                        onChange={(e) => setOverrideData({ ...overrideData, billing_interval: e.target.value })}
                                        className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="annual">Annual</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Override Logs</label>
                                <textarea
                                    value={overrideData.notes}
                                    onChange={(e) => setOverrideData({ ...overrideData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    placeholder="Enter administrative notes..."
                                />
                            </div>

                            <div className="flex gap-3 border-t border-slate-50 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setOverrideEstate(null)}
                                    className="flex-1 rounded border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-bold text-slate-400 transition-all hover:bg-slate-50 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded bg-slate-900 px-4 py-2.5 text-[12px] font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                                >
                                    Commit Override
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </ZeusLayout>
    );
}
