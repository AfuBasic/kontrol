import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Users,
    CreditCard,
    ArrowLeft,
    ShieldCheck,
    Banknote,
    Clock,
    BadgeCheck,
    Info,
    TrendingUp,
    ArrowUpRight,
    Activity,
    DollarSign,
    Calendar,
} from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Estate {
    id: number;
    name: string;
    email: string;
    address: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    subscription_record?: {
        plan?: { name: string; billing_interval: string };
        status: string;
    };
    settings?: {
        charge_type: 'estate' | 'residents';
    };
}

interface Analytics {
    total_revenue: number;
    monthly_revenue: number;
    outstanding_amount: number;
    success_rate: number;
}

interface Transaction {
    id: number;
    paystack_reference: string;
    amount: number;
    status: string;
    payment_method: string | null;
    created_at: string;
    invoice?: {
        user?: { name: string; email: string };
    };
}

interface Resident {
    id: number;
    user: { name: string; email: string };
    status: string;
    last_payment_at: string | null;
    last_amount: number;
    next_due: string | null;
}

interface Props {
    estate: Estate;
    residentStats: { total: number; active: number; trial: number; past_due: number; expired: number };
    analytics: Analytics;
    recentTransactions: Transaction[];
    residents: Resident[];
    admin: { name: string; email: string } | null;
}

export default function EstateShow({ estate, residentStats, analytics, recentTransactions, residents, admin }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount / 100);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <ZeusLayout>
            <Head title={`Estate: ${estate.name}`} />

            {/* Back Link */}
            <Link
                href="/zeus/estates"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-900 dark:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Estates
            </Link>

            {/* Estate Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0f1423] shadow-sm"
            >
                <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-50 dark:border-slate-800/30 p-8 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ring-1 ring-inset ${
                                    estate.status === 'active'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20'
                                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 dark:text-slate-600 ring-slate-200'
                                }`}
                            >
                                {estate.status}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-indigo-700 dark:text-indigo-300 uppercase ring-1 ring-indigo-200 dark:ring-indigo-500/20 ring-inset">
                                {estate.subscription_record?.plan?.name || 'No Plan'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{estate.name}</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                            {estate.settings?.charge_type === 'estate' ? 'Estate pays bulk' : 'Residents pay individual'} · Created{' '}
                            {formatDate(estate.created_at)}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={`/zeus/estates/${estate.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423] px-5 py-2.5 text-sm font-bold text-slate-900 dark:text-white shadow-sm transition-all hover:bg-slate-50 dark:bg-slate-800/50 active:scale-95"
                        >
                            Edit Estate
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-50 dark:divide-slate-800/30 bg-slate-50/30 dark:bg-slate-800/30 sm:grid-cols-4">
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Residents</p>
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{residentStats.total}</p>
                    </div>
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Active</p>
                        <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{residentStats.active}</p>
                    </div>
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Revenue (MTD)</p>
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(analytics.monthly_revenue)}</p>
                    </div>
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Outstanding</p>
                        <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(analytics.outstanding_amount)}</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: Analytics & Contacts */}
                <div className="space-y-8">
                    {/* Analytics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0f1423] p-5 shadow-sm">
                            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Lifetime Rev</p>
                            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(analytics.total_revenue)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0f1423] p-5 shadow-sm">
                            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Activity className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Success Rate</p>
                            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{analytics.success_rate}%</p>
                        </div>
                    </div>

                    {/* Primary Admin */}
                    <div className="rounded-3xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0f1423] p-8 shadow-sm">
                        <h3 className="mb-6 flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Primary Admin
                        </h3>
                        {admin ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Name</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{admin.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Email</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{admin.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 italic">No admin assigned yet.</p>
                        )}
                    </div>
                </div>

                {/* Right: Resident Payment Status */}
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0f1423] shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/30 px-8 py-6">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Resident Payment Status
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/20 dark:bg-slate-800/20">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Resident</th>
                                        <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Last Payment</th>
                                        <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Next Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                    {residents.map((resident) => (
                                        <tr key={resident.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-200/50/50 dark:bg-slate-800/20">
                                            <td className="px-8 py-4">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{resident.user.name}</div>
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500">{resident.user.email}</div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${
                                                        resident.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                    }`}
                                                >
                                                    {resident.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {formatCurrency(resident.last_amount)}
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(resident.last_payment_at)}</div>
                                            </td>
                                            <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 dark:text-slate-500">{formatDate(resident.next_due)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estate Transactions Table */}
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0f1423] shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/30 px-8 py-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                        <Banknote className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Estate Transactions
                    </h3>
                    <Link
                        href="/zeus/transactions"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:text-indigo-300"
                    >
                        View All <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/20 dark:bg-slate-800/20">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Date</th>
                                <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Resident</th>
                                <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Amount</th>
                                <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Status</th>
                                <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                            {recentTransactions.map((tx) => (
                                <tr key={tx.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-200/50/50 dark:bg-slate-800/20">
                                    <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 dark:text-slate-500">{new Date(tx.created_at).toLocaleString()}</td>
                                    <td className="px-8 py-4">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{tx.invoice?.user?.name || '—'}</div>
                                    </td>
                                    <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                                    <td className="px-8 py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${
                                                tx.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                            }`}
                                        >
                                            {tx.status === 'success' ? 'Paid' : tx.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 font-mono text-xs text-slate-400 dark:text-slate-500">{tx.paystack_reference}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ZeusLayout>
    );
}
