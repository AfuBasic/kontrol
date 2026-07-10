import {
    BanknotesIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
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
    is_pending: boolean;
    is_accruing: boolean;
    status: 'accruing' | 'pending' | 'paid';
    status_label: string;
    payment_reference_masked: string | null;
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
    pending_revenues?: number;
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
    if (type === 'fixed') {
        return '₦' + (Number(rate) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' fixed';
    }
    return `${Number(rate).toFixed(2)}%`;
}

function StatusBadge({ earning }: { earning: Earning }) {
    if (earning.is_settled || earning.status === 'paid') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/20 bg-[#34D399]/10 px-2.5 py-1 text-xs font-semibold text-[#34D399] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                Paid
            </span>
        );
    }

    if (earning.is_accruing || earning.status === 'accruing') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
                Accruing
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5A623]/20 bg-[#F5A623]/10 px-2.5 py-1 text-xs font-semibold text-[#F5A623] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
            Pending Settlement
        </span>
    );
}

export default function PartnerEarningsAdmin({ partner, earnings, summary }: Props) {
    return (
        <ZeusLayout>
            <Head title={`${partner.name} – Earnings`} />

            <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 text-[#F2F3F6]">
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#9297A8]">
                            <Link href="/zeus/partners" className="transition-colors hover:text-white">
                                Partners
                            </Link>
                            <span>/</span>
                            <Link
                                href={`/zeus/partners/${partner.id}/edit`}
                                className="transition-colors hover:text-white"
                            >
                                {partner.name}
                            </Link>
                            <span>/</span>
                            <span className="text-[#F2F3F6]">Earnings</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-[#F2F3F6]">{partner.name}</h1>
                        <p className="mt-1 text-sm text-[#9297A8]">
                            Commission Schedule:{' '}
                            <span className="font-bold text-white">
                                {formatCommission(partner.commission_rate, partner.commission_type)}
                            </span>
                        </p>
                    </div>

                    <Link
                        href="/zeus/settlements"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#6C5DFD] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#6C5DFD]/90"
                    >
                        Open Settlements inbox
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid gap-6 sm:grid-cols-3"
                >
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#34D399]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                            Total Paid
                        </span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#34D399]">
                                {formatAmount(summary.total_earned)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#34D399]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            <span>Settled earnings</span>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#F5A623]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                            Pending Settlement
                        </span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#F5A623]">
                                {formatAmount(summary.pending_commissions)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#F5A623]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623] shadow-[0_0_8px_rgba(245,166,35,0.6)]" />
                            <span>Unsettled earning periods</span>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#6C5DFD]/5 blur-xl transition-transform duration-500 group-hover:scale-150" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">
                            Next period close
                        </span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#F2F3F6]">
                                {summary.next_settlement_date}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#6C5DFD]">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>Scheduled aggregation lock</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 }}
                    className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl"
                >
                    <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
                        <h2 className="text-lg font-semibold text-[#F2F3F6]">Monthly Earnings History</h2>
                        <p className="mt-0.5 text-xs text-[#9297A8]">
                            {earnings.total} settlement record{earnings.total !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {earnings.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <BanknotesIcon className="mx-auto mb-4 h-12 w-12 text-gray-700" />
                            <p className="font-medium text-[#9297A8]">No earnings recorded yet</p>
                            <p className="mt-1 text-xs text-gray-500">
                                Earnings appear after a snapshot or month-end close.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[rgba(255,255,255,0.08)] bg-[#12141C] text-xs font-semibold tracking-wider text-[#9297A8] uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Month</th>
                                        <th className="px-6 py-4 text-right">Revenue</th>
                                        <th className="px-6 py-4 text-right">Commission</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Paid / Ref</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                    {earnings.data.map((earning) => (
                                        <tr
                                            key={earning.id}
                                            className="transition-colors hover:bg-[#12141C]/50"
                                        >
                                            <td className="px-6 py-4 font-bold text-[#F2F3F6]">
                                                {earning.month_label}
                                            </td>
                                            <td className="px-6 py-4 text-right text-[#9297A8]">
                                                {formatAmount(earning.revenue_amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-[#F2F3F6]">
                                                {formatAmount(earning.total_amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge earning={earning} />
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-[#9297A8]">
                                                {earning.settled_at ? (
                                                    <div>
                                                        <div>
                                                            {new Date(earning.settled_at).toLocaleDateString(
                                                                'en-NG',
                                                                { dateStyle: 'medium' },
                                                            )}
                                                        </div>
                                                        {earning.payment_reference_masked && (
                                                            <div className="mt-0.5 font-mono">
                                                                {earning.payment_reference_masked}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    '—'
                                                )}
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
