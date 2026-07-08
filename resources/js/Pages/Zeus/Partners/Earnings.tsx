import {
    BanknotesIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    PlayIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Partner {
    id: number;
    name: string;
    commission_type: string;
    commission_rate: string;
    status: string;
}

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
    partner: Partner;
    earnings: PaginatedEarnings;
    summary: Summary;
}

function formatAmount(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function formatCommission(rate: string, type: string): string {
    if (type === 'fixed') return '₦' + (Number(rate) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' fixed';
    return `${Number(rate).toFixed(2)}%`;
}

export default function PartnerEarningsAdmin({ partner, earnings, summary }: Props) {
    const { data, setData, post, processing } = useForm({ month: '' });

    function handleSettle(e: React.FormEvent) {
        e.preventDefault();
        post(`/zeus/partners/${partner.id}/earnings/settle`);
    }

    return (
        <ZeusLayout>
            <Head title={`${partner.name} – Earnings`} />

            <div className="space-y-8">
                {/* Breadcrumb & Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                            <Link href="/zeus/partners" className="hover:text-gray-700">Partners</Link>
                            <span>/</span>
                            <Link href={`/zeus/partners/${partner.id}/edit`} className="hover:text-gray-700">{partner.name}</Link>
                            <span>/</span>
                            <span className="text-gray-900">Earnings</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">{partner.name}</h1>
                        <p className="mt-1 text-gray-500">
                            Commission: <span className="font-semibold text-gray-700">{formatCommission(partner.commission_rate, partner.commission_type)}</span>
                        </p>
                    </div>

                    {/* Manual Settle Form */}
                    <form onSubmit={handleSettle} className="flex items-end gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Settle month</label>
                            <input
                                type="month"
                                value={data.month}
                                onChange={e => setData('month', e.target.value + '-01')}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-700 transition-colors disabled:opacity-60"
                        >
                            <PlayIcon className="h-4 w-4" />
                            {processing ? 'Queuing…' : 'Run Settlement'}
                        </button>
                    </form>
                </div>

                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid gap-6 sm:grid-cols-3"
                >
                    <div className="rounded-2xl border border-success-200 bg-linear-to-br from-success-50 to-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-success-500" />
                            <span className="text-sm font-medium text-gray-600">Total Settled</span>
                        </div>
                        <p className="text-3xl font-bold text-success-700">{formatAmount(summary.total_earned)}</p>
                    </div>

                    <div className="rounded-2xl border border-warning-200 bg-linear-to-br from-warning-50 to-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <ClockIcon className="h-5 w-5 text-warning-500" />
                            <span className="text-sm font-medium text-gray-600">Pending Commissions</span>
                        </div>
                        <p className="text-3xl font-bold text-warning-700">{formatAmount(summary.pending_commissions)}</p>
                    </div>

                    <div className="rounded-2xl border border-primary-200 bg-linear-to-br from-primary-50 to-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary-500" />
                            <span className="text-sm font-medium text-gray-600">Next Auto-Settlement</span>
                        </div>
                        <p className="text-2xl font-bold text-primary-700">{summary.next_settlement_date}</p>
                    </div>
                </motion.div>

                {/* Earnings Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 }}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Monthly Earnings</h2>
                        <p className="text-sm text-gray-500">{earnings.total} settlement record{earnings.total !== 1 ? 's' : ''}</p>
                    </div>

                    {earnings.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No earnings recorded yet</p>
                            <p className="text-sm text-gray-400 mt-1">Earnings appear here once the monthly settlement job runs.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Month</th>
                                        <th className="px-6 py-3 text-right">Revenue</th>
                                        <th className="px-6 py-3 text-right">Commission</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-right">Settled On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {earnings.data.map((earning, i) => (
                                        <motion.tr
                                            key={earning.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
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
            </div>
        </ZeusLayout>
    );
}
