import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowPathIcon, 
    CalendarIcon, 
    CreditCardIcon, 
    UsersIcon, 
    CheckBadgeIcon, 
    ExclamationCircleIcon,
    ArrowTopRightOnSquareIcon,
    ShieldCheckIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/Layouts/AdminLayout';
import BillingController from '@/actions/App/Http/Controllers/Admin/BillingController';
import InvoiceController from '@/actions/App/Http/Controllers/Admin/InvoiceController';

type Invoice = {
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    status: 'pending' | 'paid' | 'overdue';
    due_date: string;
    paid_at?: string;
    created_at: string;
};

type Props = {
    overview: {
        plan_name: string;
        next_billing_date: string;
        trial_status?: string | null;
        trial_ends_at?: string | null;
        outstanding_invoices: number;
        active_residents: number;
        upcoming_amount: string;
        has_overdue: boolean;
        billing_preference: 'auto' | 'manual';
        has_saved_card: boolean;
        card_brand?: string;
        card_last4?: string;
        residents_rate: number;
        resident_payment_stats: {
            paid: number;
            pending: number;
            expired: number;
        };
    };
    recentInvoices: {
        data: Invoice[];
    };
    chargeType: 'estate' | 'residents';
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(amount / 100);
};

export default function BillingPage({ overview, recentInvoices, chargeType }: Props) {
    const toggleAutoRenewal = () => {
        const nextPreference = overview.billing_preference === 'auto' ? 'manual' : 'auto';
        router.patch(BillingController.updatePreference.url(), {
            billing_preference: nextPreference 
        }, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Billing & Subscriptions" />

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
                                <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                                    Billing Overview
                                </h1>
                                <p className="mt-3 text-lg font-medium text-indigo-100">
                                    Manage your estate's premium subscription and resident payments.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {chargeType === 'estate' && overview.outstanding_invoices > 0 && (
                                    <Link
                                        href={InvoiceController.showPending.url()}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-900 shadow-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        <BanknotesIcon className="h-5 w-5" />
                                        Settle Balance
                                    </Link>
                                )}
                                <Link
                                    href={InvoiceController.index.url()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/30 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-indigo-600/50"
                                >
                                    Invoice History
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="mx-auto -mt-20 max-w-7xl px-6">
                    <div className="grid gap-8 lg:grid-cols-3">
                        
                        {/* Left Column: Plan & Subscription */}
                        <div className="space-y-8 lg:col-span-2">
                            
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
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                                                Active Plan
                                            </span>
                                            {overview.trial_status === 'active' && (
                                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                                                    Trial
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="mt-4 text-4xl font-black text-gray-900">{overview.plan_name}</h2>
                                        <div className="mt-6 flex items-center gap-6 text-sm font-medium text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <UsersIcon className="h-5 w-5 text-indigo-500" />
                                                <span>{overview.active_residents} Active Residents</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-5 w-5 text-indigo-500" />
                                                <span>Next Billing: {new Date(overview.next_billing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-sm font-bold text-gray-400">Monthly Rate</p>
                                        <p className="text-4xl font-black text-indigo-600">{formatCurrency(overview.residents_rate)}</p>
                                        <p className="text-xs font-medium text-gray-400">per resident</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Resident Stats (if chargeType === 'residents') */}
                            {chargeType === 'residents' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="grid grid-cols-1 gap-6 sm:grid-cols-3"
                                >
                                    <div className="rounded-[2rem] bg-emerald-50 p-6 border border-emerald-100">
                                        <p className="text-sm font-bold text-emerald-700 uppercase tracking-tight">Paid Residents</p>
                                        <p className="mt-2 text-3xl font-black text-emerald-900">{overview.resident_payment_stats.paid}</p>
                                        <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-200">
                                            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(overview.resident_payment_stats.paid / (overview.active_residents || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="rounded-[2rem] bg-amber-50 p-6 border border-amber-100">
                                        <p className="text-sm font-bold text-amber-700 uppercase tracking-tight">Pending/Past Due</p>
                                        <p className="mt-2 text-3xl font-black text-amber-900">{overview.resident_payment_stats.pending}</p>
                                        <div className="mt-4 h-1.5 w-full rounded-full bg-amber-200">
                                            <div className="h-full rounded-full bg-amber-600" style={{ width: `${(overview.resident_payment_stats.pending / (overview.active_residents || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="rounded-[2rem] bg-red-50 p-6 border border-red-100">
                                        <p className="text-sm font-bold text-red-700 uppercase tracking-tight">Expired Accounts</p>
                                        <p className="mt-2 text-3xl font-black text-red-900">{overview.resident_payment_stats.expired}</p>
                                        <div className="mt-4 h-1.5 w-full rounded-full bg-red-200">
                                            <div className="h-full rounded-full bg-red-600" style={{ width: `${(overview.resident_payment_stats.expired / (overview.active_residents || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Recent Invoices Table */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl"
                            >
                                <div className="flex items-center justify-between border-b border-gray-50 px-8 py-6">
                                    <h3 className="text-xl font-bold text-gray-900">Recent Invoices</h3>
                                    <Link href={InvoiceController.index.url()} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                                        View All
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-400">
                                                <th className="px-8 py-4">Invoice</th>
                                                <th className="px-8 py-4">Amount</th>
                                                <th className="px-8 py-4">Due Date</th>
                                                <th className="px-8 py-4">Status</th>
                                                <th className="px-8 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {recentInvoices.data.length > 0 ? recentInvoices.data.map((invoice, idx) => (
                                                <tr key={invoice.id} className="transition-colors hover:bg-indigo-50/30">
                                                    <td className="whitespace-nowrap px-8 py-5 text-sm font-bold text-gray-900">
                                                        {invoice.invoice_number}
                                                    </td>
                                                    <td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-gray-600">
                                                        {invoice.formatted_amount}
                                                    </td>
                                                    <td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-gray-500">
                                                        {new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="whitespace-nowrap px-8 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                                            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {invoice.status === 'paid' && <CheckBadgeIcon className="h-3.5 w-3.5" />}
                                                            {invoice.status === 'overdue' && <ExclamationCircleIcon className="h-3.5 w-3.5" />}
                                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-8 py-5 text-right">
                                                        <Link 
                                                            href={InvoiceController.show.url(invoice.id)}
                                                            className="text-sm font-bold text-indigo-600 hover:indigo-700"
                                                        >
                                                            Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-12 text-center text-sm font-medium text-gray-400">
                                                        No recent billing activity found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column: Payment Method & Settings */}
                        <div className="space-y-8">
                            
                            {/* Payment Method Card */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-[2.5rem] border border-white/40 bg-white shadow-2xl"
                            >
                                <div className="p-8">
                                    <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                                    
                                    {overview.has_saved_card ? (
                                        <div className="mt-6 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white shadow-lg">
                                            <div className="flex items-start justify-between">
                                                <CreditCardIcon className="h-10 w-10 text-gray-400" />
                                                <div className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                                    {overview.card_brand}
                                                </div>
                                            </div>
                                            <div className="mt-8">
                                                <p className="text-xs font-bold tracking-widest text-gray-400">CARD NUMBER</p>
                                                <p className="mt-1 text-xl font-mono tracking-widest">•••• •••• •••• {overview.card_last4}</p>
                                            </div>
                                            <div className="mt-6 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized via Paystack</span>
                                                <CheckBadgeIcon className="h-5 w-5 text-indigo-400" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-8 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                                <CreditCardIcon className="h-6 w-6" />
                                            </div>
                                            <p className="mt-4 text-sm font-bold text-gray-600">No saved card</p>
                                            <p className="mt-1 text-xs font-medium text-gray-400">Complete a payment to authorize auto-renewal.</p>
                                        </div>
                                    )}

                                    {/* Auto Renewal Toggle */}
                                    <div className="mt-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Auto-Renewal</p>
                                                <p className="text-xs font-medium text-gray-400">Automatically charge saved card</p>
                                            </div>
                                            <button 
                                                onClick={toggleAutoRenewal}
                                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                                                    overview.billing_preference === 'auto' ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                            >
                                                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    overview.billing_preference === 'auto' ? 'translate-x-5' : 'translate-x-0'
                                                }`} />
                                            </button>
                                        </div>

                                        {chargeType === 'estate' && (
                                            <div className="rounded-2xl bg-indigo-50 p-4">
                                                <div className="flex gap-3">
                                                    <BanknotesIcon className="h-5 w-5 text-indigo-600" />
                                                    <div>
                                                        <p className="text-xs font-bold text-indigo-900">Upcoming Payment</p>
                                                        <p className="mt-1 text-lg font-black text-indigo-600">{overview.upcoming_amount}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Help & Security Card */}
                            <div className="rounded-[2.5rem] bg-indigo-900 p-8 text-white shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                                        <ShieldCheckIcon className="h-6 w-6 text-indigo-300" />
                                    </div>
                                    <h3 className="text-lg font-bold">Secure Payments</h3>
                                </div>
                                <p className="mt-4 text-sm font-medium leading-relaxed text-indigo-200">
                                    All transactions are processed securely via Paystack. We do not store your full card details on our servers.
                                </p>
                                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">PCI Compliant</span>
                                    <ArrowPathIcon className="h-5 w-5 text-indigo-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
