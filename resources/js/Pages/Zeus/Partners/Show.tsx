import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    BuildingOffice2Icon,
    BanknotesIcon,
    CurrencyDollarIcon,
    ClockIcon,
    CheckCircleIcon,
    UserGroupIcon,
    ArrowTopRightOnSquareIcon,
    PencilSquareIcon,
    ArrowLeftIcon,
    KeyIcon,
    GlobeAltIcon,
    EnvelopeIcon,
    PhoneIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Partner {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    contact_person: string | null;
    description: string | null;
    notes: string | null;
    commission_type: 'percentage' | 'fixed';
    commission_rate: string | number;
    commission_length: number | null;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    api_key: string | null;
    has_bank_account: boolean;
    bank_name: string | null;
    account_name: string | null;
    account_number_masked: string | null;
    account_number: string | null;
    account_verified_at: string | null;
    created_at: string | null;
}

interface EstateItem {
    id: number;
    ulid: string;
    name: string;
    code: string | null;
    email: string | null;
    address: string | null;
    status: string;
    created_at: string | null;
    activation_date: string | null;
    partner_date: string | null;
    commission_starts_at: string | null;
    commission_ends_at: string | null;
    partner_status: string | null;
    commission_status: string | null;
    residents_count: number;
    total_revenue: number;
    commission_earned: number;
}

interface EarningItem {
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
    payment_note: string | null;
}

interface CommissionRevenueItem {
    id: number;
    estate_name: string;
    user_name: string;
    user_email: string | null;
    revenue_amount: number;
    commission_amount: number;
    status: string;
    created_at: string | null;
}

interface MemberItem {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    email_verified_at: string | null;
    suspended_at: string | null;
    created_at: string;
}

interface Stats {
    total_estates: number;
    active_estates: number;
    total_settled_earnings: number;
    pending_commissions: number;
    accruing_commissions: number;
    total_gross_revenue: number;
    next_settlement_date: string;
}

interface Props {
    partner: Partner;
    estates: EstateItem[];
    earnings: EarningItem[];
    recentCommissions: CommissionRevenueItem[];
    members: MemberItem[];
    stats: Stats;
    partnerPortalUrl: string;
}

