import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    ArrowLeft,
    Banknote,
    Info,
    TrendingUp,
    ArrowUpRight,
    Activity,
    MoreVertical,
    Trash2,
    Power,
    Ghost,
    FileQuestion,
    Lock,
    Ticket,
    Handshake,
} from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import ConfirmationModal from '@/Components/ConfirmationModal';
import PartnerTimeline from '@/Components/PartnerTimeline';
import { toggleStatus, destroy, resendInvitation } from '@/actions/App/Http/Controllers/Zeus/EstateController';

interface Partner {
    id: number;
    name: string;
    email: string;
    commission_rate: string;
}

interface CommissionPlan {
    id: number;
    name: string;
    commission_rate: string;
    duration_months: number;
}

interface Estate {
    id: number;
    ulid: string;
    name: string;
    email: string;
    address: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    partner_id?: number | null;
    partner_source?: string | null;
    partner_status?: string | null;
    commission_status?: string | null;
    partner_date?: string | null;
    activation_date?: string | null;
    commission_starts_at?: string | null;
    commission_ends_at?: string | null;
    partner_notes?: string | null;
    commission_days_remaining?: number | null;
    partner?: Partner | null;
    commission_plan?: CommissionPlan | null;
    settings?: {
        charge_type: 'estate' | 'residents';
    };
}

interface Analytics {
    total_revenue: number;
    monthly_revenue: number;
    outstanding_amount: number;
    success_rate: number;
}

interface Transaction {
    id: number;
    paystack_reference: string;
    amount: number;
    status: string;
    payment_method: string | null;
    created_at: string;
    invoice?: {
        user?: { name: string; email: string };
    };
}

interface Resident {
    id: number;
    user: { name: string; email: string };
    status: string;
    last_payment_at: string | null;
    last_amount: number;
    next_due: string | null;
}

interface Coupon {
    id: number;
    campaign_name: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    usage_limit: number | null;
    used_count: number;
    expires_at: string | null;
}

interface Props {
    estate: Estate;
    residentStats: { total: number; active: number; trial: number; past_due: number; expired: number };
    analytics: Analytics;
    recentTransactions: Transaction[];
    residents: Resident[];
    admin: { name: string; email: string } | null;
    activeCoupons: Coupon[];
}

