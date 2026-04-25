import { Capacitor } from '@capacitor/core';
import {
    CreditCardIcon,
    CheckCircleIcon,
    ArrowTopRightOnSquareIcon,
    ShieldCheckIcon,
    SparklesIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';

type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'expired';

type Invoice = {
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
    };
    outstanding: {
        amount: number;
        formatted_amount: string;
        invoice_count: number;
        next_invoice_id: number | null;
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
        label: 'Payment overdue',
        tone: 'warning',
        description: () => 'Your last payment did not go through. Update your payment to keep your access.',
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

export default function ResidentBillingPage({ subscription, estatePlan, recentInvoices, outstanding }: Props) {
    const [isNative, setIsNative] = useState(false);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    const statusKey = (
        ['active', 'trial', 'past_due', 'expired'].includes(subscription.status) ? subscription.status : 'active'
    ) as SubscriptionStatus;
    const status = STATUS_MAP[statusKey];
    const tone = TONE_STYLES[status.tone];

    const periodEnd = subscription.current_period_end || subscription.trial_ends_at;
    const hasOutstanding = outstanding.amount > 0;
    const needsAttention = !hasOutstanding && (statusKey === 'past_due' || statusKey === 'expired');

    const toggleAutoRenewal = () => {
        const next = subscription.billing_preference === 'auto' ? 'manual' : 'auto';
        router.patch(ResidentBillingController.updatePreference.url(), { billing_preference: next }, { preserveScroll: true });
    };

    const openWebApp = () => {
        const url = `${window.location.origin}/resident/billing`;
        window.open(url, '_blank');
    };

    const handlePayOutstanding = () => {
        router.post(ResidentBillingController.payOutstanding.url());
    };

    const handlePayInvoice = (invoiceId: number) => {
        router.post(ResidentBillingController.pay.url(invoiceId));
    };

    const payOutstanding = () => {
        if (paying) return;
        setPaying(true);
        router.post(ResidentBillingController.payOutstanding.url(), {}, { onFinish: () => setPaying(false) });
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
                        <p className="text-sm text-slate-500">Manage your plan and payment details.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-10">
                {/* Outstanding card — primary call to action when there's money owed */}
                {hasOutstanding && (
                    <motion.section
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-[0_8px_32px_-12px_rgba(15,23,42,0.4)]"
                    >
                        <div className="relative px-6 py-6 sm:px-8 sm:py-7">
                            <div
                                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                                style={{
                                    background:
                                        'radial-gradient(80% 60% at 0% 0%, #f59e0b 0%, transparent 60%), radial-gradient(60% 50% at 100% 100%, #6366f1 0%, transparent 55%)',
                                }}
                            />
                            <div className="relative">
                                <div className="flex items-center gap-2 text-amber-300">
                                    <ExclamationTriangleIcon className="h-4 w-4" strokeWidth={2.2} />
                                    <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">Outstanding balance</span>
                                </div>

                                <p className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{outstanding.formatted_amount}</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                                    {outstanding.invoice_count === 1
                                        ? 'You have 1 unpaid invoice.'
                                        : `You have ${outstanding.invoice_count} unpaid invoices.`}{' '}
                                    {statusKey === 'past_due' ? 'Settle now to keep your access uninterrupted.' : 'Settle now to clear your account.'}
                                </p>

                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    {isNative ? (
                                        <button
                                            onClick={openWebApp}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                                        >
                                            Open Kontrol Web to pay
                                            <ArrowTopRightOnSquareIcon className="h-4 w-4" strokeWidth={2.2} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={payOutstanding}
                                            disabled={paying}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
                                        >
                                            <LockClosedIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                                            {paying ? 'Redirecting…' : `Pay ${outstanding.formatted_amount}`}
                                        </button>
                                    )}
                                    {!isNative && (
                                        <span className="text-[11px] font-medium text-slate-400">
                                            You'll be redirected to Paystack to complete payment.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Action banner — only when something needs attention */}
                {needsAttention && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-5 flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 ring-1 ${tone.ring}`}
                    >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <ExclamationTriangleIcon className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-amber-900">{status.label}</p>
                            <p className="mt-0.5 text-sm leading-relaxed text-amber-800/90">{status.description(formatDate(periodEnd))}</p>

                            {isNative ? (
                                <button
                                    onClick={openWebApp}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Open Kontrol Web
                                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                                </button>
                            ) : (
                                <button
                                    onClick={handlePayOutstanding}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Pay {outstanding.formatted_amount} now
                                </button>
                            )}
                        </div>
                    </motion.div>
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
                                    {status.label}
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

                    <dl className="mt-6 grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                        <div className="px-6 py-4 sm:px-8">
                            <dt className="text-xs font-medium text-slate-500">{statusKey === 'trial' ? 'Trial ends' : 'Next billing'}</dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(periodEnd)}</dd>
                        </div>
                        <div className="px-6 py-4 sm:px-8">
                            <dt className="text-xs font-medium text-slate-500">Auto-renewal</dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-900">{subscription.billing_preference === 'auto' ? 'On' : 'Off'}</dd>
                        </div>
                    </dl>
                </motion.section>

                {/* Payment method */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mt-5 rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-8">
                        <h3 className="text-sm font-semibold text-slate-900">Payment method</h3>
                        {subscription.has_saved_card && !isNative && (
                            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Update</button>
                        )}
                    </div>

                    <div className="px-6 py-5 sm:px-8">
                        {subscription.has_saved_card ? (
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200">
                                    <CreditCardIcon className="h-5 w-5 text-slate-600" strokeWidth={2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                        {subscription.card_brand ?? 'Card'} •••• {subscription.card_last4}
                                    </p>
                                    <p className="text-xs text-slate-500">Used for automatic renewals</p>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 ring-inset">
                                    <CheckCircleIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                                    Verified
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                                    <CreditCardIcon className="h-5 w-5 text-slate-500" strokeWidth={2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900">No card saved yet</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                        Save a card to enable seamless auto-renewal each cycle.
                                    </p>
                                    {isNative ? (
                                        <button
                                            onClick={openWebApp}
                                            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                                        >
                                            Open Kontrol Web to add a card
                                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handlePayOutstanding}
                                            className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            {outstanding.amount > 0 ? `Pay ${outstanding.formatted_amount} to save card` : 'Set up payment method'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 sm:px-8">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">Enable auto-renewal</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                We'll quietly renew your plan each cycle so you're never interrupted.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={subscription.billing_preference === 'auto'}
                            onClick={toggleAutoRenewal}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                                subscription.billing_preference === 'auto' ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 translate-y-px transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    subscription.billing_preference === 'auto' ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>
                </motion.section>

                {/* Payment history */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-5 rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                    <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
                        <h3 className="text-sm font-semibold text-slate-900">Payment history</h3>
                    </div>

                    {recentInvoices.data.length > 0 ? (
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
                                                        onClick={() => handlePayInvoice(invoice.id)}
                                                        className="ml-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-slate-800"
                                                    >
                                                        Pay
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
                    ) : (
                        <div className="flex flex-col items-center justify-center px-6 py-10 text-center sm:px-8">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <SparklesIcon className="h-5 w-5" strokeWidth={2} />
                            </span>
                            <p className="mt-3 text-sm font-medium text-slate-900">Nothing here yet</p>
                            <p className="mt-1 text-xs text-slate-500">Your invoices will appear here once your first payment is made.</p>
                        </div>
                    )}
                </motion.section>

                <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Secured by Paystack
                </p>
            </main>
        </div>
    );
}
