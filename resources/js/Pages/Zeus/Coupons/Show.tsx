import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
    Ticket, 
    Trash2, 
    Building2, 
    User, 
    Globe, 
    Calendar,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Infinity as InfinityIcon,
    DollarSign,
    Activity,
    AlertCircle,
    UserCheck,
    Coins,
    BarChart3,
    Eye,
    X
} from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface CouponLog {
    id: number;
    user: { id: number; name: string; email: string };
    invoice: { id: number; amount: number; created_at: string };
    discount_amount: number;
    created_at: string;
}

interface PaginatedLogs {
    data: CouponLog[];
    links: any[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface CouponDetails {
    id: number;
    code: string;
    description: string | null;
    internal_notes: string | null;
    campaign_name: string | null;
    marketing_tag: string | null;
    estate: { id: number; name: string } | null;
    user: { id: number; name: string; email: string } | null;
    creator: { id: number; name: string; email: string } | null;
    status: 'active' | 'paused' | 'expired' | 'scheduled';
    raw_status: string;
    type: 'percentage' | 'fixed';
    value: number;
    formatted_value: string;
    min_purchase: number | null;
    formatted_min_purchase: string | null;
    expires_at: string | null;
    starts_at: string | null;
    usage_limit: number | null;
    used_count: number;
    created_at: string;
}

interface Props {
    coupon: CouponDetails;
    logs: PaginatedLogs;
    stats: {
        total_redemptions: number;
        total_savings: string;
    };
}

export default function CouponShow({ coupon, logs, stats }: Props) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDeleteConfirm() {
        setIsDeleting(true);
        router.delete(`/zeus/coupons/${coupon.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
            },
        });
    }

    // Dynamic color helpers for statuses
    const getStatusStyle = (status: string) => {
        if (status === 'paused') {
            return {
                label: 'Paused',
                bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                dot: 'bg-amber-500'
            };
        }
        if (status === 'expired') {
            return {
                label: 'Expired',
                bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                dot: 'bg-rose-500'
            };
        }
        if (status === 'scheduled') {
            return {
                label: 'Scheduled',
                bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                dot: 'bg-blue-500'
            };
        }
        return {
            label: 'Active',
            bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            dot: 'bg-emerald-500'
        };
    };

    const statusStyle = getStatusStyle(coupon.status);
    const usagePercent = coupon.usage_limit 
        ? Math.min(100, Math.round((coupon.used_count / coupon.usage_limit) * 100)) 
        : 0;

    return (
        <ZeusLayout>
            <Head title={`Coupon details: ${coupon.code}`} />

            {/* Premium Decorative Glow */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />

            <div className="relative mx-auto max-w-7xl px-4 py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link 
                        href="/zeus/coupons" 
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Coupons
                    </Link>
                </div>

                {/* Main Header */}
                <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-8">
                    <div>
                        <div className="mb-3 flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 dark:text-indigo-400">Coupon Details</span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusStyle.bg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                                {statusStyle.label}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-mono">
                            {coupon.code}
                        </h1>
                        {coupon.campaign_name && (
                            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                                Name: <span className="text-slate-800 dark:text-white">{coupon.campaign_name}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white transition active:scale-[0.98] cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Coupon
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {/* Redeemed uses */}
                    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs relative overflow-hidden">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Coupon Redemptions</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{coupon.used_count}</span>
                            <span className="text-xs font-semibold text-slate-400">/ {coupon.usage_limit ? coupon.usage_limit : 'unlimited'} uses</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-500 font-bold">
                            <Activity className="h-3.5 w-3.5" />
                            <span>Total usage volume</span>
                        </div>
                    </div>

                    {/* Savings generated */}
                    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs relative overflow-hidden">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Discount Savings Saved</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.total_savings}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                            <Coins className="h-3.5 w-3.5" />
                            <span>Financial value saved</span>
                        </div>
                    </div>

                    {/* Discount value */}
                    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs relative overflow-hidden">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Discount Discount</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{coupon.formatted_value}</span>
                            <span className="text-xs font-semibold text-slate-400">reduction</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-500 font-bold">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Type: {coupon.type}</span>
                        </div>
                    </div>
                </div>

                {/* Detailed Sections (Config / Logs Split) */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Configuration details */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
                                Configuration Overview
                            </h3>

                            <div className="space-y-4">
                                {/* Type/Value */}
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Discount Configuration</span>
                                    <span className="mt-1 block text-sm font-semibold text-slate-850 dark:text-slate-200">
                                        {coupon.type === 'percentage' ? `${coupon.value}% Percentage discount` : `₦${(coupon.value / 100).toLocaleString()} Fixed reduction`}
                                    </span>
                                </div>

                                {/* Target Audience scope */}
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Audience Scope</span>
                                    <div className="mt-1 flex items-center gap-2">
                                        {coupon.estate ? (
                                            <>
                                                <Building2 className="h-4 w-4 text-emerald-500" />
                                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Estate Restricted: {coupon.estate.name}</span>
                                            </>
                                        ) : coupon.user ? (
                                            <>
                                                <User className="h-4 w-4 text-purple-500" />
                                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Resident Exclusive: {coupon.user.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Globe className="h-4 w-4 text-indigo-500" />
                                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Global (All Platform Estates)</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Expiration */}
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Lifespan Timeline</span>
                                    <div className="mt-1 space-y-1">
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span>Created: {coupon.created_at}</span>
                                        </div>
                                        {coupon.starts_at && (
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                                                <Clock className="h-4 w-4 text-slate-400" />
                                                <span>Starts: {coupon.starts_at}</span>
                                            </div>
                                        )}
                                        {coupon.expires_at ? (
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                                                <AlertCircle className="h-4 w-4 text-rose-400" />
                                                <span>Expires: {coupon.expires_at}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
                                                <InfinityIcon className="h-4 w-4" />
                                                <span>Expires: Never (Permanent)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Minimum Purchase */}
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Minimum Purchase</span>
                                    <span className="mt-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {coupon.formatted_min_purchase ? `Required spending of ${coupon.formatted_min_purchase}` : 'No minimum spending required'}
                                    </span>
                                </div>

                                {/* Description */}
                                {coupon.description && (
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Description Label</span>
                                        <span className="mt-1 block text-sm font-medium text-slate-600 dark:text-slate-450 leading-relaxed">
                                            {coupon.description}
                                        </span>
                                    </div>
                                )}

                                {/* Marketing Tag */}
                                {coupon.marketing_tag && (
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Marketing Tag</span>
                                        <span className="mt-1.5 inline-block text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-lg">
                                            #{coupon.marketing_tag}
                                        </span>
                                    </div>
                                )}

                                {/* Created By */}
                                {coupon.creator && (
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Created By</span>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                                                {coupon.creator.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{coupon.creator.name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Internal Notes */}
                                {coupon.internal_notes && (
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Internal Audit Notes</span>
                                        <span className="mt-2 block text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#080b13] p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                            {coupon.internal_notes}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Audit Timeline & Redemptions log */}
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
                                Redemptions History Logs
                            </h3>

                            {/* Timeline */}
                            <div className="space-y-6">
                                {logs.data.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400">
                                        <Ticket className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-850 mb-2" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-white">No redemptions logged yet</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">This coupon has not been applied to any invoices yet.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-6 ml-3 space-y-6">
                                        {logs.data.map((log) => (
                                            <div key={log.id} className="relative">
                                                {/* Dot icon */}
                                                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-white dark:ring-[#0f1423]">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                </span>

                                                <div className="rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-[#080b13]/60 p-4 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-[#080b13] transition">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-black text-indigo-500 uppercase">
                                                                {log.user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{log.user.name}</span>
                                                                <span className="block text-[10px] text-slate-400 font-medium">{log.user.email}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-black text-emerald-500">
                                                            Saved ₦{(log.discount_amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {log.created_at}
                                                        </span>
                                                        <span>Invoice: #{log.invoice.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Logs Pagination */}
                            {logs.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Page {logs.current_page} of {logs.last_page}
                                    </span>
                                    <div className="flex gap-1">
                                        {logs.prev_page_url ? (
                                            <Link
                                                href={logs.prev_page_url}
                                                className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                            >
                                                Prev
                                            </Link>
                                        ) : (
                                            <span className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50">
                                                Prev
                                            </span>
                                        )}
                                        {logs.next_page_url ? (
                                            <Link
                                                href={logs.next_page_url}
                                                className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                            >
                                                Next
                                            </Link>
                                        ) : (
                                            <span className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50">
                                                Next
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Delete Dialog */}
            <ConfirmationModal
                title="Delete Platform Coupon?"
                message={`Are you sure you want to delete coupon code "${coupon.code}"? Once deleted, residents will no longer be able to apply this discount to billing invoices.`}
                confirmLabel="Delete Coupon"
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeleteModalOpen(false)}
                isOpen={deleteModalOpen}
            />
        </ZeusLayout>
    );
}
