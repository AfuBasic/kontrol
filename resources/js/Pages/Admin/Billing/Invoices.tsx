import { ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import InvoiceController from '@/actions/App/Http/Controllers/Admin/InvoiceController';
import AdminLayout from '@/Layouts/AdminLayout';

type Invoice = {
    ulid: string;
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    resident_count: number;
    billing_period_start: string;
    billing_period_end: string;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue';
    paid_at?: string;
    created_at: string;
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
    invoices: {
        data: Invoice[];
        current_page: number;
        from: number;
        to: number;
        total: number;
        per_page: number;
        last_page: number;
        links: PaginationLink[];
    };
};

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-warning-50 text-warning-700 border border-warning-200/80',
        paid: 'bg-success-50 text-success-700 border border-success-200/80',
        overdue: 'bg-error-50 text-error-700 border border-error-200/80',
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

export default function InvoicesPage({ invoices }: Props) {
    const [statusFilter, setStatusFilter] = useState<string>('');

    const filteredInvoices = statusFilter ? invoices.data.filter((inv) => inv.status === statusFilter) : invoices.data;

    return (
        <>
            <Head title="Invoices" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invoices</h1>
                        <p className="mt-2 text-gray-600">View and manage all invoices</p>
                    </div>
                    <Link
                        href={InvoiceController.index.url()}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        Back to Billing
                    </Link>
                </div>

                {/* Filter and Sort Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStatusFilter('')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === '' ? 'bg-primary-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'pending'
                                    ? 'border border-warning-200 bg-warning-100 text-warning-700'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setStatusFilter('paid')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'paid'
                                    ? 'border border-success-200 bg-success-100 text-success-700'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Paid
                        </button>
                        <button
                            onClick={() => setStatusFilter('overdue')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                statusFilter === 'overdue'
                                    ? 'border border-error-200 bg-error-100 text-error-700'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Overdue
                        </button>
                    </div>
                </motion.div>

                {/* Invoices Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
                >
                    {filteredInvoices.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Invoice #</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Billing Period</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Residents</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Due Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.map((invoice, idx) => (
                                            <motion.tr
                                                key={invoice.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="border-b border-gray-100 transition-colors hover:bg-primary-50/30"
                                            >
                                                <td className="px-6 py-4">
                                                    <Link
                                                        href={InvoiceController.show.url(invoice.ulid)}
                                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                                                    >
                                                        {invoice.invoice_number}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(invoice.billing_period_start).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}{' '}
                                                    −{' '}
                                                    {new Date(invoice.billing_period_end).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{invoice.formatted_amount}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{invoice.resident_count}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(invoice.due_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={invoice.status} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={InvoiceController.show.url(invoice.ulid)}
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

                            {/* Pagination */}
                            <div className="border-t border-gray-100 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Showing <span className="font-semibold">{invoices.from}</span> to{' '}
                                        <span className="font-semibold">{invoices.to}</span> of{' '}
                                        <span className="font-semibold">{invoices.total}</span> invoices
                                    </p>
                                    <div className="flex gap-2">
                                        {invoices.links.map((link, idx) => {
                                            // Skip first/last empty links or render pagination
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
                            <p className="text-gray-600">No invoices found with the selected filter.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    );
}