function formatAmount(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCommission(rate: string | number, type: string): string {
    if (type === 'fixed') {
        return '₦' + (Number(rate) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' fixed';
    }
    return `${Number(rate).toFixed(2)}%`;
}

function formatDate(isoString: string | null | undefined): string {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return isoString;
    }
}

export default function PartnerShow({
    partner,
    estates,
    earnings,
    recentCommissions,
    members,
    stats,
    partnerPortalUrl,
}: Props) {
    const [activeTab, setActiveTab] = useState<'estates' | 'earnings' | 'banking' | 'team'>('estates');
    const [estateSearch, setEstateSearch] = useState('');

    const filteredEstates = estates.filter((e) =>
        e.name.toLowerCase().includes(estateSearch.toLowerCase()) ||
        (e.address && e.address.toLowerCase().includes(estateSearch.toLowerCase()))
    );

    return (
        <ZeusLayout>
            <Head title={`Partner: ${partner.name}`} />

            <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 text-[#F2F3F6]">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                {/* Header & Breadcrumbs */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#9297A8]">
                        <Link href="/zeus/partners" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                            <ArrowLeftIcon className="h-3.5 w-3.5" />
                            Back to Partners
                        </Link>
                        <span>/</span>
                        <span className="text-[#F2F3F6]">{partner.name}</span>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.8)]" />
                                <span className="text-[11px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">
                                    PARTNER PROFILE
                                </span>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                                        partner.status === 'active'
                                            ? 'border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]'
                                            : partner.status === 'inactive'
                                              ? 'border border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623]'
                                              : 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            partner.status === 'active'
                                                ? 'bg-[#34D399]'
                                                : partner.status === 'inactive'
                                                  ? 'bg-[#F5A623]'
                                                  : 'bg-rose-500'
                                        }`}
                                    />
                                    {partner.status}
                                </span>
                            </div>

                            <h1 className="text-3xl font-black tracking-tight text-[#F2F3F6] sm:text-4xl">
                                {partner.name}
                            </h1>

                            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#9297A8]">
                                {partner.email && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <EnvelopeIcon className="h-3.5 w-3.5 text-[#6C5DFD]" />
                                        {partner.email}
                                    </span>
                                )}
                                {partner.phone && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <PhoneIcon className="h-3.5 w-3.5 text-[#6C5DFD]" />
                                        {partner.phone}
                                    </span>
                                )}
                                {partner.contact_person && (
                                    <span className="text-[#9297A8]">
                                        Attn: <strong className="text-[#F2F3F6]">{partner.contact_person}</strong>
                                    </span>
                                )}
                                <span className="text-[#9297A8]">
                                    Commission:{' '}
                                    <strong className="text-[#34D399]">
                                        {formatCommission(partner.commission_rate, partner.commission_type)}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={`/zeus/partners/${partner.id}/earnings`}
                                className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#12141C] px-4 py-2.5 text-xs font-bold text-[#F2F3F6] shadow-sm transition-all hover:border-[rgba(255,255,255,0.25)] hover:bg-[#1A1D27] active:scale-95"
                            >
                                <BanknotesIcon className="h-4 w-4 text-[#34D399]" />
                                Monthly Earnings
                            </Link>

                            <Link
                                href={`/zeus/partners/${partner.id}/edit`}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#6C5DFD] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#6C5DFD]/20 transition-all hover:bg-[#6C5DFD]/90 active:scale-95"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit Partner
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* KPI Metrics Dashboard Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                >
                    {/* 1. Referred Estates */}
                    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-5 shadow-xl transition-all duration-300 hover:border-[#6C5DFD]/30">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-[#9297A8] uppercase">Referred Estates</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C5DFD]/10 text-[#6C5DFD]">
                                <BuildingOffice2Icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-[#F2F3F6] sm:text-3xl">{stats.total_estates}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#9297A8]">
                            <span className="text-[#34D399] font-bold">{stats.active_estates} Active</span>
                            <span>•</span>
                            <span>{stats.total_estates - stats.active_estates} Pending/Inactive</span>
                        </div>
                    </div>

                    {/* 2. Total Paid Commissions */}
                    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-5 shadow-xl transition-all duration-300 hover:border-[#34D399]/30">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-[#9297A8] uppercase">Total Settled</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34D399]/10 text-[#34D399]">
                                <CheckCircleIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-[#34D399] sm:text-3xl">
                            {formatAmount(stats.total_settled_earnings)}
                        </div>
                        <div className="mt-1 text-xs text-[#9297A8]">Commissions disbursed to date</div>
                    </div>

                    {/* 3. Pending & Accruing Commissions */}
                    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-5 shadow-xl transition-all duration-300 hover:border-[#F5A623]/30">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-[#9297A8] uppercase">Pending & Accruing</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5A623]/10 text-[#F5A623]">
                                <ClockIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-[#F5A623] sm:text-3xl">
                            {formatAmount(stats.pending_commissions + stats.accruing_commissions)}
                        </div>
                        <div className="mt-1 text-xs text-[#9297A8]">
                            Accruing this month: {formatAmount(stats.accruing_commissions)}
                        </div>
                    </div>

                    {/* 4. Total Gross Revenue Generated */}
                    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-5 shadow-xl transition-all duration-300 hover:border-[#6C5DFD]/30">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-[#9297A8] uppercase">Gross Estate Revenue</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                <CurrencyDollarIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-[#F2F3F6] sm:text-3xl">
                            {formatAmount(stats.total_gross_revenue)}
                        </div>
                        <div className="mt-1 text-xs text-[#9297A8]">Processed by referred estates</div>
                    </div>
                </motion.div>

                {/* Tabs Navigation */}
                <div className="border-b border-[rgba(255,255,255,0.08)]">
                    <nav className="flex gap-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('estates')}
                            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-bold transition-all ${
                                activeTab === 'estates'
                                    ? 'border-[#6C5DFD] text-[#F2F3F6]'
                                    : 'border-transparent text-[#9297A8] hover:text-[#F2F3F6]'
                            }`}
                        >
                            <BuildingOffice2Icon className="h-4 w-4" />
                            Referred Estates ({estates.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('earnings')}
                            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-bold transition-all ${
                                activeTab === 'earnings'
                                    ? 'border-[#6C5DFD] text-[#F2F3F6]'
                                    : 'border-transparent text-[#9297A8] hover:text-[#F2F3F6]'
                            }`}
                        >
                            <BanknotesIcon className="h-4 w-4" />
                            Earnings & Commissions
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('banking')}
                            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-bold transition-all ${
                                activeTab === 'banking'
                                    ? 'border-[#6C5DFD] text-[#F2F3F6]'
                                    : 'border-transparent text-[#9297A8] hover:text-[#F2F3F6]'
                            }`}
                        >
                            <ShieldCheckIcon className="h-4 w-4" />
                            Banking & Settlements
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('team')}
                            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-bold transition-all ${
                                activeTab === 'team'
                                    ? 'border-[#6C5DFD] text-[#F2F3F6]'
                                    : 'border-transparent text-[#9297A8] hover:text-[#F2F3F6]'
                            }`}
                        >
                            <UserGroupIcon className="h-4 w-4" />
                            Portal Team ({members.length})
                        </button>
                    </nav>
                </div>

                {/* Tab 1: Referred Estates */}
                {activeTab === 'estates' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-bold text-[#F2F3F6]">
                                All Estates Assigned to {partner.name}
                            </div>
                            {estates.length > 3 && (
                                <input
                                    type="text"
                                    placeholder="Search referred estates..."
                                    value={estateSearch}
                                    onChange={(e) => setEstateSearch(e.target.value)}
                                    className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-4 py-2 text-xs text-[#F2F3F6] placeholder-[#9297A8] focus:border-[#6C5DFD] focus:outline-none"
                                />
                            )}
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-[rgba(255,255,255,0.08)] bg-[#12141C] text-xs font-semibold tracking-wider text-[#9297A8] uppercase">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Estate Name & Location</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-center">Residents</th>
                                            <th className="px-6 py-4 text-right">Gross Collections</th>
                                            <th className="px-6 py-4 text-right">Partner Commission</th>
                                            <th className="px-6 py-4 text-right">Date Linked</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                        {filteredEstates.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-16 text-center text-[#9297A8]">
                                                    <BuildingStorefrontIcon className="mx-auto mb-3 h-10 w-10 text-[#9297A8]/40" />
                                                    <p className="font-semibold text-[#F2F3F6]">No estates referred yet</p>
                                                    <p className="mt-1 text-xs text-[#9297A8]">
                                                        When estates onboard with this partner's code or are assigned in Zeus, they will appear here.
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEstates.map((estate) => (
                                                <tr key={estate.id} className="transition-colors hover:bg-[#1A1D27]/40">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <Link
                                                                href={`/zeus/estates/${estate.id}`}
                                                                className="font-bold text-[#F2F3F6] hover:text-[#6C5DFD] hover:underline"
                                                            >
                                                                {estate.name}
                                                            </Link>
                                                            <p className="text-xs text-[#9297A8]">
                                                                {estate.address || estate.email || 'No address specified'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                                                                estate.status === 'active'
                                                                    ? 'border border-[#34D399]/20 bg-[#34D399]/10 text-[#34D399]'
                                                                    : 'border border-[#F5A623]/20 bg-[#F5A623]/10 text-[#F5A623]'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    estate.status === 'active' ? 'bg-[#34D399]' : 'bg-[#F5A623]'
                                                                }`}
                                                            />
                                                            {estate.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-semibold text-[#F2F3F6]">
                                                            {estate.residents_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-[#F2F3F6]">
                                                        {formatAmount(estate.total_revenue)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-[#34D399]">
                                                        {formatAmount(estate.commission_earned)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-xs text-[#9297A8]">
                                                        {formatDate(estate.partner_date || estate.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            href={`/zeus/estates/${estate.id}`}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6C5DFD] hover:underline"
                                                        >
                                                            View Estate
                                                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab 2: Earnings & Commissions */}
                {activeTab === 'earnings' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Commission Structure Banner */}
                        <div className="flex flex-col gap-4 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Commission Agreement</span>
                                <div className="text-xl font-bold text-[#F2F3F6]">
                                    {formatCommission(partner.commission_rate, partner.commission_type)}
                                    <span className="ml-2 text-sm font-normal text-[#9297A8]">
                                        ({partner.commission_type === 'fixed' ? 'Fixed fee per transaction' : 'Percentage of collections'})
                                    </span>
                                </div>
                                <div className="text-xs text-[#9297A8]">
                                    Commission Duration: {partner.commission_length ? `${partner.commission_length} Months` : 'Lifetime / Continuous'}
                                </div>
                            </div>

                            <Link
                                href={`/zeus/partners/${partner.id}/earnings`}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#34D399]/10 px-5 py-3 text-xs font-bold text-[#34D399] border border-[#34D399]/20 hover:bg-[#34D399]/20 transition-all"
                            >
                                Full Earnings Ledger
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </Link>
                        </div>

                        {/* Monthly Earnings History */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-[#F2F3F6]">Monthly Earnings History</h3>
                            <div className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-[rgba(255,255,255,0.08)] bg-[#12141C] text-xs font-semibold tracking-wider text-[#9297A8] uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Month</th>
                                                <th className="px-6 py-4 text-right">Gross Collections</th>
                                                <th className="px-6 py-4 text-right">Commission Earned</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Settled Date</th>
                                                <th className="px-6 py-4 text-right">Payment Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                            {earnings.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-[#9297A8]">
                                                        No earnings recorded yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                earnings.map((earning) => (
                                                    <tr key={earning.id} className="transition-colors hover:bg-[#1A1D27]/40">
                                                        <td className="px-6 py-4 font-bold text-[#F2F3F6]">
                                                            {earning.month_label}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-semibold text-[#9297A8]">
                                                            {formatAmount(earning.revenue_amount)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-[#34D399]">
                                                            {formatAmount(earning.total_amount)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                                                                    earning.is_settled
                                                                        ? 'border border-[#34D399]/20 bg-[#34D399]/10 text-[#34D399]'
                                                                        : earning.is_accruing
                                                                          ? 'border border-amber-400/30 bg-amber-500/10 text-amber-300'
                                                                          : 'border border-[#F5A623]/20 bg-[#F5A623]/10 text-[#F5A623]'
                                                                }`}
                                                            >
                                                                {earning.status_label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-xs text-[#9297A8]">
                                                            {formatDate(earning.settled_at)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-xs text-[#9297A8]">
                                                            {earning.payment_reference_masked || '—'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Recent Commissionable Transactions Stream */}
                        {recentCommissions.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-bold text-[#F2F3F6]">Recent Commissionable Revenues</h3>
                                <div className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="border-b border-[rgba(255,255,255,0.08)] bg-[#12141C] text-xs font-semibold tracking-wider text-[#9297A8] uppercase">
                                                <tr>
                                                    <th className="px-6 py-4 text-left">Estate</th>
                                                    <th className="px-6 py-4 text-left">Payer</th>
                                                    <th className="px-6 py-4 text-right">Payment Amount</th>
                                                    <th className="px-6 py-4 text-right">Commission</th>
                                                    <th className="px-6 py-4 text-right">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                                {recentCommissions.map((cr) => (
                                                    <tr key={cr.id} className="transition-colors hover:bg-[#1A1D27]/40">
                                                        <td className="px-6 py-4 font-semibold text-[#F2F3F6]">
                                                            {cr.estate_name}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-[#9297A8]">
                                                            <span className="font-medium text-[#F2F3F6]">{cr.user_name}</span>
                                                            {cr.user_email && <p className="text-[11px] text-[#9297A8]">{cr.user_email}</p>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-semibold text-[#F2F3F6]">
                                                            {formatAmount(cr.revenue_amount)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-[#34D399]">
                                                            {formatAmount(cr.commission_amount)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-xs text-[#9297A8]">
                                                            {formatDate(cr.created_at)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Tab 3: Banking & Settlements */}
                {activeTab === 'banking' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid gap-6 md:grid-cols-2"
                    >
                        {/* Bank Account Card */}
                        <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#34D399]/10 text-[#34D399]">
                                        <BanknotesIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#F2F3F6]">Settlement Bank Account</h3>
                                        <p className="text-xs text-[#9297A8]">Payouts are deposited here automatically</p>
                                    </div>
                                </div>
                                {partner.has_bank_account ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#34D399]/10 px-2.5 py-0.5 text-xs font-semibold text-[#34D399]">
                                        <CheckCircleIcon className="h-4 w-4" /> Verified
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                                        Unverified
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-[#9297A8]">Bank Name</span>
                                    <span className="font-semibold text-[#F2F3F6]">{partner.bank_name || 'Not provided'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-[#9297A8]">Account Name</span>
                                    <span className="font-semibold text-[#F2F3F6]">{partner.account_name || 'Not provided'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-[#9297A8]">Account Number</span>
                                    <span className="font-mono font-semibold text-[#F2F3F6]">
                                        {partner.account_number || partner.account_number_masked || 'Not provided'}
                                    </span>
                                </div>
                                {partner.account_verified_at && (
                                    <div className="flex justify-between py-1 text-xs text-[#9297A8]">
                                        <span>Verified On</span>
                                        <span>{formatDate(partner.account_verified_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Settlement Schedule Card */}
                        <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-xl space-y-4">
                            <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6C5DFD]/10 text-[#6C5DFD]">
                                    <ClockIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#F2F3F6]">Settlement Schedule</h3>
                                    <p className="text-xs text-[#9297A8]">Automatic monthly batch settlement</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-[#9297A8]">Frequency</span>
                                    <span className="font-semibold text-[#F2F3F6]">Monthly (1st of every month)</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-[#9297A8]">Next Settlement Date</span>
                                    <span className="font-semibold text-[#34D399]">
                                        {formatDate(stats.next_settlement_date)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-[#9297A8]">Pending Payout Balance</span>
                                    <span className="font-bold text-[#F5A623]">
                                        {formatAmount(stats.pending_commissions)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab 4: Portal Team & API Access */}
                {activeTab === 'team' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#F2F3F6]">Partner Portal Members</h3>
                                <p className="text-xs text-[#9297A8]">Users with access to log in to this partner's portal</p>
                            </div>
                            <Link
                                href={`/zeus/partners/${partner.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-3.5 py-2 text-xs font-semibold text-[#F2F3F6] hover:bg-[#1A1D27]"
                            >
                                Manage / Invite Members
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[rgba(255,255,255,0.08)] bg-[#12141C] text-xs font-semibold tracking-wider text-[#9297A8] uppercase">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Member</th>
                                        <th className="px-6 py-4 text-left">Email</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Invited Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                    {members.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-[#9297A8]">
                                                No members found.
                                            </td>
                                        </tr>
                                    ) : (
                                        members.map((member) => (
                                            <tr key={member.id} className="transition-colors hover:bg-[#1A1D27]/40">
                                                <td className="px-6 py-4 font-bold text-[#F2F3F6]">
                                                    {member.name}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[#9297A8]">
                                                    {member.email}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {member.suspended_at ? (
                                                        <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                                                            Suspended
                                                        </span>
                                                    ) : member.email_verified_at ? (
                                                        <span className="rounded-full bg-[#34D399]/10 px-2.5 py-0.5 text-xs font-semibold text-[#34D399]">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-[#F5A623]/10 px-2.5 py-0.5 text-xs font-semibold text-[#F5A623]">
                                                            Invite Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-[#9297A8]">
                                                    {formatDate(member.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </ZeusLayout>
    );
}
