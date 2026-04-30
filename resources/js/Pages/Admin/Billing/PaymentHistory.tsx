import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import InvoiceController from '@/actions/App/Http/Controllers/Admin/InvoiceController';
import PaymentHistoryController from '@/actions/App/Http/Controllers/Admin/PaymentHistoryController';
import AdminLayout from '@/Layouts/AdminLayout';

type Payment = {
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    paid_at: string;
    paystack_reference?: string;
    plan?: {
        name: string;
    };
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    payments: {
        data: Payment[];
        current_page: number;
        from: number;
        to: number;
        total: number;
        per_page: number;
        last_page: number;
        links: PaginationLink[];
    };
};

export default function PaymentHistoryPage({ payments }: Props) {
    const totalReceived = payments.data.reduce((sum, payment) => sum + payment.amount, 0);

    return (
        <>
            <Head title="Payment History" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment History</h1>
                        <p className="mt-2 text-gray-600">All received payments</p>
                    </div>
                    <Link
                        href={InvoiceController.index.url()}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        View Invoices
                    </Link>
                </div>

                {/* Summary Card */}
                {payments.total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-700">Total Received</p>
                                <p className="mt-1 text-3xl font-bold text-emerald-900">
                                    ₦
                                    {(totalReceived / 100).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                                <p className="mt-2 text-xs text-emerald-600">
                                    From {payments.total} payment{payments.total !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Payments Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
                >
                    {payments.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Invoice</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Plan</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Paid Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.data.map((payment, idx) => (
                                            <motion.tr
                                                key={payment.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="border-b border-gray-100 transition-colors hover:bg-primary-50/30"
                                            >
                                                <td className="px-6 py-4">
                                                    <Link
                                                        href={InvoiceController.show.url(payment.id)}
                                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                                                    >
                                                        {payment.invoice_number}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{payment.plan?.name || '−'}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{payment.formatted_amount}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(payment.paid_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                                                        {payment.paystack_reference ? payment.paystack_reference.substring(0, 12) + '...' : '−'}
                                                    </code>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-gray-100 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Showing <span className="font-semibold">{payments.from}</span> to{' '}
                                        <span className="font-semibold">{payments.to}</span> of{' '}
                                        <span className="font-semibold">{payments.total}</span> payments
                                    </p>
                                    <div className="flex gap-2">
                                        {payments.links.map((link, idx) => {
                                            if (!link.url) return null;
                                            if (link.label.includes('&laquo;') || link.label.includes('&raquo;')) {
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        className={`rounded-lg p-2 transition-colors ${
                                                            link.active ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {link.label.includes('&laquo;') ? (
                                                            <ChevronLeftIcon className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRightIcon className="h-4 w-4" />
                                                        )}
                                                    </Link>
                                                );
                                            }
                                            return (
                                                <Link
                                                    key={idx}
                                                    href={link.url}
                                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                        link.active ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {link.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <CheckCircleIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                            <p className="text-gray-600">No payments recorded yet.</p>
                            <p className="mt-2 text-sm text-gray-500">Payments will appear here once invoices are paid.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    );
}
