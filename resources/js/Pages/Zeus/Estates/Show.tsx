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
    Shield,
    Ghost,
    FileQuestion,
    Lock,
    Ticket,
    Handshake,
    Plus,
    Pencil,
    X,
    Loader2,
    Check,
} from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import ConfirmationModal from '@/Components/ConfirmationModal';
import PartnerTimeline from '@/Components/PartnerTimeline';
import { toggleStatus, destroy, resendInvitation, updatePartnerAssignment } from '@/actions/App/Http/Controllers/Zeus/EstateController';

interface Partner {
    id: number;
    name: string;
    email?: string | null;
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

interface PartnerEarnings {
    current_month_commission: number;
    total_commission: number;
}

interface Props {
    estate: Estate;
    residentStats: { total: number; active: number; trial: number; past_due: number; expired: number };
    analytics: Analytics;
    recentTransactions: Transaction[];
    residents: Resident[];
    admin: { name: string; email: string } | null;
    activeCoupons: Coupon[];
    partnerEarnings?: PartnerEarnings | null;
    partners?: Partner[];
}

export default function EstateShow({
    estate,
    residentStats,
    analytics,
    recentTransactions,
    residents,
    admin,
    activeCoupons,
    partnerEarnings,
    partners = [],
}: Props) {
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'toggle' | 'delete' | 'reset' | 'remove-partner' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Partner Assignment Modal State
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | string>(estate.partner_id ?? '');
    const [assignmentReason, setAssignmentReason] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

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

    const handleSavePartnerAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPartnerId) return;

