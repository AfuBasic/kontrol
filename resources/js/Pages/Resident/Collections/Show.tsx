import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    Wallet,
    ChevronLeft,
    ChevronDown,
    ShieldCheck,
    ExternalLink,
    CheckCircle2,
    Circle,
    Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { index } from '@/actions/App/Http/Controllers/Resident/CollectionController';
import CollectionPaymentController from '@/actions/App/Http/Controllers/Web/CollectionPaymentController';
import type { SharedData } from '@/types';

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type?: string;
    recurring_interval?: string | null;
    late_fee?: number | null;
};

type Payment = {
    id: number;
    amount: number;
    provider: string;
    reference: string;
    paid_at: string;
};

type Assignment = {
    ulid: string;
    id: number;
    collection_id: number;
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'paid' | 'overdue' | 'grace' | 'partial' | 'cancelled';
    due_date: string;
    period: string | null;
    paid_at: string | null;
    created_at?: string;
    collection: Collection;
    payments?: Payment[];
    is_property_owner_bill?: boolean;
    billing_source?: 'estate' | 'property_owner';
};

type PaymentActivityItem = {
    id: number;
    sequence: number;
    type: string;
    label: string;
    status: string;
    amount: number;
    remaining_balance_after: number;
    provider: string;
    reference: string;
    paid_at: string | null;
    paid_at_label: string | null;
};

type TimelineItem = {
    id: string;
    type: string;
    label: string;
    description: string | null;
    amount: number | null;
    remaining_balance_after: number | null;
    occurred_at: string | null;
    occurred_at_label: string | null;
    state: 'complete' | 'current' | 'upcoming';
    meta?: {
        provider?: string;
        reference?: string;
    };
};

type Journey = {
    status_label: string;
    payment_count: number;
    total_paid: number;
    remaining_balance: number;
    percentage_paid: number;
    completion_date: string | null;
    total_transactions: number;
    original_amount: number;
    late_fees: number;
    discounts: number;
    total_outstanding: number;
    contextual_insight: string;
    cta_label: string | null;
    billing_cycle_label: string;
    payment_activity: PaymentActivityItem[];
    timeline: TimelineItem[];
};

type Props = {
    assignment: Assignment;
    journey?: Journey | null;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
    }).format(amount || 0);

function statusChipClasses(statusLabel: string): string {
    switch (statusLabel) {
        case 'Paid':
            return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
        case 'Partially Paid':
            return 'bg-blue-50 text-blue-700 ring-blue-100';
        case 'Overdue':
            return 'bg-rose-50 text-rose-700 ring-rose-100';
        case 'Cancelled':
            return 'bg-slate-100 text-slate-600 ring-slate-200';
        default:
            return 'bg-amber-50 text-amber-700 ring-amber-100';
    }
}

/**
 * Client-side fallback when the journey prop is missing (stale bundle, partial
 * reload, or older server response). Keeps the page from crashing.
 */
