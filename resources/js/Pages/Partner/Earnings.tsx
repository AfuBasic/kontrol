import { BanknotesIcon, CalendarIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface Earning {
    id: number;
    month: string;
    month_label: string;
    total_amount: number;
    revenue_amount: number;
    settled_at: string | null;
    is_settled: boolean;
}

interface PaginatedEarnings {
    data: Earning[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Summary {
    total_earned: number;
    pending_commissions: number;
    next_settlement_date: string;
}

interface Props {
    earnings: PaginatedEarnings;
    summary: Summary;
}

function formatAmount(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

export default function PartnerEarnings({ earnings, summary }: Props) {
    return (
        <PartnerLayout>
            <Head title="Earnings – Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
                {/* Page Header */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-lg bg-linear-to-r from-success-500 to-success-600 opacity-75 blur"></div>
                        <div className="relative rounded-lg bg-success-500 p-2">
                            <BanknotesIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
                        <p className="text-gray-500">Your monthly commission history</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="grid gap-6 sm:grid-cols-3"
                >
                    <div className="rounded-2xl border border-success-200 bg-linear-to-br from-success-50 to-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-success-500" />
                            <span className="text-sm font-medium text-gray-600">Total Settled</span>
                        </div>
                        <p className="text-3xl font-bold text-success-700">{formatAmount(summary.total_earned)}</p>
                        <p className="mt-1 text-xs text-gray-500">All-time settled commissions</p>
                    </div>

                    <div className="rounded-2xl border border-warning-200 bg-linear-to-br from-warning-50 to-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <ClockIcon className="h-5 w-5 text-warning-500" />
                            <span className="text-sm font-medium text-gray-600">Pending</span>
                        </div>
                        <p className="text-3xl font-bold text-warning-700">{formatAmount(summary.pending_commissions)}</p>
                        <p className="mt-1 text-xs text-gray-500">Awaiting next settlement</p>
                    </div>

                    <div className="rounded-2xl border border-primary-200 bg-linear-to-br from-primary-50 to-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary-500" />
                            <span className="text-sm font-medium text-gray-600">Next Settlement</span>
                        </div>
                        <p className="text-2xl font-bold text-primary-700">{summary.next_settlement_date}</p>
                        <p className="mt-1 text-xs text-gray-500">Pending commissions will settle</p>
                    </div>
                </motion.div>

                {/* Earnings Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
                        <p className="text-sm text-gray-500">{earnings.total} month{earnings.total !== 1 ? 's' : ''} of commission history</p>
                    </div>

                    {earnings.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No earnings yet</p>
                            <p className="text-sm text-gray-400 mt-1">Commissions will appear here once estates you referred have active subscribers.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Month</th>
                                        <th className="px-6 py-3 text-right">Revenue Generated</th>
                                        <th className="px-6 py-3 text-right">Commission Earned</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-right">Settled On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {earnings.data.map((earning, i) => (
                                        <motion.tr
                                            key={earning.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, delay: i * 0.03 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">{earning.month_label}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{formatAmount(earning.revenue_amount)}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatAmount(earning.total_amount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {earning.is_settled ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700">
                                                        <CheckCircleIcon className="h-3.5 w-3.5" />
                                                        Settled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700">
                                                        <ClockIcon className="h-3.5 w-3.5" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                                {earning.settled_at
                                                    ? new Date(earning.settled_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })
                                                    : '—'}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </PartnerLayout>
    );
}
