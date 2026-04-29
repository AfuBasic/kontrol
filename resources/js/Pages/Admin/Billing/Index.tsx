import { Dialog, Transition } from '@headlessui/react';
import {
    UsersIcon,
    ShieldCheckIcon,
    ArrowUpCircleIcon,
    ClockIcon,
    XMarkIcon,
    CheckBadgeIcon,
    ExclamationCircleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Fragment, useState, useEffect, useRef } from 'react';

type Transaction = {
    id: number;
    amount: number;
    currency: string;
    status: string;
    paystack_reference: string;
    recorded_at: string;
    created_at: string;
    user?: {
        name: string;
        email: string;
    };
};

type Props = {
    overview: {
        plan_name: string;
        active_residents: number;
        residents_rate: number;
        trial_days: number;
        resident_payment_stats: {
            paid: number;
            pending: number;
            expired: number;
        };
    };
    transactions: {
        data: Transaction[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from?: number;
        to?: number;
        total?: number;
    };
    filters?: {
        search?: string;
        status?: string;
    };
};

const formatCurrency = (amount: number | string | null | undefined) => {
    const num = Number(amount) || 0;
    return `₦${(num / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export default function BillingPage({ overview, transactions, filters }: Props) {
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(window.location.pathname, { search, status }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search, status]);

    return (
        <>
            <Head title="Subscriptions Overview" />

            <div className="min-h-screen bg-[#F8FAFC] pb-20">
                {/* Gradient Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-800 to-fuchsia-900 px-6 pt-16 pb-32">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl" />
                        <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-indigo-400 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col justify-between gap-6 md:flex-row md:items-end"
                        >
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">Subscriptions Overview</h1>
                                <p className="mt-3 text-lg font-medium text-indigo-100">
                                    Manage your estate's plan and monitor resident subscriptions.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="relative z-10 mx-auto -mt-20 max-w-7xl px-6">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Left Column: Plan Overview */}
                        <div className="space-y-8 lg:col-span-3">
                            {/* Plan Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="group relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-xl transition-all hover:shadow-indigo-500/10"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110">
                                    <ShieldCheckIcon className="h-32 w-32 text-indigo-600" />
                                </div>

                                <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold tracking-wider text-indigo-700 uppercase">
                                                Active Plan
                                            </span>
                                        </div>
                                        <h2 className="mt-4 text-4xl font-black text-gray-900">{overview.plan_name || 'No Plan'}</h2>
                                        <div className="mt-6 flex items-center gap-6 text-sm font-medium text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <UsersIcon className="h-5 w-5 text-indigo-500" />
                                                <span>{overview.active_residents} Active Residents</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="h-5 w-5 text-indigo-500" />
                                                <span>Trial given: {overview.trial_days ?? 0} days</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-sm font-bold text-gray-400">Monthly Rate</p>
                                        <p className="text-4xl font-black text-indigo-600">{formatCurrency(overview.residents_rate ?? 0)}</p>
                                        <p className="text-xs font-medium text-gray-400">per resident</p>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-gray-100 pt-6">
                                    <button
                                        onClick={() => alert('The plan upgrade flow will be implemented here soon!')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-indigo-500"
                                    >
                                        <ArrowUpCircleIcon className="h-5 w-5" />
                                        Upgrade Estate Plan
                                    </button>
                                </div>
                            </motion.div>

                            {/* Resident Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="grid grid-cols-1 gap-6 sm:grid-cols-3"
                            >
                                <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                                    <p className="text-sm font-bold tracking-tight text-emerald-700 uppercase">Paid Residents</p>
                                    <p className="mt-2 text-3xl font-black text-emerald-900">{overview.resident_payment_stats?.paid ?? 0}</p>
                                    <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-200">
                                        <div
                                            className="h-full rounded-full bg-emerald-600"
                                            style={{
                                                width: `${((overview.resident_payment_stats?.paid ?? 0) / (overview.active_residents || 1)) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6">
                                    <p className="text-sm font-bold tracking-tight text-amber-700 uppercase">Pending/Trial</p>
                                    <p className="mt-2 text-3xl font-black text-amber-900">{overview.resident_payment_stats?.pending ?? 0}</p>
                                    <div className="mt-4 h-1.5 w-full rounded-full bg-amber-200">
                                        <div
                                            className="h-full rounded-full bg-amber-600"
                                            style={{
                                                width: `${((overview.resident_payment_stats?.pending ?? 0) / (overview.active_residents || 1)) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
                                    <p className="text-sm font-bold tracking-tight text-red-700 uppercase">Expired Accounts</p>
                                    <p className="mt-2 text-3xl font-black text-red-900">{overview.resident_payment_stats?.expired ?? 0}</p>
                                    <div className="mt-4 h-1.5 w-full rounded-full bg-red-200">
                                        <div
                                            className="h-full rounded-full bg-red-600"
                                            style={{
                                                width: `${((overview.resident_payment_stats?.expired ?? 0) / (overview.active_residents || 1)) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Resident Transactions Table */}
                    <div className="mt-12 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl">
                        <div className="flex flex-col gap-4 border-b border-gray-50 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Resident Transactions</h3>
                                <p className="mt-1 text-sm font-medium text-gray-500">Recent subscription payments made by your residents.</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search residents..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:w-64"
                                    />
                                </div>
                                <div className="relative">
                                    <FunnelIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-gray-200 py-2 pr-10 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="success">Success</option>
                                        <option value="pending">Pending</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                        <th className="px-8 py-4">Resident</th>
                                        <th className="px-8 py-4">Amount</th>
                                        <th className="px-8 py-4">Date</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.data.length > 0 ? (
                                        transactions.data.map((tx) => (
                                            <tr key={tx.id} className="transition-colors hover:bg-indigo-50/30">
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <p className="text-sm font-bold text-gray-900">{tx.user ? tx.user.name : 'Unknown'}</p>
                                                    <p className="text-xs font-medium text-gray-500">{tx.user?.email}</p>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-medium whitespace-nowrap text-gray-600">
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                                <td className="px-8 py-5 text-sm font-medium whitespace-nowrap text-gray-500">
                                                    {new Date(tx.recorded_at || tx.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                                            tx.status === 'success'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : tx.status === 'failed'
                                                                  ? 'bg-red-100 text-red-700'
                                                                  : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {tx.status === 'success' && <CheckBadgeIcon className="h-3.5 w-3.5" />}
                                                        {tx.status === 'failed' && <ExclamationCircleIcon className="h-3.5 w-3.5" />}
                                                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => setSelectedTx(tx)}
                                                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 focus:outline-none"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-sm font-medium text-gray-400">
                                                No recent transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Links */}
                        {transactions.links && transactions.links.length > 3 && (
                            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-8 py-4">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <Link
                                        href={transactions.links[0].url || '#'}
                                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Previous
                                    </Link>
                                    <Link
                                        href={transactions.links[transactions.links.length - 1].url || '#'}
                                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Next
                                    </Link>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{transactions.from || 0}</span> to{' '}
                                            <span className="font-medium">{transactions.to || 0}</span> of{' '}
                                            <span className="font-medium">{transactions.total || 0}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            {transactions.links.map((link, i) => (
                                                <Link
                                                    key={i}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${link.active ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' : 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50'} ${i === 0 ? 'rounded-l-md' : ''} ${i === transactions.links.length - 1 ? 'rounded-r-md' : ''}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            <Transition appear show={!!selectedTx} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setSelectedTx(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-8 text-left align-middle shadow-2xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                                            Transaction Details
                                        </Dialog.Title>
                                        <button
                                            onClick={() => setSelectedTx(null)}
                                            className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {selectedTx && (
                                        <div className="mt-8 space-y-6">
                                            <div className="rounded-2xl bg-gray-50 p-6 text-center">
                                                <p className="text-sm font-medium tracking-widest text-gray-500 uppercase">Amount Paid</p>
                                                <p className="mt-2 text-4xl font-black text-indigo-600">{formatCurrency(selectedTx.amount)}</p>
                                                <span
                                                    className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                                        selectedTx.status === 'success'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : selectedTx.status === 'failed'
                                                              ? 'bg-red-100 text-red-700'
                                                              : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {selectedTx.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="space-y-4 rounded-2xl border border-gray-100 p-6">
                                                <div>
                                                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Resident</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-900">
                                                        {selectedTx.user ? selectedTx.user.name : 'Unknown'}
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-500">{selectedTx.user?.email}</p>
                                                </div>
                                                <div className="border-t border-gray-50 pt-4">
                                                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Reference</p>
                                                    <p className="mt-1 font-mono text-sm font-medium break-all text-gray-700">
                                                        {selectedTx.paystack_reference || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="border-t border-gray-50 pt-4">
                                                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Date & Time</p>
                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {new Date(selectedTx.recorded_at || selectedTx.created_at).toLocaleString('en-US', {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
