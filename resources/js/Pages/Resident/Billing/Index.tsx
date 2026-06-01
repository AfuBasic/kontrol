import { Capacitor } from '@capacitor/core';
import {
    CheckCircleIcon,
    ArrowTopRightOnSquareIcon,
    ShieldCheckIcon,
    SparklesIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';

type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'expired';

type Invoice = {
    ulid: string;
    id: number;
    invoice_number: string;
    amount: number;
    formatted_amount: string;
    status: 'pending' | 'paid' | 'overdue';
    due_date: string;
    created_at: string;
};

type Props = {
    subscription: {
        status: SubscriptionStatus | string;
        billing_preference: 'auto' | 'manual';
        has_saved_card: boolean;
        card_brand?: string;
        card_last4?: string;
        current_period_end?: string;
        trial_ends_at?: string;
    };
    estatePlan: {
        name: string;
        price: number;
        interval: string;
    } | null;
    recentInvoices: {
        data: Invoice[];
        next_page_url: string | null;
        total: number;
    };
    outstanding: {
        amount: number;
        formatted_amount: string;
        invoice_count: number;
        next_invoice_ulid: string | null;
        next_due_date?: string;
    };
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount / 100);

const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

type StatusMeta = {
    label: string;
    tone: 'success' | 'info' | 'warning' | 'danger';
    description: (date: string) => string;
};

const STATUS_MAP: Record<SubscriptionStatus, StatusMeta> = {
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
        description: () => 'Your last transaction did not go through. Update your info to keep your access.',
    },
    expired: {
        label: 'Subscription expired',
        tone: 'danger',
        description: () => 'Your subscription has ended. Renew to restore access.',
    },
};

