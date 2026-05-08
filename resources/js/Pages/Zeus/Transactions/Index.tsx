import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Calendar,
    Building2,
    ChevronLeft,
    ChevronRight,
    X,
    Eye,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    TrendingUp,
    Activity,
    Users,
    ChevronDown,
    RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Transaction {
    id: number;
    paystack_reference: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    payment_method: string | null;
    customer_email: string | null;
    created_at: string;
    verified_at: string | null;
    metadata: any;
    estate: {
        id: number;
        name: string;
    } | null;
    invoice?: {
        id: number;
        invoice_number: string;
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
}

interface Stats {
    total_volume: number;
    monthly_volume: number;
    success_rate: number;
    resident_trials: number;
    estate_trials: number;
}

interface Props {
    transactions: {
        data: Transaction[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
    };
    estates: { id: number; name: string }[];
    filters: {
        search: string;
        estate_id: string;
        status: string;
        date_from: string;
        date_to: string;
    };
    stats: Stats;
}

export default function TransactionsIndex({ transactions, estates, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [estateId, setEstateId] = useState(filters.estate_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const handleFilter = () => {
        router.get(
            '/zeus/transactions',
            {
                search,
                status,
                estate_id: estateId,
                date_from: dateFrom,
                date_to: dateTo,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setEstateId('');
        setDateFrom('');
        setDateTo('');
        router.get('/zeus/transactions', {}, { replace: true });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-tight text-emerald-700 uppercase ring-1 ring-emerald-200 ring-inset">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Paid
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold tracking-tight text-rose-700 uppercase ring-1 ring-rose-200 ring-inset">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-tight text-amber-700 uppercase ring-1 ring-amber-200 ring-inset">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        Pending
                    </span>
                );
        }
    };

    return (
        <ZeusLayout>
            <Head title="Platform Transactions" />

            {/* Header Section */}
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Transactions</h1>
                    <p className="mt-1 font-medium text-slate-500">Real-time financial monitor for the platform.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Activity className="h-4 w-4" />
                    <span>Updated just now</span>
                </div>
            </div>

            {/* Stats Metrics Grid */}
            <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    { label: 'Total Volume', value: formatCurrency(stats?.total_volume || 0), icon: DollarSign, color: 'indigo' },
                    { label: 'Monthly Rev', value: formatCurrency(stats?.monthly_volume || 0), icon: TrendingUp, color: 'emerald' },
                    { label: 'Success Rate', value: `${stats?.success_rate || 0}%`, icon: CheckCircle2, color: 'blue' },
                    { label: 'Resident Trials', value: stats?.resident_trials || 0, icon: Users, color: 'amber' },
                    { label: 'Estate Trials', value: stats?.estate_trials || 0, icon: Building2, color: 'rose' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md"
                    >
                        <div
                            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 transition-transform group-hover:scale-110`}
                        >
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">{stat.label}</p>
                        <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Advanced Filtering Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by resident, reference, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            className="w-full rounded-2xl border-slate-100 bg-white py-3 pr-4 pl-11 text-sm font-medium shadow-sm transition-all focus:border-slate-900 focus:ring-0"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Building2 className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={estateId}
                                onChange={(e) => setEstateId(e.target.value)}
                                className="appearance-none rounded-2xl border-slate-100 bg-white py-3 pr-10 pl-11 text-sm font-bold shadow-sm focus:border-slate-900 focus:ring-0"
                            >
                                <option value="">All Estates</option>
                                {estates.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute top-1/2 right-4 h-3 w-3 -translate-y-1/2 text-slate-400" />
                        </div>

                        <div className="relative">
                            <Filter className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="appearance-none rounded-2xl border-slate-100 bg-white py-3 pr-10 pl-11 text-sm font-bold shadow-sm focus:border-slate-900 focus:ring-0"
                            >
                                <option value="">All Statuses</option>
                                <option value="success">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="pending">Pending</option>
                            </select>
                            <ChevronDown className="absolute top-1/2 right-4 h-3 w-3 -translate-y-1/2 text-slate-400" />
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="border-none bg-transparent py-1.5 text-xs font-bold focus:ring-0"
                            />
                            <span className="text-slate-300">→</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="border-none bg-transparent py-1.5 text-xs font-bold focus:ring-0"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleFilter}
                                className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={resetFilters}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:text-slate-900 active:scale-95"
                                title="Reset Filters"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Transactions Table Section */}
            <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/30">
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Date & Reference</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Resident / Estate</th>
                                <th className="px-8 py-5 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Method</th>
                                <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="rounded-full bg-slate-50 p-4">
                                                <Search className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">No transactions found</p>
                                            <p className="text-xs text-slate-500">Try adjusting your filters to find what you're looking for.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.data.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        onClick={() => setSelectedTransaction(tx)}
                                        className="group cursor-pointer transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-900">{formatDate(tx.created_at)}</div>
                                            <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] tracking-tighter text-slate-400 uppercase">
                                                {tx.paystack_reference}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-900">
                                                {tx.invoice?.user?.name || tx.customer_email || 'System Payment'}
                                            </div>
                                            <div className="mt-0.5 text-xs text-slate-400">{tx.estate?.name || 'Kontrol HQ'}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-sm font-black text-slate-900">{formatCurrency(tx.amount)}</div>
                                        </td>
                                        <td className="px-8 py-6">{getStatusBadge(tx.status)}</td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                <CreditCard className="h-3 w-3" />
                                                {tx.payment_method || 'Paystack'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                                                <div className="rounded-lg bg-slate-900 p-2 text-white">
                                                    <Eye className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Refined Pagination Section */}
                <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/20 px-8 py-6">
                    <p className="text-xs font-bold tracking-tight text-slate-400 uppercase">
                        Page {transactions.current_page} of {transactions.last_page} · Total {transactions.total} records
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={transactions.current_page === 1}
                            onClick={() => router.get(transactions.links.find((l) => l.label === '&laquo; Previous')?.url || '')}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                            disabled={transactions.current_page === transactions.last_page}
                            onClick={() => router.get(transactions.links.find((l) => l.label === 'Next &raquo;')?.url || '')}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            <AnimatePresence>
                {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
            </AnimatePresence>
        </ZeusLayout>
    );
}

function TransactionDetailModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        }).format(amount / 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[40px] bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 px-10 py-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Transaction Details</h2>
                        <p className="mt-1 flex items-center gap-2 font-mono text-xs tracking-tighter text-slate-400 uppercase">
                            {transaction.paystack_reference}
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            ID #{transaction.id}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-2xl bg-slate-100 p-3 transition-colors hover:bg-slate-200 active:scale-90">
                        <X className="h-5 w-5 text-slate-900" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-10 py-10">
                    {/* Hero Amount Section */}
                    <div className="mb-10 flex flex-col items-center justify-center rounded-[32px] bg-slate-900 py-10 text-white shadow-xl shadow-slate-900/10">
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Paid Amount</p>
                        <p className="mt-2 text-5xl font-black">{formatCurrency(transaction.amount)}</p>
                        <div className="mt-6">
                            {transaction.status === 'success' ? (
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Transaction Successful
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-4 py-1.5 text-xs font-bold text-rose-400 ring-1 ring-rose-500/30">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                    {transaction.status}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate Entity</p>
                            <p className="mt-2 text-sm font-black text-slate-900">{transaction.estate?.name || 'Kontrol HQ'}</p>
                            <p className="text-[11px] font-medium text-slate-500">ID: {transaction.estate?.id || 'SYSTEM'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Resident / Customer</p>
                            <p className="mt-2 text-sm font-black text-slate-900">{transaction.invoice?.user?.name || 'Bulk Payment'}</p>
                            <p className="text-[11px] font-medium text-slate-500">{transaction.invoice?.user?.email || transaction.customer_email}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Payment Method</p>
                            <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-900">
                                <CreditCard className="h-4 w-4 text-slate-400" />
                                {transaction.payment_method || 'Paystack Gateway'}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Verified At</p>
                            <p className="mt-2 text-sm font-black text-slate-900">
                                {transaction.verified_at ? new Date(transaction.verified_at).toLocaleString() : 'Not yet verified'}
                            </p>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="mt-12">
                        <p className="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Transaction Metadata (JSON)</p>
                        <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-6 font-mono text-[11px] leading-relaxed text-slate-600 shadow-inner">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(transaction.metadata, null, 2)}</pre>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-50 bg-slate-50/20 px-10 py-8">
                    <button
                        onClick={onClose}
                        className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
                    >
                        Dismiss Details
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
