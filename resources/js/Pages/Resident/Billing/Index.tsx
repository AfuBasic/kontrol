import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowTopRightOnSquareIcon,
    ChevronRightIcon,
    CreditCardIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import ResidentLayout from '@/Layouts/ResidentLayout';

type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'expired';

type Props = {
    subscription: {
        status: SubscriptionStatus | string;
        computed_status?: SubscriptionStatus;
        is_expiring_soon?: boolean;
        days_remaining?: number;
        has_saved_card: boolean;
        auto_renew_enabled?: boolean;
        can_auto_renew?: boolean;
        show_auto_renew_suggestion?: boolean;
        payment_method?: {
            type: string;
            brand: string;
            last4: string;
        } | null;
        card_brand?: string;
        card_last4?: string;
        current_period_start?: string;
        current_period_end?: string;
        trial_ends_at?: string;
        plan_id?: number;
        plan_name?: string;
        plan_price?: string;
        billing_interval?: string;
    };
    receiptSummary?: {
        total_count: number;
        paid_count: number;
        open_count: number;
        latest_invoice?: {
            amount: string;
            status: string;
            created_at?: string;
            invoice_number: string;
        } | null;
    };
};

const formatDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatBillingInterval = (interval?: string) => {
    if (!interval) return 'Term';
    return interval
        .replace(/_/g, '-')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
};

const STATUS_MAP: Record<SubscriptionStatus, { label: string; tone: 'success' | 'info' | 'warning' | 'danger'; description: (date: string) => string }> = {
    active: {
        label: 'Active',
        tone: 'success',
        description: (date) => `Your plan renews on ${date}.`,
    },
    trial: {
        label: 'Free trial',
        tone: 'info',
        description: (date) => `Your trial ends on ${date}.`,
    },
    past_due: {
        label: 'Settlement overdue',
        tone: 'warning',
        description: () => 'Your last transaction did not go through. Update your card to keep access.',
    },
    expired: {
        label: 'Subscription expired',
        tone: 'danger',
        description: () => 'Your subscription has ended. Choose a term to restore resident access.',
    },
};