function buildFallbackJourney(assignment: Assignment): Journey {
    const originalAmount = Number(assignment.amount_due) || 0;
    const totalPaid = Number(assignment.amount_paid) || 0;
    const remainingBalance = Math.max(0, originalAmount - totalPaid);
    const percentagePaid =
        originalAmount > 0 ? Math.round(Math.min(100, (totalPaid / originalAmount) * 100) * 10) / 10 : totalPaid > 0 ? 100 : 0;

    const payments = [...(assignment.payments ?? [])].sort((a, b) => {
        const aTime = a.paid_at ? new Date(a.paid_at).getTime() : 0;
        const bTime = b.paid_at ? new Date(b.paid_at).getTime() : 0;
        return aTime - bTime;
    });

    let runningPaid = 0;
    const paymentActivity: PaymentActivityItem[] = payments.map((payment, index) => {
        runningPaid += Number(payment.amount) || 0;
        const remainingAfter = Math.max(0, originalAmount - runningPaid);

        return {
            id: payment.id,
            sequence: index + 1,
            type: remainingAfter <= 0 ? 'full_payment' : 'partial_payment',
            label: `Payment #${index + 1}`,
            status: 'completed',
            amount: Number(payment.amount) || 0,
            remaining_balance_after: remainingAfter,
            provider: payment.provider || 'paystack',
            reference: payment.reference,
            paid_at: payment.paid_at,
            paid_at_label: payment.paid_at
                ? new Date(payment.paid_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                  })
                : null,
        };
    });

    const statusLabel =
        assignment.status === 'paid' || remainingBalance <= 0
            ? 'Paid'
            : assignment.status === 'partial' || totalPaid > 0
              ? 'Partially Paid'
              : assignment.status === 'overdue'
                ? 'Overdue'
                : assignment.status === 'cancelled'
                  ? 'Cancelled'
                  : 'Outstanding';

    const formattedRemaining = formatCurrency(remainingBalance);
    const ctaLabel =
        remainingBalance <= 0
            ? null
            : totalPaid > 0
              ? `Pay Remaining ${formattedRemaining}`
              : `Pay ${formattedRemaining}`;

    return {
        status_label: statusLabel,
        payment_count: paymentActivity.length,
        total_paid: totalPaid,
        remaining_balance: remainingBalance,
        percentage_paid: percentagePaid,
        completion_date: assignment.paid_at,
        total_transactions: paymentActivity.length,
        original_amount: originalAmount,
        late_fees: Number(assignment.collection?.late_fee) || 0,
        discounts: 0,
        total_outstanding: remainingBalance,
        contextual_insight:
            remainingBalance <= 0
                ? 'This bill has been completely paid.'
                : paymentActivity.length === 0
                  ? 'No payments have been made yet.'
                  : percentagePaid >= 50
                    ? `You've settled ${Math.round(percentagePaid)}% of this bill.`
                    : `You've completed ${paymentActivity.length} payment${paymentActivity.length === 1 ? '' : 's'}.`,
        cta_label: ctaLabel,
        billing_cycle_label: assignment.period || 'One-Time',
        payment_activity: paymentActivity,
        timeline: [
            {
                id: 'invoice-created',
                type: 'invoice_created',
                label: 'Invoice Created',
                description: assignment.collection?.name ?? null,
                amount: originalAmount,
                remaining_balance_after: originalAmount,
                occurred_at: assignment.created_at ?? null,
                occurred_at_label: null,
                state: 'complete',
            },
            ...paymentActivity.map((activity) => ({
                id: `payment-${activity.id}`,
                type: activity.type,
                label: 'Payment Received',
                description: activity.label,
                amount: activity.amount,
                remaining_balance_after: activity.remaining_balance_after,
                occurred_at: activity.paid_at,
                occurred_at_label: activity.paid_at_label,
                state: 'complete' as const,
                meta: {
                    provider: activity.provider,
                    reference: activity.reference,
                },
            })),
            remainingBalance > 0
                ? {
                      id: 'balance-outstanding',
                      type: 'balance_outstanding',
                      label: 'Balance Outstanding',
                      description: null,
                      amount: remainingBalance,
                      remaining_balance_after: remainingBalance,
                      occurred_at: null,
                      occurred_at_label: null,
                      state: 'current' as const,
                  }
                : {
                      id: 'fully-settled',
                      type: 'fully_settled',
                      label: 'Fully Settled',
                      description: 'This bill has been completely paid.',
                      amount: originalAmount,
                      remaining_balance_after: 0,
                      occurred_at: assignment.paid_at,
                      occurred_at_label: null,
                      state: 'complete' as const,
                  },
        ],
    };
}

function AnimatedNumber({ value }: { value: number }) {
    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, { stiffness: 80, damping: 22 });
    const display = useTransform(spring, (latest) => formatCurrency(Math.round(latest)));
    const [text, setText] = useState(formatCurrency(0));

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    useEffect(() => {
        const unsubscribe = display.on('change', (latest) => setText(latest));
        return unsubscribe;
    }, [display]);

    return <span>{text}</span>;
}

