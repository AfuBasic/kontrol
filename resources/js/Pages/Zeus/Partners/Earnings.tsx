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

            <div className="relative mx-auto max-w-7xl px-4 py-8 text-[#F2F3F6] space-y-8">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                {/* Breadcrumb & Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs text-[#9297A8] font-semibold">
                            <Link href="/zeus/partners" className="hover:text-white transition-colors">Partners</Link>
                            <span>/</span>
                            <Link href={`/zeus/partners/${partner.id}/edit`} className="hover:text-white transition-colors">{partner.name}</Link>
                            <span>/</span>
                            <span className="text-[#F2F3F6]">Earnings</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-[#F2F3F6]">{partner.name}</h1>
                        <p className="mt-1 text-sm text-[#9297A8]">
                            Commission Schedule: <span className="font-bold text-white">{formatCommission(partner.commission_rate, partner.commission_type)}</span>
                        </p>
                    </div>

                    {/* Manual Settle Form */}
                    <form onSubmit={handleSettle} className="flex items-end gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-4 shadow-xl">
                        <div>
                            <label className="block text-[10px] font-bold tracking-wider text-[#9297A8] uppercase mb-1.5">Settle Month</label>
                            <input
                                type="month"
                                value={data.month}
                                onChange={e => setData('month', e.target.value + '-01')}
                                className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2 text-xs text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#6C5DFD] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#6C5DFD]/90 transition-colors disabled:opacity-60 active:scale-[0.98]"
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
                    {/* Settled Card */}
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#34D399]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Total Settled</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#34D399]">{formatAmount(summary.total_earned)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            <span>Paid earnings balance</span>
                        </div>
                    </div>

                    {/* Pending Card */}
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#F5A623]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Pending Commissions</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#F5A623]">{formatAmount(summary.pending_commissions)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#F5A623]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623] shadow-[0_0_8px_rgba(245,166,35,0.6)]" />
                            <span>Unsettled commission pool</span>
                        </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#6C5DFD]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Next Auto-Settlement</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#F2F3F6]">{summary.next_settlement_date}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#6C5DFD]">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>Scheduled run date</span>
                        </div>
                    </div>
                </motion.div>

                {/* Earnings Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 }}
                    className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.08)]">
                        <h2 className="text-lg font-semibold text-[#F2F3F6]">Monthly Earnings History</h2>
                        <p className="text-xs text-[#9297A8] mt-0.5">{earnings.total} settlement record{earnings.total !== 1 ? 's' : ''}</p>
                    </div>

                    {earnings.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-700 mb-4" />
                            <p className="text-[#9297A8] font-medium">No earnings recorded yet</p>
                            <p className="text-xs text-gray-500 mt-1">Earnings appear here once the monthly settlement job runs.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#12141C] border-b border-[rgba(255,255,255,0.08)] text-xs font-semibold uppercase tracking-wider text-[#9297A8]">
                                    <tr>
                                        <th className="px-6 py-4">Month</th>
                                        <th className="px-6 py-4 text-right">Revenue</th>
                                        <th className="px-6 py-4 text-right">Commission</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Settled On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                    {earnings.data.map((earning, i) => (
                                        <tr key={earning.id} className="hover:bg-[#12141C]/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-[#F2F3F6]">{earning.month_label}</td>
                                            <td className="px-6 py-4 text-right text-[#9297A8]">{formatAmount(earning.revenue_amount)}</td>
                                            <td className="px-6 py-4 text-right font-black text-[#F2F3F6]">{formatAmount(earning.total_amount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {earning.is_settled ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20 px-2.5 py-1 text-xs font-semibold uppercase">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                                                        Settled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 px-2.5 py-1 text-xs font-semibold uppercase">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-[#9297A8] text-xs">
                                                {earning.settled_at
                                                    ? new Date(earning.settled_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })
                                                    : '—'}
                                            </td>
                                        </tr>
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