const TONE_STYLES = {
    success: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    info: { dot: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
    warning: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 ring-amber-200' },
    danger: { dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export default function ResidentBillingHubPage({ subscription, receiptSummary }: Props) {
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    const periodEnd = subscription.current_period_end || subscription.trial_ends_at;
    const isTrialExpired = subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date();
    const isSubscriptionExpired =
        (subscription.status === 'active' || subscription.status === 'past_due') &&
        subscription.current_period_end &&
        new Date(subscription.current_period_end) < new Date();

    const getComputedStatus = (): SubscriptionStatus => {
        if (subscription.computed_status) return subscription.computed_status;
        if (isTrialExpired || isSubscriptionExpired || subscription.status === 'expired') return 'expired';
        if (subscription.status === 'past_due') return 'past_due';
        if (subscription.status === 'trial') return 'trial';
        return 'active';
    };

    const statusKey = getComputedStatus();
    const statusMeta = STATUS_MAP[statusKey] || STATUS_MAP.active;

    const daysRemaining = subscription.days_remaining ?? (periodEnd ? Math.ceil((new Date(periodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999);
    const isExpiringSoon = subscription.is_expiring_soon ?? (daysRemaining <= 5 && daysRemaining >= 0 && statusKey !== 'expired' && statusKey !== 'past_due');

    const needsAttention = isExpiringSoon || statusKey === 'past_due' || statusKey === 'expired';

    let displayLabel = statusMeta.label;
    let displayDescription = statusMeta.description(formatDate(periodEnd));
    let tone = TONE_STYLES[statusMeta.tone];

    if (isExpiringSoon) {
        displayLabel = subscription.status === 'trial' ? 'Trial expiring soon' : 'Subscription expiring soon';
        displayDescription = `Current access expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`;
        tone = TONE_STYLES.warning;
    } else if (statusKey === 'expired') {
        displayLabel = isTrialExpired ? 'Trial expired' : 'Subscription expired';
        displayDescription = `Your plan expired on ${formatDate(periodEnd)}. Renew to keep resident tools.`;
    }

    const isPlanActive = statusKey === 'active' || statusKey === 'trial';
    const hasSavedCard = subscription.has_saved_card;
    const autoRenewEnabled = Boolean(subscription.auto_renew_enabled);
    const cardBrand = subscription.payment_method?.brand || subscription.card_brand || 'Card';
    const cardLast4 = subscription.payment_method?.last4 || subscription.card_last4 || '••••';
    const renewalDateLabel = formatDate(periodEnd);
    const renewalDateTitle = statusKey === 'trial' ? 'Trial ends' : isPlanActive ? 'Next renewal' : 'Ended on';
    const intervalLabel = formatBillingInterval(subscription.billing_interval);

    // Dynamic destination summaries
    const subscriptionSummary = `${subscription.plan_name || 'Resident Plan'} · ${renewalDateTitle} ${renewalDateLabel}`;
    const paymentSummary = hasSavedCard
        ? `${cardBrand} •••• ${cardLast4} · Auto-renew ${autoRenewEnabled ? 'On' : 'Off'}`
        : 'No card saved · Manual renewal';

    const totalReceipts = receiptSummary?.total_count ?? 0;
    const receiptsSummary = totalReceipts > 0
        ? `${totalReceipts} ${totalReceipts === 1 ? 'record' : 'records'}${receiptSummary?.latest_invoice ? ` · Latest ${receiptSummary.latest_invoice.amount}` : ''}`
        : 'No transaction records yet';

    const openWebApp = async () => {
        let url = `${window.location.origin}/resident/billing`;
        try {
            const response = await fetch(ResidentBillingController.generateMagicUrl.url());
            const data = await response.json();
            if (data.magic_url) {
                url = data.magic_url;
            }
        } catch (error) {
            console.error('Failed to generate magic URL', error);
        }

        if (isNative) {
            try {
                await Browser.open({ url });
            } catch (e) {
                console.warn('Capacitor Browser open failed, fallback to window.open', e);
                window.open(url, '_system');
            }
        } else {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
            <Head title="Billing & Renewal" />

            <header className="border-b border-slate-200/70 bg-white/95 pt-[env(safe-area-inset-top,0px)]">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => window.history.back()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        aria-label="Back"
                    >
                        <ArrowLeftIcon className="h-5 w-5" strokeWidth={2.2} />
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Resident billing</p>
                        <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Billing & Renewal</h1>
                    </div>

                    {isNative && (
                        <button
                            type="button"
                            onClick={openWebApp}
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                            title="Open Billing in Web Browser"
                        >
                            <span className="hidden sm:inline">Browser</span>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                        </button>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
                {/* Attention Alert Banner */}
                {needsAttention && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        role="status"
                        className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                            statusKey === 'expired'
                                ? 'bg-rose-50/80 border-rose-200/80'
                                : 'bg-amber-50/70 border-amber-200/80'
                        }`}
                    >
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                statusKey === 'expired' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            <ExclamationTriangleIcon className="h-4 w-4" strokeWidth={2.4} />
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950">{displayLabel}</p>
                            <p className="truncate text-xs text-slate-600">{displayDescription}</p>
                        </div>

                        <Link
                            href={ResidentBillingController.subscription.url()}
                            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-slate-900 border border-slate-200 shadow-2xs transition hover:bg-slate-50"
                        >
                            Review
                        </Link>
                    </motion.div>
                )}

                {/* Hero Summary Card */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 text-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.75)]"
                >
                    <div className="p-5 sm:p-7">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/15">
                                    <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                                    {displayLabel}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-300 ring-1 ring-white/15">
                                    <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                                    Secure Gateway
                                </span>
                            </div>

                            <Link
                                href={ResidentBillingController.subscription.url()}
                                className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white transition"
                            >
                                Change term
                                <ChevronRightIcon className="h-3 w-3" strokeWidth={2.5} />
                            </Link>
                        </div>

                        <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white">
                            {subscription.plan_name || 'Resident Subscription'}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-300">
                            {displayDescription}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
                                <p className="text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">{renewalDateTitle}</p>
                                <p className="mt-0.5 text-sm font-black text-white">{renewalDateLabel}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
                                <p className="text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">Billing Cycle</p>
                                <p className="mt-0.5 text-sm font-black text-white">{intervalLabel}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
                                <p className="text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">Auto Renewal</p>
                                <p className="mt-0.5 text-sm font-black text-white">{autoRenewEnabled ? 'Active' : hasSavedCard ? 'Manual' : 'Not setup'}</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* 3 Core Destination Navigation Rows (Apple Settings / Linear Style) */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                >
                    <div className="border-b border-slate-100 px-5 py-3.5 sm:px-6">
                        <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Billing Destinations</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {/* Destination 1: Subscription & Plans */}
                        <Link
                            href={ResidentBillingController.subscription.url()}
                            className="group flex items-center justify-between gap-4 p-5 sm:px-6 transition hover:bg-slate-50/80 active:bg-slate-100/70"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 group-hover:scale-105 transition-transform">
                                    <SparklesIcon className="h-6 w-6" strokeWidth={1.8} />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-slate-950 group-hover:text-indigo-600 transition-colors">
                                            Subscription & Plans
                                        </h3>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${tone.pill}`}>
                                            {displayLabel}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">{subscriptionSummary}</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" strokeWidth={2.2} />
                        </Link>

                        {/* Destination 2: Payment & Renewal */}
                        <Link
                            href={ResidentBillingController.payment.url()}
                            className="group flex items-center justify-between gap-4 p-5 sm:px-6 transition hover:bg-slate-50/80 active:bg-slate-100/70"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 group-hover:scale-105 transition-transform">
                                    <CreditCardIcon className="h-6 w-6" strokeWidth={1.8} />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-slate-950 group-hover:text-emerald-600 transition-colors">
                                            Payment & Renewal
                                        </h3>
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                            {hasSavedCard ? 'Card ready' : 'Card needed'}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">{paymentSummary}</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" strokeWidth={2.2} />
                        </Link>

                        {/* Destination 3: Receipts & Payments */}
                        <Link
                            href={ResidentBillingController.receipts.url()}
                            className="group flex items-center justify-between gap-4 p-5 sm:px-6 transition hover:bg-slate-50/80 active:bg-slate-100/70"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 group-hover:scale-105 transition-transform">
                                    <DocumentTextIcon className="h-6 w-6" strokeWidth={1.8} />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-slate-950 group-hover:text-amber-600 transition-colors">
                                            Receipts & Payments
                                        </h3>
                                        {totalReceipts > 0 && (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                {totalReceipts} total
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">{receiptsSummary}</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" strokeWidth={2.2} />
                        </Link>
                    </div>
                </motion.section>

                <p className="mt-6 flex items-center justify-center gap-1.5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[11px] font-bold text-slate-400">
                    <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Payments secured by Gateway
                </p>
            </main>
        </div>
    );
}

ResidentBillingHubPage.layout = (page: ReactNode) => (
    <ResidentLayout hideHeader hideNav className="bg-[#f6f8fb]">
        {page}
    </ResidentLayout>
);
