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
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    TrendingUp,
    Activity,
    ChevronDown,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    failed_volume: number;
    success_rate: number;
    average_value: number;
}

interface VolumeTrend {
    date: string;
    volume: number;
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
    volumeTrend: VolumeTrend[];
}

export default function TransactionsIndex({ transactions, estates, filters, stats, volumeTrend }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [estateId, setEstateId] = useState(filters.estate_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const handleFilter = () => {
        router.get(
            '/zeus/transactions',
            { search, status, estate_id: estateId, date_from: dateFrom, date_to: dateTo },
            { preserveState: true, replace: true }
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
        return '₦' + (amount / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-tight text-emerald-700 uppercase ring-1 ring-emerald-200 ring-inset dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Paid
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold tracking-tight text-rose-700 uppercase ring-1 ring-rose-200 ring-inset dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-tight text-amber-700 uppercase ring-1 ring-amber-200 ring-inset dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        Pending
                    </span>
                );
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-[#0a0e17]">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</p>
                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ZeusLayout>
            <Head title="Platform Transactions" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <Activity className="h-8 w-8 text-indigo-500" />
                            Financial Activity
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Real-time transaction monitoring and volume trends.
                        </p>
                    </div>
                </div>

                {/* Main KPI Grid */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Total Volume</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(stats?.total_volume || 0)}>
                            {formatCurrency(stats?.total_volume || 0)}
                        </p>
                    </div>
                    
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">30-Day Volume</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(stats?.monthly_volume || 0)}>
                            {formatCurrency(stats?.monthly_volume || 0)}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Average Transaction</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(stats?.average_value || 0)}>
                            {formatCurrency(stats?.average_value || 0)}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Success Rate</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                            {stats?.success_rate || 0}%
                        </p>
                    </div>
                </div>

                {/* Chart Section */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">30-Day Volume Trend</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Daily successful transaction volume</p>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={volumeTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: '#64748b' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    hide={true} 
                                    domain={['dataMin', 'dataMax + 10000']} 
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="volume" 
                                    stroke="#6366f1" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorVolume)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by resident, reference, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                className="w-full rounded-2xl border-slate-100 bg-white py-3 pr-4 pl-11 text-sm font-medium shadow-sm transition-all focus:border-slate-900 focus:ring-0 dark:border-slate-800 dark:bg-[#0f1423] dark:text-white dark:focus:border-slate-600"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Building2 className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={estateId}
                                    onChange={(e) => setEstateId(e.target.value)}
                                    className="appearance-none rounded-2xl border-slate-100 bg-white py-3 pr-10 pl-11 text-sm font-bold shadow-sm focus:border-slate-900 focus:ring-0 dark:border-slate-800 dark:bg-[#0f1423] dark:text-white dark:focus:border-slate-600"
                                >
                                    <option value="">All Estates</option>
                                    {estates.map((e) => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute top-1/2 right-4 h-3 w-3 -translate-y-1/2 text-slate-400" />
                            </div>

                            <div className="relative">
                                <Filter className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="appearance-none rounded-2xl border-slate-100 bg-white py-3 pr-10 pl-11 text-sm font-bold shadow-sm focus:border-slate-900 focus:ring-0 dark:border-slate-800 dark:bg-[#0f1423] dark:text-white dark:focus:border-slate-600"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="success">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="pending">Pending</option>
                                </select>
                                <ChevronDown className="absolute top-1/2 right-4 h-3 w-3 -translate-y-1/2 text-slate-400" />
                            </div>

                            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-[#0f1423]">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="border-none bg-transparent py-1.5 text-xs font-bold focus:ring-0 dark:text-white dark:[color-scheme:dark]"
                                />
                                <span className="text-slate-300 dark:text-slate-600">→</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="border-none bg-transparent py-1.5 text-xs font-bold focus:ring-0 dark:text-white dark:[color-scheme:dark]"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleFilter}
                                    className="flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                                    title="Reset Filters"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Date & Ref</th>
                                    <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Customer / Estate</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Method</th>
                                    <th className="px-8 py-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                {transactions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="rounded-full bg-slate-50 p-4 dark:bg-slate-800/50">
                                                    <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">No transactions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.data.map((tx) => (
                                        <tr
                                            key={tx.id}
                                            onClick={() => setSelectedTransaction(tx)}
                                            className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(tx.created_at)}</div>
                                                <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] tracking-tighter text-slate-400 uppercase">
                                                    {tx.paystack_reference}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {tx.invoice?.user?.name || tx.customer_email || 'System Payment'}
                                                </div>
                                                <div className="mt-0.5 text-[11px] text-slate-400">{tx.estate?.name || 'Kontrol HQ'}</div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</div>
                                            </td>
                                            <td className="px-8 py-5">{getStatusBadge(tx.status)}</td>
                                            <td className="px-8 py-5">
                                                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    <CreditCard className="h-3 w-3" />
                                                    {tx.payment_method || 'Paystack'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                                                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
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

                    <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/20 px-8 py-5 dark:border-slate-800/30 dark:bg-slate-800/10">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Page {transactions.current_page} of {transactions.last_page} · Total {transactions.total} records
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={transactions.current_page === 1}
                                onClick={() => router.get(transactions.links.find((l) => l.label === '&laquo; Previous')?.url || '')}
                                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:pointer-events-none disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <ChevronLeft className="h-4 w-4" /> Prev
                            </button>
                            <button
                                disabled={transactions.current_page === transactions.last_page}
                                onClick={() => router.get(transactions.links.find((l) => l.label === 'Next &raquo;')?.url || '')}
                                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:pointer-events-none disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedTransaction && (
                        <TransactionDetailModal 
                            transaction={selectedTransaction} 
                            onClose={() => setSelectedTransaction(null)} 
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                        />
                    )}
                </AnimatePresence>
            </div>
        </ZeusLayout>
    );
}

function TransactionDetailModal({ 
    transaction, 
    onClose, 
    formatCurrency, 
    formatDate 
}: { 
    transaction: Transaction; 
    onClose: () => void;
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[40px] bg-white shadow-2xl dark:bg-[#0f1423] dark:ring-1 dark:ring-white/10"
            >
                <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 px-10 py-8 dark:border-slate-800/50 dark:bg-slate-800/20">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Transaction Details</h2>
                        <p className="mt-1 flex items-center gap-2 font-mono text-xs tracking-tighter text-slate-400 uppercase">
                            {transaction.paystack_reference}
                            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            ID #{transaction.id}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-2xl bg-slate-100 p-3 transition-colors hover:bg-slate-200 active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700">
                        <X className="h-5 w-5 text-slate-900 dark:text-white" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-10 py-10">
                    <div className="mb-10 flex flex-col items-center justify-center rounded-[32px] bg-slate-900 py-10 text-white shadow-xl shadow-slate-900/10 dark:bg-indigo-500/10 dark:ring-1 dark:ring-indigo-500/20">
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-indigo-300/70">Paid Amount</p>
                        <p className="mt-2 text-5xl font-black dark:text-indigo-100">{formatCurrency(transaction.amount)}</p>
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
                            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{transaction.estate?.name || 'Kontrol HQ'}</p>
                            <p className="text-[11px] font-medium text-slate-500">ID: {transaction.estate?.id || 'SYSTEM'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Customer / Resident</p>
                            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{transaction.invoice?.user?.name || 'Bulk / System Payment'}</p>
                            <p className="text-[11px] font-medium text-slate-500">{transaction.invoice?.user?.email || transaction.customer_email}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Payment Method</p>
                            <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                                <CreditCard className="h-4 w-4 text-slate-400" />
                                {transaction.payment_method || 'Paystack Gateway'}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Verified At</p>
                            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                                {transaction.verified_at ? formatDate(transaction.verified_at) : 'Not yet verified'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-12">
                        <p className="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Transaction Metadata (JSON)</p>
                        <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-6 font-mono text-[11px] leading-relaxed text-slate-600 shadow-inner dark:border-slate-800/50 dark:bg-[#0a0e17] dark:text-slate-400">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(transaction.metadata, null, 2)}</pre>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-50 bg-slate-50/20 px-10 py-6 dark:border-slate-800/50 dark:bg-slate-800/10">
                    <button
                        onClick={onClose}
                        className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        Dismiss Details
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