export default function EstateShow({ estate, residentStats, analytics, recentTransactions, residents, admin, activeCoupons }: Props) {
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'toggle' | 'delete' | 'reset' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount / 100);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleAction = () => {
        if (!actionToConfirm) return;

        setIsProcessing(true);
        const onFinish = () => {
            setIsProcessing(false);
            setActionToConfirm(null);
            setIsActionMenuOpen(false);
        };

        if (actionToConfirm === 'toggle') {
            router.post(toggleStatus.url({ estate: estate.ulid }), {}, { preserveScroll: true, onFinish });
        } else if (actionToConfirm === 'delete') {
            router.delete(destroy.url({ estate: estate.ulid }), { preserveScroll: true, onFinish });
        } else if (actionToConfirm === 'reset') {
            router.post(resendInvitation.url({ estate: estate.ulid }), {}, { preserveScroll: true, onFinish });
        }
    };

    return (
        <ZeusLayout>
            <Head title={`Estate: ${estate.name}`} />

            {/* Back Link */}
            <Link
                href="/zeus/estates"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Estates
            </Link>

            {/* Estate Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]"
            >
                <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-50 p-8 sm:flex-row sm:items-center dark:border-slate-800/30">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ring-1 ring-inset ${
                                    estate.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                        : 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:ring-slate-700'
                                }`}
                            >
                                {estate.status}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{estate.name}</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {estate.settings?.charge_type === 'estate' ? 'Estate pays bulk' : 'Residents pay individual'} · Created{' '}
                            {formatDate(estate.created_at)}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/zeus/estates/${estate.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-[#0f1423] dark:text-white dark:hover:bg-slate-800/50"
                        >
                            Edit Estate
                        </Link>

                        {/* Quick Actions Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-[#0f1423] dark:text-slate-400 dark:hover:bg-slate-800/50"
                            >
                                <MoreVertical className="h-5 w-5" />
                            </button>

                            <AnimatePresence>
                                {isActionMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsActionMenuOpen(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            <div className="p-1.5">
                                                <button
                                                    onClick={() => setActionToConfirm('toggle')}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    <Power className="h-4 w-4" />
                                                    Toggle Status
                                                </button>
                                                {!admin && (
                                                    <button
                                                        onClick={() => setActionToConfirm('reset')}
                                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                                    >
                                                        <Lock className="h-4 w-4" />
                                                        Resend Invitation
                                                    </button>
                                                )}
                                                <div className="my-1 border-t border-slate-100 dark:border-slate-800/50"></div>
                                                <button
                                                    onClick={() => setActionToConfirm('delete')}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete Estate
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-50 bg-slate-50/30 sm:grid-cols-4 dark:divide-slate-800/30 dark:bg-slate-800/30">
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Residents</p>
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{residentStats.total}</p>
                    </div>
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Active</p>
                        <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{residentStats.active}</p>
                    </div>
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Revenue (MTD)</p>
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(analytics.monthly_revenue)}</p>
                    </div>
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Outstanding</p>
                        <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(analytics.outstanding_amount)}</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: Analytics & Contacts */}
                <div className="space-y-8">
                    {/* Analytics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Lifetime Rev</p>
                            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(analytics.total_revenue)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <Activity className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Success Rate</p>
                            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{analytics.success_rate}%</p>
                        </div>
                    </div>

                    {/* Partner Attribution */}
                    <div className="rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-slate-800/50 dark:bg-[#0f1423]/80">
                        <h3 className="mb-6 flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                            <Handshake className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            Partner Attribution
                        </h3>

                        {estate.partner ? (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    {estate.partner_status && (
                                        <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-violet-700 uppercase ring-1 ring-violet-200 ring-inset dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                                            {estate.partner_status.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                    {estate.commission_status && (
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ring-1 ring-inset ${
                                                estate.commission_status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                                    : estate.commission_status === 'expired'
                                                      ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20'
                                                      : 'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:ring-slate-700'
                                            }`}
                                        >
                                            Commission {estate.commission_status}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Partner</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{estate.partner.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{estate.partner.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Commission Rate
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {estate.commission_plan?.commission_rate ?? estate.partner.commission_rate}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Partner Date
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {formatDate(estate.partner_date ?? null)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Days Remaining
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {estate.commission_days_remaining ?? '-'}
                                        </p>
                                    </div>
                                </div>

                                {estate.partner_status && (
                                    <PartnerTimeline
                                        currentStatus={estate.partner_status}
                                        steps={[
                                            { key: 'lead', label: 'Lead' },
                                            { key: 'submitted', label: 'Submitted', date: formatDate(estate.partner_date ?? null) },
                                            { key: 'reviewing', label: 'Reviewing' },
                                            { key: 'approved', label: 'Approved' },
                                            { key: 'estate_created', label: 'Estate Created', date: formatDate(estate.created_at) },
                                            { key: 'activated', label: 'Activated', date: formatDate(estate.activation_date ?? null) },
                                            {
                                                key: 'commission_active',
                                                label: 'Commission Active',
                                                date: formatDate(estate.commission_starts_at ?? null),
                                            },
                                            {
                                                key: 'commission_expired',
                                                label: 'Commission Expired',
                                                date: formatDate(estate.commission_ends_at ?? null),
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No partner attribution assigned to this estate.</p>
                        )}
                    </div>

                    {/* Primary Admin */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <h3 className="mb-6 flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Primary Admin
                        </h3>
                        {admin ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Name</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{admin.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">Email</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{admin.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                                    <Ghost className="h-5 w-5 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Admin</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Invitation is pending or revoked.</p>
                            </div>
                        )}
                    </div>

                    {/* Active Coupons Section */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <h3 className="mb-6 flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                            <span className="text-indigo-650 flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <Ticket className="h-3 w-3" />
                            </span>
                            Active Coupons
                        </h3>
                        {activeCoupons && activeCoupons.length > 0 ? (
                            <div className="space-y-4">
                                {activeCoupons.map((coupon) => (
                                    <div
                                        key={coupon.id}
                                        className="group hover:border-indigo-350 relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 transition dark:border-slate-800 dark:bg-[#080b13] dark:hover:border-indigo-900/60"
                                    >
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white">{coupon.campaign_name}</h4>
                                                <span className="mt-1.5 inline-block rounded-lg border border-indigo-100/50 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-indigo-600 uppercase dark:border-indigo-900/20 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                    {coupon.code}
                                                </span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                {coupon.type === 'percentage' ? `${coupon.value}%` : `₦${(coupon.value / 100).toLocaleString()}`}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[10px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                            <span>
                                                Limit:{' '}
                                                {coupon.usage_limit
                                                    ? `${coupon.usage_limit} use${coupon.usage_limit > 1 ? 's' : ''} per resident`
                                                    : 'Unlimited'}
                                            </span>
                                            {coupon.expires_at && <span>Expires {coupon.expires_at}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                                    <Ticket className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Active Coupons</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">There are no active coupons for this estate.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Resident Payment Status */}
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Resident Payment Status
                            </h3>
                        </div>
                        {residents.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Resident
                                            </th>
                                            <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Status
                                            </th>
                                            <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Last Payment
                                            </th>
                                            <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Next Due
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                        {residents.map((resident) => (
                                            <tr key={resident.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                <td className="px-8 py-4">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{resident.user.name}</div>
                                                    <div className="text-[11px] text-slate-400 dark:text-slate-500">{resident.user.email}</div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${
                                                            resident.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                        }`}
                                                    >
                                                        {resident.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                                    {formatCurrency(resident.last_amount)}
                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                        {formatDate(resident.last_payment_at)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    {formatDate(resident.next_due)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-700">
                                    <Ghost className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No residents yet</h4>
                                <p className="mt-1 max-w-[250px] text-xs text-slate-500 dark:text-slate-400">
                                    When residents join and make payments, their status will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Estate Transactions Table */}
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6 dark:border-slate-800/30">
                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                        <Banknote className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Estate Transactions
                    </h3>
                    {recentTransactions.length > 0 && (
                        <Link
                            href="/zeus/transactions"
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                            View All <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    )}
                </div>

                {recentTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Date
                                    </th>
                                    <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Resident
                                    </th>
                                    <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Amount
                                    </th>
                                    <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-8 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Reference
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                {recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {tx.invoice?.user?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                                        <td className="px-8 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${
                                                    tx.status === 'success'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                                }`}
                                            >
                                                {tx.status === 'success' ? 'Paid' : tx.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 font-mono text-xs text-slate-400 dark:text-slate-500">{tx.paystack_reference}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-700">
                            <FileQuestion className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">No transactions found</h4>
                        <p className="mt-1 max-w-[250px] text-xs text-slate-500 dark:text-slate-400">
                            This estate has not processed any successful transactions yet.
                        </p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={actionToConfirm !== null}
                onClose={() => setActionToConfirm(null)}
                onConfirm={handleAction}
                title={
                    actionToConfirm === 'toggle'
                        ? `${estate.status === 'active' ? 'Deactivate' : 'Activate'} Estate`
                        : actionToConfirm === 'delete'
                          ? 'Delete Estate'
                          : 'Resend Invitation'
                }
                message={
                    actionToConfirm === 'toggle'
                        ? `Are you sure you want to ${estate.status === 'active' ? 'deactivate' : 'activate'} ${estate.name}? ${
                              estate.status === 'active' ? 'Users will lose access.' : 'Users will regain access.'
                          }`
                        : actionToConfirm === 'delete'
                          ? `Are you absolutely sure you want to completely delete ${estate.name}? This action cannot be undone and will erase all associated data permanently.`
                          : `Are you sure you want to resend the invitation email to the primary admin of ${estate.name}?`
                }
                confirmLabel={
                    actionToConfirm === 'toggle'
                        ? `Yes, ${estate.status === 'active' ? 'Deactivate' : 'Activate'}`
                        : actionToConfirm === 'delete'
                          ? 'Yes, Delete Estate'
                          : 'Yes, Send Email'
                }
                type={actionToConfirm === 'delete' || (actionToConfirm === 'toggle' && estate.status === 'active') ? 'danger' : 'info'}
                isLoading={isProcessing}
            />
        </ZeusLayout>
    );
}