function PaymentActivityCard({ payment, defaultOpen = false }: { payment: PaymentActivityItem; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-slate-100/80"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black tracking-tight text-slate-900">{payment.label}</h4>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                            Completed
                        </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-400">{payment.paid_at_label || '—'}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black tracking-tight text-slate-900">{formatCurrency(payment.amount)}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                        Remaining {formatCurrency(payment.remaining_balance_after)}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold tracking-wide text-slate-400 uppercase transition hover:text-slate-600"
            >
                Details
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Gateway</span>
                                <span className="font-semibold capitalize text-slate-700">
                                    {(payment.provider || 'paystack').replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="shrink-0 text-slate-400">Reference</span>
                                <span className="truncate font-mono text-xs font-semibold text-slate-700">{payment.reference}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}

export default function CollectionShow({ assignment, journey: journeyProp }: Props) {
    const { app_url: appUrl } = usePage<SharedData>().props;
    const [showTimeline, setShowTimeline] = useState(true);

    const journey = useMemo<Journey>(() => {
        if (journeyProp && typeof journeyProp.percentage_paid === 'number') {
            return {
                ...journeyProp,
                payment_activity: Array.isArray(journeyProp.payment_activity) ? journeyProp.payment_activity : [],
                timeline: Array.isArray(journeyProp.timeline) ? journeyProp.timeline : [],
            };
        }

        return buildFallbackJourney(assignment);
    }, [assignment, journeyProp]);

    const percentage = Math.min(100, Math.max(0, Number(journey.percentage_paid) || 0));
    const isSettled = (Number(journey.remaining_balance) || 0) <= 0 || assignment.status === 'paid';

    const rawPaymentUrl = CollectionPaymentController.show.url(assignment.ulid);
    const paymentUrl = rawPaymentUrl.startsWith('http') ? rawPaymentUrl : new URL(rawPaymentUrl, appUrl).href;

    const handleSettle = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                await Browser.open({ url: paymentUrl });
            } catch (err) {
                console.error('Failed to open in-app browser:', err);
                window.open(paymentUrl, '_system');
            }
        } else {
            window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const dueDateLabel = useMemo(() => {
        if (!assignment.due_date) {
            return '—';
        }
        return new Date(assignment.due_date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, [assignment.due_date]);

    const completionLabel = useMemo(() => {
        if (!journey.completion_date && !assignment.paid_at) {
            return null;
        }
        const raw = journey.completion_date || assignment.paid_at;
        return new Date(raw!).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, [journey.completion_date, assignment.paid_at]);

    const activityNewestFirst = useMemo(
        () => [...journey.payment_activity].sort((a, b) => b.sequence - a.sequence),
        [journey.payment_activity],
    );

    // Extra bottom space clears the floating CTA + resident dock (bottom-6 + pill + FAB)
    return (
        <div className="flex flex-col gap-10 pb-[calc(11.5rem+env(safe-area-inset-bottom,0px))] sm:pb-16">
            <Head title={assignment.collection.name} />

            {/* Back */}
            <section className="px-1">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dues
                </Link>
            </section>

            {/* Section 1 — Bill Header */}
            <section className="space-y-5 px-1">
                <div className="flex flex-wrap items-center gap-2">
                    {assignment.billing_source === 'property_owner' ? (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-[10px] font-black tracking-widest text-purple-700 uppercase ring-1 ring-purple-100/60">
                            Property Owner Bill
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black tracking-widest text-blue-700 uppercase ring-1 ring-blue-100/60">
                            Estate Dues
                        </span>
                    )}
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase ring-1 ${statusChipClasses(journey.status_label)}`}
                    >
                        {journey.status_label}
                    </span>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl">
                        {assignment.collection.name}
                    </h1>
                    <p className="max-w-xl text-base leading-relaxed font-medium text-slate-500">
                        {assignment.collection.description ||
                            (assignment.billing_source === 'property_owner'
                                ? 'Levy or charge issued by your property owner.'
                                : 'Official estate levy for this period.')}
                    </p>
                </div>
            </section>

            {/* Section 2 — Progress or Settled */}
            <section>
                {isSettled ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[2rem] bg-emerald-50/80 px-6 py-8 sm:px-8"
                    >
                        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                                    <CheckCircle2 className="h-7 w-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-emerald-950">Fully Settled</h2>
                                    <p className="mt-1 text-sm font-medium text-emerald-700/80">
                                        This bill has been completely paid.
                                    </p>
                                </div>
                            </div>
                            <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[280px]">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-emerald-700/60 uppercase">Completed</p>
                                    <p className="mt-1 text-sm font-black text-emerald-950">{completionLabel || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-emerald-700/60 uppercase">Payments</p>
                                    <p className="mt-1 text-sm font-black text-emerald-950">{journey.payment_count}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-emerald-700/60 uppercase">Paid</p>
                                    <p className="mt-1 text-sm font-black text-emerald-950">{formatCurrency(journey.total_paid)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-6 rounded-[2rem] bg-white px-6 py-7 shadow-sm ring-1 ring-slate-100/70 sm:px-8 sm:py-8">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">Bill Progress</p>
                                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                                    {Math.round(percentage)}% <span className="text-lg font-bold text-slate-400">Settled</span>
                                </p>
                            </div>
                            <p className="text-right text-sm font-medium text-slate-500">
                                <span className="font-black text-slate-900">{formatCurrency(journey.total_paid)}</span>
                                {' of '}
                                {formatCurrency(journey.original_amount)}
                            </p>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            />
                        </div>

                        <div className="flex items-end justify-between border-t border-slate-100 pt-5">
                            <div>
                                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Remaining Balance</p>
                                <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                                    <AnimatedNumber value={journey.remaining_balance} />
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                {journey.payment_count} {journey.payment_count === 1 ? 'payment' : 'payments'}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Insight */}
            <section className="px-1">
                <p className="text-sm leading-relaxed font-medium text-slate-500">
                    <span className="font-semibold text-slate-800">{journey.contextual_insight}</span>
                </p>
            </section>

            {/* Section 3 — Financial Summary */}
            <section className="space-y-1 px-1">
                <h2 className="mb-4 text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">Financial Summary</h2>
                <div className="space-y-0 divide-y divide-slate-100">
                    {[
                        { label: 'Original Bill', value: journey.original_amount, emphasize: false },
                        { label: 'Paid So Far', value: journey.total_paid, emphasize: false, positive: true },
                        { label: 'Remaining', value: journey.remaining_balance, emphasize: false },
                        { label: 'Late Fees', value: journey.late_fees, emphasize: false },
                        { label: 'Discounts', value: journey.discounts, emphasize: false },
                    ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-3.5">
                            <span className="text-sm font-medium text-slate-500">{row.label}</span>
                            <span
                                className={`text-sm font-bold ${
                                    row.positive && row.value > 0 ? 'text-emerald-600' : 'text-slate-800'
                                }`}
                            >
                                {row.positive && row.value > 0 ? '−' : ''}
                                {formatCurrency(row.value)}
                            </span>
                        </div>
                    ))}
                    <div className="flex items-baseline justify-between pt-5">
                        <span className="text-base font-black tracking-tight text-slate-900">Total Outstanding</span>
                        <span className="text-3xl font-black tracking-tight text-slate-900">
                            <AnimatedNumber value={journey.total_outstanding} />
                        </span>
                    </div>
                </div>
            </section>

            {/* Due date & cycle — compressed */}
            <section className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-slate-500">
                <span>
                    <span className="font-medium text-slate-400">Due Date</span>{' '}
                    <span className="font-bold text-slate-800">{dueDateLabel}</span>
                </span>
                <span className="text-slate-300">·</span>
                <span>
                    <span className="font-medium text-slate-400">Billing Cycle</span>{' '}
                    <span className="font-bold text-slate-800">{journey.billing_cycle_label}</span>
                </span>
            </section>

            {/* Section 4 — Payment Activity + Timeline */}
            <section className="space-y-5">
                <div className="flex items-end justify-between gap-3 px-1">
                    <div>
                        <h2 className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">Payment Activity</h2>
                        <p className="mt-1 text-lg font-black tracking-tight text-slate-900">
                            {journey.payment_count === 0
                                ? 'No payments yet'
                                : `${journey.payment_count} ${journey.payment_count === 1 ? 'Payment' : 'Payments'}`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowTimeline((v) => !v)}
                        className="text-[11px] font-bold tracking-wide text-blue-600 uppercase transition hover:text-blue-700"
                    >
                        {showTimeline ? 'List view' : 'Timeline'}
                    </button>
                </div>

                {journey.payment_count === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] bg-slate-50 px-6 py-14 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
                            <Wallet className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">No payments have been made yet.</p>
                        <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">
                            When you settle part or all of this bill, every payment will appear here as a clear timeline.
                        </p>
                    </div>
                ) : showTimeline ? (
                    <div className="relative space-y-0 pl-2">
                        {journey.timeline.map((item, index) => {
                            const isLast = index === journey.timeline.length - 1;
                            const isCurrent = item.state === 'current';
                            const isPayment = item.type === 'partial_payment' || item.type === 'full_payment';

                            return (
                                <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                                    {!isLast && (
                                        <div className="absolute top-5 left-[9px] h-[calc(100%-8px)] w-px bg-slate-200" />
                                    )}
                                    <div className="relative z-10 mt-1 shrink-0">
                                        {isCurrent ? (
                                            <Circle className="h-5 w-5 fill-white text-amber-400" strokeWidth={2.5} />
                                        ) : (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{item.label}</p>
                                                {item.description && (
                                                    <p className="mt-0.5 text-xs font-medium text-slate-400">{item.description}</p>
                                                )}
                                            </div>
                                            {item.occurred_at_label && (
                                                <p className="text-xs font-semibold text-slate-400">{item.occurred_at_label}</p>
                                            )}
                                        </div>

                                        {(isPayment || item.type === 'balance_outstanding' || item.type === 'invoice_created') &&
                                            item.amount !== null && (
                                                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                                    <p
                                                        className={`text-base font-black tracking-tight ${
                                                            isCurrent ? 'text-amber-600' : 'text-slate-900'
                                                        }`}
                                                    >
                                                        {formatCurrency(item.amount)}
                                                    </p>
                                                    {isPayment && item.remaining_balance_after !== null && (
                                                        <p className="text-xs font-medium text-slate-400">
                                                            Remaining {formatCurrency(item.remaining_balance_after)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        {item.meta?.reference && (
                                            <p className="mt-2 truncate font-mono text-[10px] text-slate-400">{item.meta.reference}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activityNewestFirst.map((payment, index) => (
                            <PaymentActivityCard key={payment.id} payment={payment} defaultOpen={index === 0} />
                        ))}
                    </div>
                )}
            </section>

            {/* CTA — sits above the resident floating dock (z-40, bottom-6 + pill + FAB) */}
            {!isSettled && journey.cta_label && (
                <section
                    className="pointer-events-none fixed inset-x-0 z-30 px-4 sm:static sm:mt-2 sm:px-0 sm:pb-0"
                    style={{
                        // Dock is bottom-6; pill ~3.5rem; FAB protrudes ~2.5rem → clear ~7.5–8rem
                        bottom: 'calc(7.75rem + env(safe-area-inset-bottom, 0px))',
                    }}
                >
                    <div className="pointer-events-auto mx-auto max-w-lg space-y-2 sm:max-w-none">
                        <button
                            type="button"
                            onClick={handleSettle}
                            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-[1.75rem] bg-[#1F6FDB] py-4 text-base font-black text-white shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98]"
                        >
                            {journey.cta_label}
                            <ExternalLink className="h-5 w-5" />
                        </button>
                        <div className="flex items-center justify-center gap-2 text-center">
                            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Secure bank transfer via Paystack
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
