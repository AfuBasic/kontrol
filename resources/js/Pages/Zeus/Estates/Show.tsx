import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { 
    UsersIcon, 
    CreditCardIcon, 
    CalendarIcon, 
    ArrowLeftIcon,
    ShieldCheckIcon,
    BanknotesIcon,
    ClockIcon,
    CheckBadgeIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Plan {
    id: number;
    name: string;
    price: number;
    billing_interval: string;
}

interface EstateSubscription {
    id: number;
    plan: Plan;
    billing_preference: 'auto' | 'manual';
    status: string;
    next_billing_at?: string;
}

interface Estate {
    id: number;
    name: string;
    email: string;
    address: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    subscription_record?: EstateSubscription;
    settings?: {
        charge_type: 'estate' | 'residents';
        free_trial_days: number;
        grace_period_days: number;
    };
}

interface Invoice {
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    status: string;
    created_at: string;
    plan?: { name: string };
    user?: { name: string; email: string };
}

interface ResidentStats {
    total: number;
    active: number;
    trial: number;
    past_due: number;
    expired: number;
}

interface Props {
    estate: Estate;
    residentStats: ResidentStats;
    recentInvoices: Invoice[];
    admin: { name: string; email: string } | null;
}

export default function EstateShow({ estate, residentStats, recentInvoices, admin }: Props) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
            case 'active':
                return 'bg-green-50 text-green-700 ring-green-200';
            case 'pending':
            case 'trial':
                return 'bg-blue-50 text-blue-700 ring-blue-200';
            case 'overdue':
            case 'past_due':
                return 'bg-red-50 text-red-700 ring-red-200';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-200';
        }
    };

    return (
        <ZeusLayout>
            <Head title={`Estate: ${estate.name}`} />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <Link
                    href="/zeus/estates"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Estates
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${estate.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                {estate.status} Estate
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{estate.name}</h1>
                        <p className="mt-1 text-slate-500">{estate.address || 'No address provided'}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={`/zeus/estates/${estate.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                        >
                            Edit Settings
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    { label: 'Total Residents', value: residentStats.total, icon: UsersIcon, color: 'indigo' },
                    { label: 'Active', value: residentStats.active, icon: CheckBadgeIcon, color: 'green' },
                    { label: 'In Trial', value: residentStats.trial, icon: ClockIcon, color: 'blue' },
                    { label: 'Past Due', value: residentStats.past_due, icon: ExclamationTriangleIcon, color: 'amber' },
                    { label: 'Expired', value: residentStats.expired, icon: ShieldCheckIcon, color: 'red' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                    >
                        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column: Details */}
                <div className="space-y-8 lg:col-span-1">
                    {/* Subscription Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
                    >
                        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                            <CreditCardIcon className="h-5 w-5 text-indigo-600" />
                            Subscription Details
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                <span className="text-sm text-slate-500">Current Plan</span>
                                <span className="text-sm font-bold text-slate-900">
                                    {estate.subscription_record?.plan?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                <span className="text-sm text-slate-500">Billing Interval</span>
                                <span className="text-sm font-bold text-slate-900 capitalize">
                                    {estate.subscription_record?.plan?.billing_interval || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                <span className="text-sm text-slate-500">Charge Model</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-100">
                                    {estate.settings?.charge_type === 'estate' ? 'Estate Bulk' : 'Individual Residents'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Next Billing</span>
                                <span className="text-sm font-bold text-slate-900">
                                    {formatDate(estate.subscription_record?.next_billing_at)}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Admin Contact Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
                    >
                        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                            <InformationCircleIcon className="h-5 w-5 text-indigo-600" />
                            Primary Admin
                        </h3>
                        {admin ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Full Name</p>
                                    <p className="text-sm font-bold text-slate-900">{admin.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Email Address</p>
                                    <p className="text-sm font-bold text-slate-900">{admin.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-slate-50 p-4 text-center">
                                <p className="text-sm font-medium text-slate-500">No active admin found.</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Right Column: Invoices */}
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="rounded-3xl border border-slate-100 bg-white shadow-sm"
                    >
                        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <BanknotesIcon className="h-5 w-5 text-indigo-600" />
                                Recent Invoices
                            </h3>
                            <Link href="/zeus/subscriptions" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                                View Full History
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Number</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Target</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Amount</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Status</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-sm text-slate-500">
                                                No invoices generated for this estate yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentInvoices.map((invoice) => (
                                            <tr key={invoice.id} className="transition-colors hover:bg-slate-50/50">
                                                <td className="px-8 py-4 text-sm font-bold text-slate-900">{invoice.invoice_number}</td>
                                                <td className="px-8 py-4">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {invoice.user?.name || 'Estate Bulk'}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {invoice.user?.email || 'Admin Billing'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-900">{invoice.formatted_amount}</td>
                                                <td className="px-8 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${getStatusColor(invoice.status)}`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-sm text-slate-500">{formatDate(invoice.created_at)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </ZeusLayout>
    );
}

function ExclamationTriangleIcon(props: any) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
    );
}