        setIsAssigning(true);
        router.patch(
            updatePartnerAssignment.url({ estate: estate.ulid }),
            {
                partner_id: Number(selectedPartnerId),
                reason: assignmentReason || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsPartnerModalOpen(false);
                    setAssignmentReason('');
                },
                onFinish: () => {
                    setIsAssigning(false);
                },
            }
        );
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
        } else if (actionToConfirm === 'remove-partner') {
            router.patch(
                updatePartnerAssignment.url({ estate: estate.ulid }),
                { partner_id: null, reason: 'Removed partner attribution via Zeus dashboard' },
                { preserveScroll: true, onFinish }
            );
        }
    };

    const currentSelectedPartner = partners.find((p) => String(p.id) === String(selectedPartnerId));

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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{estate.name}</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{estate.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/zeus/estates/${estate.id}/impersonate`}
                            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-500/20 shadow-sm transition-all hover:bg-amber-500/20 active:scale-95 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30"
                        >
                            <Shield className="h-4 w-4" />
                            Impersonate Estate Admin
                        </Link>

                        <Link
                            href={`/zeus/estates/${estate.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            Edit Estate
                        </Link>

                        <div className="relative">
                            <button
                                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                            >
                                <MoreVertical className="h-5 w-5" />
                            </button>

                            <AnimatePresence>
                                {isActionMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsActionMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            <Link
                                                href={`/zeus/estates/${estate.id}/impersonate`}
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                            >
                                                <Shield className="h-4 w-4" />
                                                Impersonate Admin
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setIsActionMenuOpen(false);
                                                    setSelectedPartnerId(estate.partner_id ?? '');
                                                    setAssignmentReason('');
                                                    setIsPartnerModalOpen(true);
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
                                            >
                                                <Handshake className="h-4 w-4" />
                                                {estate.partner ? 'Change Partner' : 'Assign Partner'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsActionMenuOpen(false);
                                                    setActionToConfirm('reset');
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                                Resend Invitation
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsActionMenuOpen(false);
                                                    setActionToConfirm('toggle');
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                <Power className="h-4 w-4" />
                                                {estate.status === 'active' ? 'Deactivate' : 'Activate'} Estate
                                            </button>
                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                            <button
                                                onClick={() => {
                                                    setIsActionMenuOpen(false);
                                                    setActionToConfirm('delete');
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete Estate
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800/30">
                    <div className="p-6 sm:p-8">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Plan</p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {(estate as any).subscription_record?.plan?.name ?? 'Standard Plan'}
                        </p>
                    </div>
                    <div className="p-6 sm:p-8">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Billing Mode</p>
                        <p className="mt-1 text-lg font-bold capitalize text-slate-900 dark:text-white">
                            {estate.settings?.charge_type === 'estate' ? 'Estate Billed' : 'Resident Billed'}
                        </p>
                    </div>
                    <div className="p-6 sm:p-8">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Created</p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatDate(estate.created_at)}</p>
                    </div>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column: Analytics & Residents */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Total Revenue</p>
                            <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                                {formatCurrency(analytics.total_revenue)}
                            </p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">This Month</p>
                            <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                                {formatCurrency(analytics.monthly_revenue)}
                            </p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Outstanding</p>
                            <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                                {formatCurrency(analytics.outstanding_amount)}
                            </p>
                        </div>
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Success Rate</p>
                            <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">{analytics.success_rate}%</p>
                        </div>
                    </div>

                    {/* Resident Subscriptions List */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Resident Subscriptions</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {residents.length} Total
                            </span>
                        </div>

                        {residents.length > 0 ? (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                {residents.map((resident) => (
                                    <div key={resident.id} className="flex items-center justify-between py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{resident.user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{resident.user.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ring-1 ring-inset ${
                                                    resident.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                                        : resident.status === 'trial'
                                                          ? 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                                                          : resident.status === 'past_due'
                                                            ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20'
                                                            : 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
                                                }`}
                                            >
                                                {resident.status.replace(/_/g, ' ')}
                                            </span>
                                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                {resident.next_due ? `Due: ${formatDate(resident.next_due)}` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                No residents enrolled yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Partner Attribution, Admin, Coupons */}
                <div className="space-y-8">
                    {/* Partner Attribution */}
                    <div className="rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-slate-800/50 dark:bg-[#0f1423]/80">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                <Handshake className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                Partner Attribution
                            </h3>
                            <div className="flex items-center gap-2">
                                {estate.partner ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPartnerId(estate.partner_id ?? '');
                                                setAssignmentReason('');
                                                setIsPartnerModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-1 rounded-xl bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 transition-all hover:bg-violet-100 active:scale-95 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                                        >
                                            <Pencil className="h-3 w-3" />
                                            Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActionToConfirm('remove-partner')}
                                            className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 active:scale-95 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPartnerId('');
                                            setAssignmentReason('');
                                            setIsPartnerModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-violet-600/20 transition-all hover:bg-violet-700 active:scale-95"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Assign
                                    </button>
                                )}
                            </div>
                        </div>

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
                                        <Link
                                            href={`/zeus/partners/${estate.partner.id}`}
                                            className="text-sm font-semibold text-slate-900 transition-colors hover:text-[#6C5DFD] hover:underline dark:text-white dark:hover:text-[#6C5DFD]"
                                        >
                                            {estate.partner.name}
                                        </Link>
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

                                {partnerEarnings && (
                                    <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
                                        <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase dark:text-violet-400">
                                            Partner Earnings from Estate
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">This Month: </span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(partnerEarnings.current_month_commission)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Total: </span>
                                                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                                    {formatCurrency(partnerEarnings.total_commission)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/30">
                                <Handshake className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">No partner assigned</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Assign this estate to a registered channel partner to enable revenue commission tracking.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPartnerId('');
                                        setAssignmentReason('');
                                        setIsPartnerModalOpen(true);
                                    }}
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    Assign Partner Now
                                </button>
                            </div>
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

            {/* Assign / Change Partner Modal */}
            <AnimatePresence>
                {isPartnerModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isAssigning && setIsPartnerModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-slate-950/80"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0f1423]"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                                        <Handshake className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            {estate.partner ? 'Change Partner Attribution' : 'Assign Partner'}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {estate.name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => !isAssigning && setIsPartnerModalOpen(false)}
                                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSavePartnerAssignment} className="mt-5 space-y-4">
                                <div>
                                    <label htmlFor="partner-select" className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        Select Partner <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        id="partner-select"
                                        value={selectedPartnerId}
                                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                                        required
                                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="" disabled>
                                            Choose an active partner...
                                        </option>
                                        {partners.map((partner) => (
                                            <option key={partner.id} value={partner.id}>
                                                {partner.name} ({partner.commission_rate}%){partner.email ? ` — ${partner.email}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {currentSelectedPartner && (
                                    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5 dark:border-violet-900/30 dark:bg-violet-950/20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {currentSelectedPartner.name}
                                                </p>
                                                {currentSelectedPartner.email && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {currentSelectedPartner.email}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                                                {currentSelectedPartner.commission_rate}% Rate
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="assignment-reason" className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        Reason / Note <span className="text-slate-400 normal-case">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="assignment-reason"
                                        value={assignmentReason}
                                        onChange={(e) => setAssignmentReason(e.target.value)}
                                        placeholder="e.g. Partner closed the enterprise deal directly..."
                                        rows={3}
                                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        This reason will be recorded in the attribution change audit history.
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsPartnerModalOpen(false)}
                                        disabled={isAssigning}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedPartnerId || isAssigning}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-600/20 hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {isAssigning ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                {estate.partner ? 'Update Assignment' : 'Confirm Assignment'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                          : actionToConfirm === 'remove-partner'
                            ? 'Remove Partner Attribution'
                            : 'Resend Invitation'
                }
                message={
                    actionToConfirm === 'toggle'
                        ? `Are you sure you want to ${estate.status === 'active' ? 'deactivate' : 'activate'} ${estate.name}? ${
                              estate.status === 'active' ? 'Users will lose access.' : 'Users will regain access.'
                          }`
                        : actionToConfirm === 'delete'
                          ? `Are you absolutely sure you want to completely delete ${estate.name}? This action cannot be undone and will erase all associated data permanently.`
                          : actionToConfirm === 'remove-partner'
                            ? `Are you sure you want to remove partner attribution for ${estate.partner?.name ?? 'the current partner'} from ${estate.name}? Commission calculations for this partner on future payments will be stopped.`
                            : `Are you sure you want to resend the invitation email to the primary admin of ${estate.name}?`
                }
                confirmLabel={
                    actionToConfirm === 'toggle'
                        ? `Yes, ${estate.status === 'active' ? 'Deactivate' : 'Activate'}`
                        : actionToConfirm === 'delete'
                          ? 'Yes, Delete Estate'
                          : actionToConfirm === 'remove-partner'
                            ? 'Yes, Remove Partner'
                            : 'Yes, Send Email'
                }
                type={actionToConfirm === 'delete' || actionToConfirm === 'remove-partner' || (actionToConfirm === 'toggle' && estate.status === 'active') ? 'danger' : 'info'}
                isLoading={isProcessing}
            />
        </ZeusLayout>
    );
}
