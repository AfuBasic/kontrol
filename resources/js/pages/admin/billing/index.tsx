import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, CalendarIcon, CreditCardIcon, UsersIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/layouts/AdminLayout';
import InvoiceController from '@/actions/App/Http/Controllers/Admin/InvoiceController';

type StatCard = {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'green' | 'purple' | 'amber';
    delay: number;
};

type Invoice = {
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    status: string;
    due_date: string;
    paid_at?: string;
    created_at: string;
    plan?: {
        name: string;
    };
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
    };
    recentInvoices: {
        data: Invoice[];
        links: unknown;
    };
};

function StatCard({ title, value, subValue, icon: Icon, color, delay }: StatCard) {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            border: 'border-blue-100',
        },
        green: {
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            border: 'border-emerald-100',
        },
        purple: {
            bg: 'bg-violet-50',
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-600',
            border: 'border-violet-100',
        },
        amber: {
            bg: 'bg-amber-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            border: 'border-amber-100',
        },
    };

    const classes = colorClasses[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`relative overflow-hidden rounded-2xl border ${classes.border} ${classes.bg} p-6`}
        >
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/50 blur-3xl" />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    {subValue && <p className="mt-1 text-sm text-gray-500">{subValue}</p>}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${classes.iconBg} ${classes.iconColor}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </motion.div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200/80 ring-1 ring-yellow-200/50',
        paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 ring-1 ring-emerald-200/50',
        overdue: 'bg-red-50 text-red-700 border border-red-200/80 ring-1 ring-red-200/50',
    };

    const labels = {
        pending: 'Pending',
        paid: 'Paid',
        overdue: 'Overdue',
    };

    return (
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}

export default function BillingPage({ overview, recentInvoices }: Props) {
    const stats: StatCard[] = [
        {
            title: 'Current Plan',
            value: overview.plan_name,
            icon: CreditCardIcon,
            color: 'blue',
            delay: 0,
        },
        {
            title: overview.trial_status === 'active' ? 'Free Trial Until' : 'Next Billing',
            value: new Date(overview.next_billing_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
            subValue: overview.next_billing_date,
            icon: CalendarIcon,
            color: overview.trial_status === 'active' ? 'green' : 'purple',
            delay: 0.1,
        },
        {
            title: 'Active Residents',
            value: overview.active_residents.toString(),
            icon: UsersIcon,
            color: 'green',
            delay: 0.2,
        },
        {
            title: 'Outstanding Balance',
            value: overview.outstanding_invoices.toString(),
            subValue: overview.trial_status === 'active' ? 'not applicable' : 'pending invoices',
            icon: ArrowTrendingUpIcon,
            color: overview.outstanding_invoices > 0 && !overview.trial_status ? 'amber' : 'blue',
            delay: 0.3,
        },
    ];

    return (
        <AdminLayout>
            <Head title="Billing" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Billing</h1>
                        <p className="mt-2 text-gray-600">Manage invoices and payments</p>
                    </div>
                    {!overview.trial_status && (
                        <Link
                            href={InvoiceController.index.url()}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                        >
                            View All Invoices
                        </Link>
                    )}
                </div>

                {/* Trial Banner */}
                {overview.trial_status === 'active' && overview.trial_ends_at && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4"
                    >
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.5 1A1.5 1.5 0 001 2.5v15A1.5 1.5 0 002.5 19h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0017.5 1h-15zM7 9a2 2 0 100-4 2 2 0 000 4zm7-2a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-blue-800">30-Day Free Trial</h3>
                                <p className="mt-1 text-sm text-blue-700">
                                    You're currently on a free trial. Billing starts on{' '}
                                    <span className="font-semibold">
                                        {new Date(overview.trial_ends_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Overdue Banner */}
                {overview.has_overdue && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Overdue Invoice</h3>
                                <p className="mt-1 text-sm text-red-700">
                                    You have an outstanding overdue invoice. Payment is required to continue using premium features.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Stats Grid */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>

                {/* Recent Invoices */}
                {!overview.trial_status && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="rounded-2xl border border-gray-100 bg-white"
                    >
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
                        </div>

                        {recentInvoices.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Invoice</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Due Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentInvoices.data.map((invoice, idx) => (
                                            <motion.tr
                                                key={invoice.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="border-b border-gray-100 transition-colors hover:bg-primary-50/30"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{invoice.formatted_amount}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(invoice.due_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <StatusBadge status={invoice.status} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={InvoiceController.show.url(invoice.id)}
                                                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <p className="text-gray-600">No invoices yet. Your first invoice will be generated on your next billing date.</p>
                            </div>
                        )}

                        <div className="border-t border-gray-100 px-6 py-4 text-center">
                            <Link href={InvoiceController.index.url()} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                                View all invoices →
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}