const TONE_STYLES: Record<StatusMeta['tone'], { dot: string; pill: string; ring: string }> = {
    success: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', ring: 'ring-emerald-100' },
    info: { dot: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-700 ring-indigo-200', ring: 'ring-indigo-100' },
    warning: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 ring-amber-200', ring: 'ring-amber-100' },
    danger: { dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 ring-rose-200', ring: 'ring-rose-100' },
};

type StatusBannerProps = {
    hasOutstanding: boolean;
    needsAttention: boolean;
    statusKey: SubscriptionStatus;
    statusLabel: string;
    statusDescription: string;
    outstanding: Props['outstanding'];
    isNative: boolean;
    paying: boolean;
    onSettle: () => void;
    onOpenWeb: () => void;
    daysRemaining: number;
};

function StatusBanner({
    hasOutstanding,
    needsAttention,
    statusKey,
    statusLabel,
    statusDescription,
    outstanding,
    isNative,
    paying,
    onSettle,
    onOpenWeb,
    daysRemaining,
}: StatusBannerProps) {
    if (!hasOutstanding && !needsAttention) {
        return null;
    }

    const isCritical = statusKey === 'expired';
    const accent = isCritical
        ? { iconBg: 'bg-rose-100', icon: 'text-rose-600', surface: 'bg-rose-50/70 border-rose-200/70' }
        : { iconBg: 'bg-amber-100', icon: 'text-amber-700', surface: 'bg-amber-50/60 border-amber-200/70' };

    const title = hasOutstanding ? `${outstanding.formatted_amount} outstanding` : statusLabel;

    const subtext = hasOutstanding
        ? `${outstanding.invoice_count === 1 ? '1 unpaid invoice' : `${outstanding.invoice_count} unpaid invoices`} · ${
              statusKey === 'past_due' || statusKey === 'expired' ? 'Access is currently limited' : 'Settle to clear your account'
          }`
        : statusDescription;

    const showSettle = !isNative || daysRemaining <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className={`mb-4 flex items-center gap-3 rounded-2xl border ${accent.surface} px-4 py-3`}
        >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${accent.iconBg} ${accent.icon}`}>
                <ExclamationTriangleIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                <p className="truncate text-xs text-slate-500">{subtext}</p>
            </div>

            {showSettle ? (
                hasOutstanding ? (
                    <button
                        type="button"
                        onClick={onSettle}
                        disabled={paying}
                        className="inline-flex shrink-0 items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                        {paying ? 'Redirecting…' : 'Settle Now'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onOpenWeb}
                        className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                        Manage
                    </button>
                )
            ) : (
                <button
                    type="button"
                    onClick={onOpenWeb}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                    Open Web
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" strokeWidth={2.2} />
                </button>
            )}
        </motion.div>
    );
}

export default function ResidentBillingPage({ subscription, estatePlan, recentInvoices, outstanding }: Props) {
    const [isNative, setIsNative] = useState(false);
    const [paying, setPaying] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    const isTrialExpired = subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date();
    const isSubscriptionExpired = (subscription.status === 'active' || subscription.status === 'past_due') &&
        subscription.current_period_end && new Date(subscription.current_period_end) < new Date();

    const getComputedStatus = (): SubscriptionStatus => {
        if (isTrialExpired || subscription.status === 'expired') {
            return 'expired';
        }
        if (subscription.status === 'past_due') {
            return 'past_due';
        }
        if (subscription.status === 'trial') {
            return 'trial';
        }
        return 'active';
    };

    const statusKey = getComputedStatus();
    const status = STATUS_MAP[statusKey];

    // Compute remaining days
    const periodEnd = subscription.current_period_end || subscription.trial_ends_at;
    const getDaysRemaining = (): number => {
        if (!periodEnd) return 999;
        const diffTime = new Date(periodEnd).getTime() - new Date().getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    const daysRemaining = getDaysRemaining();
    const isExpiringSoon = daysRemaining <= 5 && daysRemaining >= 0 && statusKey !== 'expired' && statusKey !== 'past_due';

    const formatExpiresIn = () => {
        if (daysRemaining === 0) {
            return 'expires today';
        }
        return `expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
    };

    // Determine dynamic label and description
    let displayLabel = status.label;
    let displayDescription = '';
    let tone = TONE_STYLES[status.tone];

    if (isExpiringSoon) {
        displayLabel = subscription.status === 'trial' ? 'Trial expiring soon' : 'Subscription expiring soon';
        displayDescription = subscription.status === 'trial'
            ? `Current trial ${formatExpiresIn()}.`
            : `Current subscription ${formatExpiresIn()}.`;
        tone = TONE_STYLES['warning'];
    } else if (statusKey === 'expired') {
        displayLabel = isTrialExpired ? 'Trial expired' : 'Subscription expired';
        displayDescription = isTrialExpired
            ? `Your trial expired on ${formatDate(subscription.trial_ends_at)}. Settle the outstanding invoice to restore access.`
            : `Your subscription expired on ${formatDate(subscription.current_period_end)}. Renew to restore access.`;
    } else {
        displayDescription = status.description(formatDate(subscription.current_period_end || subscription.trial_ends_at));
    }

    const hasOutstanding = outstanding.amount > 0;
    const needsAttention = isExpiringSoon || (!hasOutstanding && (statusKey === 'past_due' || statusKey === 'expired'));

    const openWebApp = async () => {
        try {
            const response = await fetch(ResidentBillingController.generateMagicUrl.url());
            const data = await response.json();

            if (data.magic_url) {
                window.open(data.magic_url, '_blank');
            } else {
                window.open(`${window.location.origin}/resident/billing`, '_blank');
            }
        } catch (error) {
            console.error('Failed to generate magic URL', error);
            window.open(`${window.location.origin}/resident/billing`, '_blank');
        }
    };

    const handleAction = () => {
        if (paying) return;
        setPaying(true);

        if (outstanding.amount > 0) {
            router.post(ResidentBillingController.payOutstanding.url(), {}, { onFinish: () => setPaying(false) });
        } else {
            setPaying(false);
        }
    };

    const handleSettleInvoice = (invoiceUlid: string) => {
        router.post(ResidentBillingController.pay.url(invoiceUlid));
    };

    const loadMore = () => {
        if (recentInvoices.next_page_url && !isLoadingMore) {
            setIsLoadingMore(true);
            router.get(
                recentInvoices.next_page_url,
                {},
                {
                    preserveScroll: true,
                    only: ['recentInvoices'],
                    // @ts-expect-error - merge is a new Inertia v2 feature
                    merge: true,
                    onFinish: () => setIsLoadingMore(false),
                },
            );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/60">
            <Head title="Billing" />

            {/* Header */}
            <header className="border-b border-slate-200/70 bg-white">
                <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 pt-5 pb-4 sm:px-8 sm:pt-8">
                    <button
                        onClick={() => window.history.back()}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Back"
                    >
                        <ArrowLeftIcon className="h-5 w-5" strokeWidth={2.2} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Billing</h1>
                        <p className="text-sm text-slate-500">Manage your plan and settlement details.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-10">
                <StatusBanner
                    hasOutstanding={hasOutstanding}
                    needsAttention={needsAttention}
                    statusKey={statusKey}
                    statusLabel={displayLabel}
                    statusDescription={displayDescription}
                    outstanding={outstanding}
                    isNative={isNative}
                    paying={paying}
                    onSettle={handleAction}
                    onOpenWeb={openWebApp}
                    daysRemaining={daysRemaining}
                />

                {hasOutstanding && (
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/50 to-white p-6 shadow-[0_1px_3px_rgba(244,63,94,0.05),0_12px_24px_-8px_rgba(244,63,94,0.08)] sm:p-8"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className="text-xs font-bold tracking-wider text-rose-600 uppercase">Outstanding Balance</span>
                                <h3 className="mt-1 text-3xl font-extrabold text-slate-900">{outstanding.formatted_amount}</h3>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    {outstanding.invoice_count === 1 ? '1 invoice' : `${outstanding.invoice_count} invoices`} unpaid.
                                    {outstanding.next_due_date && (
                                        <> Due by <span className="font-semibold text-slate-700">{formatDate(outstanding.next_due_date)}</span></>
                                    )}
                                </p>
                            </div>

                            {!isNative ? (
                                <button
                                    type="button"
                                    onClick={handleAction}
                                    disabled={paying}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-500 active:scale-[0.98] disabled:opacity-60"
                                >
                                    {paying ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                                            Redirecting to Paystack…
                                        </>
                                    ) : (
                                        `Pay ${outstanding.formatted_amount}`
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openWebApp}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-6 py-3.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
                                >
                                    Open Web to Pay
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4" strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    </motion.section>
                )}

                {/* Plan card */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
                >
                    <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.pill}`}
                                >
                                    {displayLabel}
                                </span>
                            </div>
                            {estatePlan && (
                                <span className="text-xs font-medium text-slate-500">
                                    Billed {estatePlan.interval === 'monthly' ? 'monthly' : estatePlan.interval}
                                </span>
                            )}
                        </div>

                        <div className="mt-5">
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{estatePlan?.name ?? 'Standard plan'}</h2>
                            {estatePlan && (
                                <p className="mt-1 text-sm text-slate-500">
                                    <span className="text-base font-semibold text-slate-900">{formatCurrency(estatePlan.price)}</span>
                                    <span className="text-slate-500"> / {estatePlan.interval === 'monthly' ? 'month' : estatePlan.interval}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <dl className="mt-6 grid grid-cols-1 border-t border-slate-100">
                        <div className="px-6 py-4 sm:px-8">
                            <dt className="text-xs font-medium text-slate-500">
                                {isTrialExpired ? 'Trial expired on' : (
                                    isSubscriptionExpired || statusKey === 'expired' ? 'Subscription expired on' : (
                                        statusKey === 'trial' ? 'Trial ends' : 'Next billing'
                                    )
                                )}
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(periodEnd)}</dd>
                        </div>
                    </dl>
                </motion.section>

                {/* Transaction history */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-5 rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                    <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
                        <h3 className="text-sm font-semibold text-slate-900">Transaction history</h3>
                    </div>

                    {recentInvoices.data.length > 0 ? (
                        <>
                            <ul className="divide-y divide-slate-100">
                                {recentInvoices.data.map((invoice) => {
                                    const paid = invoice.status === 'paid';
                                    return (
                                        <li key={invoice.id} className="flex items-center justify-between px-6 py-3.5 sm:px-8">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                        paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                    }`}
                                                >
                                                    {paid ? (
                                                        <CheckCircleIcon className="h-4 w-4" strokeWidth={2.2} />
                                                    ) : (
                                                        <ClockIcon className="h-4 w-4" strokeWidth={2.2} />
                                                    )}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-900">{invoice.formatted_amount}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatDate(invoice.created_at)} · {invoice.invoice_number}
                                                        </p>
                                                    </div>
                                                    {!paid && !isNative && (
                                                        <button
                                                            onClick={() => handleSettleInvoice(invoice.ulid)}
                                                            className="ml-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-slate-800"
                                                        >
                                                            Settle
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium ${paid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {paid ? 'Paid' : invoice.status === 'overdue' ? 'Overdue' : 'Pending'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>

                            {recentInvoices.next_page_url && (
                                <div className="border-t border-slate-100 p-4 sm:p-6">
                                    <button
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 py-3 text-[11px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isLoadingMore ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                        ) : (
                                            <>
                                                Load More
                                                <ChevronDownIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-6 py-10 text-center sm:px-8">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <SparklesIcon className="h-5 w-5" strokeWidth={2} />
                            </span>
                            <p className="mt-3 text-sm font-medium text-slate-900">Nothing here yet</p>
                            <p className="mt-1 text-xs text-slate-500">Your invoices will appear here once your first transaction is made.</p>
                        </div>
                    )}
                </motion.section>

                <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Secured by Gateway
                </p>
            </main>
        </div>
    );
}
