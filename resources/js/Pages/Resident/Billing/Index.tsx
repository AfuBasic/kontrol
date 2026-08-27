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
    TicketIcon,
    TagIcon,
    CreditCardIcon,
    ArrowPathIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';

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

type Plan = {
    id: number;
    name: string;
    price: number;
    billing_interval: string;
    formatted_price: string;
};

type Props = {
    subscription: {
        status: SubscriptionStatus | string;
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
    };
    plans: Plan[];
    recentInvoices: {
        data: Invoice[];
        next_page_url: string | null;
        total: number;
    };
    autoAppliedCoupon?: {
        id: number;
        code: string;
        campaign_name: string;
        type: 'fixed' | 'percentage';
        value: number;
        formatted_value: string;
    } | null;
};

const formatDate = (iso?: string) => {
    if (!iso) return '-';
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
    needsAttention: boolean;
    statusKey: SubscriptionStatus;
    statusLabel: string;
    statusDescription: string;
    isNative: boolean;
    onOpenWeb: () => void;
};

function StatusBanner({ needsAttention, statusKey, statusLabel, statusDescription, isNative, onOpenWeb }: StatusBannerProps) {
    if (!needsAttention) {
        return null;
    }

    const isCritical = statusKey === 'expired';
    const accent = isCritical
        ? { iconBg: 'bg-rose-100', icon: 'text-rose-600', surface: 'bg-rose-50/70 border-rose-200/70' }
        : { iconBg: 'bg-amber-100', icon: 'text-amber-700', surface: 'bg-amber-50/60 border-amber-200/70' };

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
                <p className="truncate text-sm font-semibold text-slate-900">{statusLabel}</p>
                <p className="truncate text-xs text-slate-500">{statusDescription}</p>
            </div>

            {isNative && (
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

export default function ResidentBillingPage({ subscription, plans, recentInvoices, autoAppliedCoupon }: Props) {
    const [isNative, setIsNative] = useState(false);
    const [payingPlanId, setPayingPlanId] = useState<number | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showPlanSelection, setShowPlanSelection] = useState(false);
    const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
    const renewalSectionRef = useRef<HTMLElement>(null);

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupons, setAppliedCoupons] = useState<
        Record<number, { code: string; discount: number; formatted_discount: string; final_amount: number; formatted_final_amount: string }>
    >({});
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isAutoApplied, setIsAutoApplied] = useState(false);
    const [autoRenewConsent, setAutoRenewConsent] = useState(subscription.auto_renew_enabled ?? true);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());

        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('section') === 'renewal') {
                setTimeout(() => {
                    renewalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            }
        }
    }, []);

    useEffect(() => {
        let queryCoupon = '';
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            queryCoupon = urlParams.get('coupon') || '';
        }

        const targetCouponCode = queryCoupon || (autoAppliedCoupon ? autoAppliedCoupon.code : '');

        if (targetCouponCode) {
            setCouponCode(targetCouponCode);

            const autoValidate = async () => {
                setIsValidatingCoupon(true);
                setCouponError('');
                try {
                    const newApplied: typeof appliedCoupons = {};
                    let lastError = '';
                    let successCount = 0;

                    for (const plan of plans) {
                        const response = await fetch('/resident/billing/validate-coupon', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                            },
                            body: JSON.stringify({ code: targetCouponCode, plan_id: plan.id }),
                        });

                        const data = await response.json();

                        if (response.ok && data.status === 'success') {
                            newApplied[plan.id] = {
                                code: targetCouponCode,
                                discount: data.discount,
                                formatted_discount: data.formatted_discount,
                                final_amount: data.final_amount,
                                formatted_final_amount: data.formatted_final_amount,
                            };
                            successCount++;
                        } else {
                            lastError = data.message || 'Coupon code is invalid or has been deleted.';
                        }
                    }
                    if (successCount > 0) {
                        setAppliedCoupons(newApplied);
                        setIsAutoApplied(true);
                        setCouponError('');
                    } else {
                        setCouponError(lastError || 'This coupon code is invalid or no longer exists.');
                        setAppliedCoupons({});
                    }
                } catch (e) {
                    console.error('Auto coupon validation failed:', e);
                    setCouponError('An error occurred during coupon validation.');
                } finally {
                    setIsValidatingCoupon(false);
                }
            };

            autoValidate();
        }
    }, [autoAppliedCoupon, plans]);

    const isTrialExpired = subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date();
    const isSubscriptionExpired =
        (subscription.status === 'active' || subscription.status === 'past_due') &&
        subscription.current_period_end &&
        new Date(subscription.current_period_end) < new Date();

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

    let displayLabel = status.label;
    let displayDescription = '';
    let tone = TONE_STYLES[status.tone];

    if (isExpiringSoon) {
        displayLabel = subscription.status === 'trial' ? 'Trial expiring soon' : 'Subscription expiring soon';
        displayDescription = subscription.status === 'trial' ? `Current trial ${formatExpiresIn()}.` : `Current subscription ${formatExpiresIn()}.`;
        tone = TONE_STYLES['warning'];
    } else if (statusKey === 'expired') {
        displayLabel = isTrialExpired ? 'Trial expired' : 'Subscription expired';
        displayDescription = isTrialExpired
            ? `Your trial expired on ${formatDate(subscription.trial_ends_at)}. Settle the outstanding invoice to restore access.`
            : `Your subscription expired on ${formatDate(subscription.current_period_end)}. Renew to restore access.`;
    } else {
        displayDescription = status.description(formatDate(subscription.current_period_end || subscription.trial_ends_at));
    }

    const needsAttention = isExpiringSoon || statusKey === 'past_due' || statusKey === 'expired';

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

    const handleApplyCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        setCouponError('');
        setIsAutoApplied(false);
        try {
            const newApplied: Record<number, any> = {};
            let lastError = '';
            let successCount = 0;

            for (const plan of plans) {
                const response = await fetch('/resident/billing/validate-coupon', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify({ code: couponCode, plan_id: plan.id }),
                });
                const data = await response.json();
                if (response.ok && data.status === 'success') {
                    newApplied[plan.id] = data;
                    successCount++;
                } else {
                    lastError = data.message || 'Failed to apply coupon.';
                }
            }

            if (successCount > 0) {
                setAppliedCoupons(newApplied);
                setCouponError('');
            } else {
                setCouponError(lastError);
                setAppliedCoupons({});
            }
        } catch (_err) {
            setCouponError('An error occurred. Please try again.');
            setAppliedCoupons({});
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setAppliedCoupons({});
        setCouponError('');
        setIsAutoApplied(false);
    };

    const handleSubscribe = (planId: number) => {
        if (payingPlanId) return;
        setPayingPlanId(planId);

        const payload: { plan_id: number; coupon_code?: string; auto_renew_consent?: boolean } = {
            plan_id: planId,
            auto_renew_consent: autoRenewConsent,
        };

        const couponForPlan = appliedCoupons[planId];
        if (couponForPlan) {
            payload.coupon_code = couponForPlan.code;
        }

        router.post(ResidentBillingController.subscribe.url(), payload, {
            preserveScroll: true,
            onFinish: () => setPayingPlanId(null),
        });
    };

    const handleToggleAutoRenew = (enable: boolean) => {
        if (isTogglingAutoRenew) return;
        setIsTogglingAutoRenew(true);

        const endpoint = enable ? '/resident/billing/auto-renew/enable' : '/resident/billing/auto-renew/disable';
        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsTogglingAutoRenew(false),
            },
        );
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

    const currentPlan = plans.find((p) => p.id === subscription.plan_id) || plans[0];
    const isPlanActive = statusKey === 'active' || statusKey === 'trial';

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
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Billing & Renewal</h1>
                        <p className="text-sm text-slate-500">Manage your subscription, automatic renewal, and receipts.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl space-y-6 px-5 py-6 sm:px-8 sm:py-10">
                <StatusBanner
                    needsAttention={needsAttention}
                    statusKey={statusKey}
                    statusLabel={displayLabel}
                    statusDescription={displayDescription}
                    isNative={isNative}
                    onOpenWeb={openWebApp}
                />

                {/* ─────────────────────────────────────────────────────────────
                    SECTION A: SUBSCRIPTION OVERVIEW
                ───────────────────────────────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
                >
                    <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Subscription</span>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone.pill}`}>
                                        {displayLabel}
                                    </span>
                                </div>

                                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                                    {currentPlan?.name || 'Resident Plan'}
                                </h2>
                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {currentPlan?.formatted_price}{' '}
                                    <span className="text-xs font-normal text-slate-500">/ {currentPlan?.billing_interval || 'term'}</span>
                                </p>
                            </div>

                            {isPlanActive && (
                                <button
                                    type="button"
                                    onClick={() => setShowPlanSelection(!showPlanSelection)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-98"
                                >
                                    <ArrowPathIcon className="h-3.5 w-3.5" />
                                    {showPlanSelection ? 'Keep current' : 'Change billing cycle'}
                                </button>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50/70 p-4 sm:p-5">
                            <div>
                                <p className="text-[11px] font-medium text-slate-500">Billing interval</p>
                                <p className="mt-0.5 text-sm font-bold text-slate-900 capitalize">
                                    {currentPlan?.billing_interval || 'Monthly'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-slate-500">
                                    {statusKey === 'trial' ? 'Trial ends' : isPlanActive ? 'Next renewal' : 'Ended on'}
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-slate-900">{formatDate(periodEnd)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Change Plan / Renew Flow */}
                    <AnimatePresence>
                        {(showPlanSelection || !isPlanActive) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-slate-100 bg-slate-50/40 p-6 sm:p-8"
                            >
                                <h3 className="mb-4 text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    Select a billing term
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                    {plans.map((plan) => {
                                        const isCurrent = subscription.plan_id === plan.id && isPlanActive;
                                        const isPaying = payingPlanId === plan.id;

                                        return (
                                            <div
                                                key={plan.id}
                                                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all ${
                                                    isCurrent
                                                        ? 'border-indigo-200 bg-indigo-50/40 shadow-xs'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                {isCurrent && (
                                                    <span className="absolute top-0 right-0 rounded-tr-xl rounded-bl-xl bg-indigo-100 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-indigo-700 uppercase">
                                                        Current
                                                    </span>
                                                )}

                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900">{plan.name}</h4>
                                                    <div className="mt-2">
                                                        {appliedCoupons[plan.id] ? (
                                                            <>
                                                                <span className="text-xs font-medium text-slate-400 line-through">
                                                                    {plan.formatted_price}
                                                                </span>
                                                                <p className="text-xl font-bold tracking-tight text-indigo-600">
                                                                    {appliedCoupons[plan.id].formatted_final_amount}
                                                                </p>
                                                                <span className="mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                    Save {appliedCoupons[plan.id].formatted_discount}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <p className="text-xl font-bold tracking-tight text-slate-900">
                                                                {plan.formatted_price}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-slate-500 capitalize">{plan.billing_interval}</p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleSubscribe(plan.id)}
                                                    disabled={payingPlanId !== null || (isCurrent && !appliedCoupons[plan.id])}
                                                    className={`mt-4 w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                                                        isCurrent && !appliedCoupons[plan.id]
                                                            ? 'cursor-default bg-slate-100 text-slate-400'
                                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                                    } flex items-center justify-center disabled:opacity-60`}
                                                >
                                                    {isPaying ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : isCurrent ? (
                                                        appliedCoupons[plan.id] ? (
                                                            'Renew with Coupon'
                                                        ) : (
                                                            'Active Term'
                                                        )
                                                    ) : (
                                                        'Switch to this term'
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Coupon drawer when selecting a term */}
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                    <form onSubmit={handleApplyCoupon} className="flex gap-2" noValidate>
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code..."
                                            disabled={Object.keys(appliedCoupons).length > 0 || isValidatingCoupon}
                                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-3 font-mono text-xs tracking-wider uppercase focus:border-indigo-500 focus:outline-none"
                                        />
                                        {Object.keys(appliedCoupons).length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={handleRemoveCoupon}
                                                className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={!couponCode.trim() || isValidatingCoupon}
                                                className="flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                                            </button>
                                        )}
                                    </form>

                                    {couponError && (
                                        <p className="mt-2 text-xs font-medium text-rose-600">{couponError}</p>
                                    )}

                                    {Object.keys(appliedCoupons).length > 0 && (
                                        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                            <TagIcon className="h-3.5 w-3.5" />
                                            Coupon applied for checkout
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION B: PAYMENT & RENEWAL (Deep-link target #renewal)
                ───────────────────────────────────────────────────────────── */}
                <motion.section
                    ref={renewalSectionRef}
                    id="renewal"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                    <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Payment & Renewal</span>
                    </div>

                    <div className="p-6 sm:p-8">
                        {/* Saved Payment Method */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-900">Saved payment method</h3>
                            <p className="text-xs text-slate-500">Method used for future subscription renewals.</p>

                            <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-2xs ring-1 ring-slate-200">
                                        <CreditCardIcon className="h-5 w-5" strokeWidth={1.8} />
                                    </div>
                                    <div>
                                        {subscription.has_saved_card ? (
                                            <>
                                                <p className="text-xs font-bold text-slate-900 capitalize">
                                                    {subscription.payment_method?.brand || subscription.card_brand || 'Card'} ••••{' '}
                                                    {subscription.payment_method?.last4 || subscription.card_last4 || '••••'}
                                                </p>
                                                <p className="text-[11px] text-slate-500">Stored safely via payment gateway</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs font-semibold text-slate-700">No saved card</p>
                                                <p className="text-[11px] text-slate-400">Card authorization is stored upon successful card payment.</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {subscription.has_saved_card && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                                        <CheckIcon className="h-3 w-3 stroke-[2.5]" />
                                        Ready
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Auto-renew Control */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-900">Automatic renewal</h4>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                subscription.auto_renew_enabled
                                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {subscription.auto_renew_enabled ? 'Enabled' : 'Off'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {subscription.auto_renew_enabled
                                            ? 'Future subscription invoices will be automatically charged using your saved card at the end of each billing term.'
                                            : 'Automatically pay future subscription invoices using your saved card so you do not have to settle them manually.'}
                                    </p>
                                </div>

                                {subscription.has_saved_card && (
                                    <div className="shrink-0">
                                        {subscription.auto_renew_enabled ? (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAutoRenew(false)}
                                                disabled={isTogglingAutoRenew}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                {isTogglingAutoRenew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                Turn off automatic renewal
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAutoRenew(true)}
                                                disabled={isTogglingAutoRenew}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                {isTogglingAutoRenew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                Turn on automatic renewal
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!subscription.has_saved_card && (
                                <p className="mt-3 text-[11px] text-slate-400">
                                    Automatic renewal can be enabled once your first subscription card payment is made.
                                </p>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* ─────────────────────────────────────────────────────────────
                    SECTION C: INVOICES & PAYMENTS
                ───────────────────────────────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                    <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Invoices & Payments</span>
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
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900">{invoice.formatted_amount}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatDate(invoice.created_at)} · {invoice.invoice_number}
                                                    </p>
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
                            <p className="mt-3 text-sm font-medium text-slate-900">No payment history yet</p>
                            <p className="mt-1 text-xs text-slate-500">Receipts and payment records will appear here after transactions.</p>
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
