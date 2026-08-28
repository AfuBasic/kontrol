import { Browser } from '@capacitor/browser';
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
import { type ReactNode, useEffect, useRef, useState } from 'react';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import ResidentLayout from '@/Layouts/ResidentLayout';

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

const formatBillingInterval = (interval?: string) => {
    if (!interval) {
        return 'Term';
    }

    return interval
        .replace(/_/g, '-')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
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
        if (isTrialExpired || isSubscriptionExpired || subscription.status === 'expired') {
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
    const hasSavedCard = subscription.has_saved_card;
    const autoRenewEnabled = Boolean(subscription.auto_renew_enabled);
    const billingIntervalLabel = formatBillingInterval(currentPlan?.billing_interval);
    const renewalDateLabel = formatDate(periodEnd);
    const cardBrand = subscription.payment_method?.brand || subscription.card_brand || 'Card';
    const cardLast4 = subscription.payment_method?.last4 || subscription.card_last4 || '••••';
    const savedPaymentLabel = hasSavedCard ? `${cardBrand} •••• ${cardLast4}` : 'No saved card yet';
    const paidInvoiceCount = recentInvoices.data.filter((invoice) => invoice.status === 'paid').length;
    const openInvoiceCount = recentInvoices.data.filter((invoice) => invoice.status !== 'paid').length;
    const receiptCountLabel = `${recentInvoices.total} ${recentInvoices.total === 1 ? 'receipt' : 'receipts'}`;
    const renewalDateTitle = statusKey === 'trial' ? 'Trial ends' : isPlanActive ? 'Next renewal' : 'Ended on';
    const primaryActionLabel = !isPlanActive ? 'Choose a billing term' : showPlanSelection ? 'Close billing options' : 'Change billing cycle';
    const billingHeadline =
        statusKey === 'expired'
            ? 'Renew your resident access'
            : statusKey === 'past_due'
              ? 'Payment needs attention'
              : statusKey === 'trial'
                ? 'Your trial is active'
                : 'Your subscription is active';
    const renewalSummary =
        statusKey === 'expired'
            ? 'Choose a billing term and complete payment to restore your resident tools.'
            : statusKey === 'past_due'
              ? 'Settle the pending charge so visitor passes, household tools, and estate updates remain available.'
              : autoRenewEnabled && hasSavedCard
                ? `We'll charge ${cardBrand} ending ${cardLast4} automatically on ${renewalDateLabel}.`
                : hasSavedCard
                  ? 'Your card is ready, but future renewals are manual until automatic renewal is turned on.'
                  : 'Make one card payment to save a secure payment method for future renewals.';
    const autoRenewCopy = autoRenewEnabled
        ? `Your next ${billingIntervalLabel.toLowerCase()} renewal is set to charge your saved card.`
        : hasSavedCard
          ? 'Future renewals will wait for manual payment unless you turn this on.'
          : 'Automatic renewal becomes available after a successful card payment.';

    const revealPlanSelection = () => {
        const shouldShowPlans = !isPlanActive || !showPlanSelection;
        setShowPlanSelection(shouldShowPlans);

        if (shouldShowPlans && typeof window !== 'undefined') {
            window.setTimeout(() => {
                document.getElementById('billing-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
            <Head title="Billing" />

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
                <StatusBanner
                    needsAttention={needsAttention}
                    statusKey={statusKey}
                    statusLabel={displayLabel}
                    statusDescription={displayDescription}
                    isNative={isNative}
                    onOpenWeb={openWebApp}
                />

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 text-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.75)]"
                >
                    <div className="p-5 sm:p-8 lg:p-9">
                        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                                        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                                        {displayLabel}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200 ring-1 ring-white/15">
                                        <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                                        Gateway secured
                                    </span>
                                </div>

                                <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">{billingHeadline}</h2>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">{renewalSummary}</p>

                                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={revealPlanSelection}
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
                                    >
                                        <ArrowPathIcon className="h-4 w-4" strokeWidth={2.4} />
                                        {primaryActionLabel}
                                    </button>

                                    {isNative && (
                                        <button
                                            type="button"
                                            onClick={openWebApp}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98] sm:w-auto"
                                        >
                                            <ArrowTopRightOnSquareIcon className="h-4 w-4" strokeWidth={2.4} />
                                            Open secure checkout
                                        </button>
                                    )}
                                </div>
                            </div>

                            <dl className="grid gap-3 sm:grid-cols-3 lg:w-80 lg:grid-cols-1">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                                    <dt className="text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">{renewalDateTitle}</dt>
                                    <dd className="mt-1 text-base font-black text-white">{renewalDateLabel}</dd>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                                    <dt className="text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">Current term</dt>
                                    <dd className="mt-1 text-base font-black text-white">{billingIntervalLabel}</dd>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                                    <dt className="text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">Payment setup</dt>
                                    <dd className="mt-1 text-base font-black text-white">{autoRenewEnabled ? 'Automatic' : hasSavedCard ? 'Manual' : 'Not set'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </motion.section>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 }}
                        className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                    >
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Plan & Renewal</span>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${tone.pill}`}>
                                            {displayLabel}
                                        </span>
                                    </div>
                                    <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{currentPlan?.name || 'Resident Plan'}</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                        {currentPlan?.formatted_price || '-'}{' '}
                                        <span className="font-medium text-slate-500">/ {currentPlan?.billing_interval || 'term'}</span>
                                    </p>
                                </div>

                                {isPlanActive && (
                                    <button
                                        type="button"
                                        onClick={revealPlanSelection}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
                                    >
                                        <ArrowPathIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                                        {showPlanSelection ? 'Keep current' : 'Change cycle'}
                                    </button>
                                )}
                            </div>

                            <dl className="mt-6 grid border-y border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-slate-100">
                                <div className="py-4 sm:pr-4">
                                    <dt className="text-[11px] font-bold text-slate-500">Billing interval</dt>
                                    <dd className="mt-1 text-sm font-black text-slate-950">{billingIntervalLabel}</dd>
                                </div>
                                <div className="border-t border-slate-100 py-4 sm:border-t-0 sm:px-4">
                                    <dt className="text-[11px] font-bold text-slate-500">{renewalDateTitle}</dt>
                                    <dd className="mt-1 text-sm font-black text-slate-950">{renewalDateLabel}</dd>
                                </div>
                                <div className="border-t border-slate-100 py-4 sm:border-t-0 sm:pl-4">
                                    <dt className="text-[11px] font-bold text-slate-500">Auto renewal</dt>
                                    <dd className="mt-1 text-sm font-black text-slate-950">{autoRenewEnabled ? 'On' : 'Off'}</dd>
                                </div>
                            </dl>

                            <div className="mt-5 space-y-3">
                                <div className="flex gap-3">
                                    <span
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                            isPlanActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                        }`}
                                    >
                                        {isPlanActive ? (
                                            <CheckIcon className="h-3.5 w-3.5 stroke-[2.8]" />
                                        ) : (
                                            <XMarkIcon className="h-3.5 w-3.5 stroke-[2.8]" />
                                        )}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-950">{isPlanActive ? 'Resident tools are available' : 'Access is paused'}</p>
                                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{displayDescription}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                            autoRenewEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <ArrowPathIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-950">
                                            {autoRenewEnabled ? 'Renewal is automatic' : 'Renewal still needs a manual action'}
                                        </p>
                                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{autoRenewCopy}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {(showPlanSelection || !isPlanActive) && (
                                <motion.div
                                    id="billing-plans"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-slate-100 bg-slate-50/55 p-5 sm:p-6"
                                >
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-sm font-black tracking-tight text-slate-950">Choose a billing term</h3>
                                        <p className="text-xs leading-5 text-slate-500">Your selected term opens secure checkout and updates this subscription after payment.</p>
                                    </div>

                                    {plans.length > 0 ? (
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {plans.map((plan) => {
                                                const isCurrent = subscription.plan_id === plan.id && isPlanActive;
                                                const isPaying = payingPlanId === plan.id;
                                                const appliedCoupon = appliedCoupons[plan.id];

                                                return (
                                                    <div
                                                        key={plan.id}
                                                        className={`relative flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all ${
                                                            isCurrent
                                                                ? 'border-indigo-200 bg-indigo-50/70 shadow-xs'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-white'
                                                        }`}
                                                    >
                                                        {isCurrent && (
                                                            <span className="absolute top-0 right-0 rounded-tr-2xl rounded-bl-2xl bg-indigo-100 px-2.5 py-1 text-[9px] font-black tracking-[0.14em] text-indigo-700 uppercase">
                                                                Current
                                                            </span>
                                                        )}

                                                        <div>
                                                            <h4 className="pr-14 text-sm font-black text-slate-950">{plan.name}</h4>
                                                            <div className="mt-3">
                                                                {appliedCoupon ? (
                                                                    <>
                                                                        <span className="text-xs font-bold text-slate-400 line-through">
                                                                            {plan.formatted_price}
                                                                        </span>
                                                                        <p className="text-2xl font-black tracking-tight text-indigo-600">
                                                                            {appliedCoupon.formatted_final_amount}
                                                                        </p>
                                                                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                                                            <TicketIcon className="h-3 w-3" strokeWidth={2.5} />
                                                                            Save {appliedCoupon.formatted_discount}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <p className="text-2xl font-black tracking-tight text-slate-950">{plan.formatted_price}</p>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-xs font-semibold text-slate-500">{formatBillingInterval(plan.billing_interval)}</p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleSubscribe(plan.id)}
                                                            disabled={payingPlanId !== null || (isCurrent && !appliedCoupon)}
                                                            className={`mt-4 flex h-10 w-full items-center justify-center rounded-xl px-3 text-xs font-black transition-all disabled:opacity-60 ${
                                                                isCurrent && !appliedCoupon
                                                                    ? 'cursor-default bg-slate-100 text-slate-400'
                                                                    : 'bg-slate-950 text-white hover:bg-slate-800 active:scale-[0.98]'
                                                            }`}
                                                        >
                                                            {isPaying ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : isCurrent ? (
                                                                appliedCoupon ? (
                                                                    'Renew with coupon'
                                                                ) : (
                                                                    'Active term'
                                                                )
                                                            ) : (
                                                                'Select term'
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                                            Billing terms are not available right now.
                                        </div>
                                    )}

                                    <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                        <input
                                            type="checkbox"
                                            checked={autoRenewConsent}
                                            onChange={(event) => setAutoRenewConsent(event.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <span>
                                            <span className="block text-sm font-black text-slate-950">Use automatic renewal after checkout</span>
                                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                Future invoices can be charged with the card used for this payment.
                                            </span>
                                        </span>
                                    </label>

                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <TicketIcon className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                                            <p className="text-xs font-black tracking-[0.14em] text-slate-400 uppercase">Coupon</p>
                                        </div>
                                        <form onSubmit={handleApplyCoupon} className="flex flex-col gap-2 sm:flex-row" noValidate>
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter coupon code"
                                                disabled={Object.keys(appliedCoupons).length > 0 || isValidatingCoupon}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs tracking-wider uppercase focus:border-indigo-500 focus:outline-none"
                                            />
                                            {Object.keys(appliedCoupons).length > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveCoupon}
                                                    className="h-11 shrink-0 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                                                >
                                                    Remove
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    disabled={!couponCode.trim() || isValidatingCoupon}
                                                    className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                                                >
                                                    {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                                                </button>
                                            )}
                                        </form>

                                        {couponError && <p className="mt-2 text-xs font-semibold text-rose-600">{couponError}</p>}

                                        {Object.keys(appliedCoupons).length > 0 && (
                                            <p className="mt-2 flex items-center gap-1 text-xs font-black text-emerald-700">
                                                <TagIcon className="h-3.5 w-3.5" />
                                                {isAutoApplied ? 'Coupon automatically applied for checkout' : 'Coupon applied for checkout'}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>

                    <motion.section
                        ref={renewalSectionRef}
                        id="renewal"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                    >
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Payment Setup</span>
                        </div>

                        <div className="divide-y divide-slate-100 px-5 sm:px-6">
                            <div className="flex gap-4 py-5">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                                    <CreditCardIcon className="h-5 w-5" strokeWidth={1.9} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-black text-slate-950">Saved payment method</h3>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${
                                                hasSavedCard
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                                    : 'bg-slate-100 text-slate-600 ring-slate-200'
                                            }`}
                                        >
                                            {hasSavedCard && <CheckIcon className="h-3 w-3 stroke-[2.5]" />}
                                            {hasSavedCard ? 'Ready' : 'Needed'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-bold text-slate-800 capitalize">{savedPaymentLabel}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {hasSavedCard
                                            ? 'Stored safely through the payment gateway for renewal payments.'
                                            : 'Card authorization is saved after a successful subscription checkout.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 py-5">
                                <span
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${
                                        autoRenewEnabled
                                            ? 'bg-indigo-50 text-indigo-600 ring-indigo-100'
                                            : 'bg-slate-50 text-slate-500 ring-slate-200'
                                    }`}
                                >
                                    <ArrowPathIcon className="h-5 w-5" strokeWidth={2.2} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-black text-slate-950">Automatic renewal</h3>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${
                                                autoRenewEnabled ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20' : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {autoRenewEnabled ? 'On' : 'Off'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{autoRenewCopy}</p>

                                    {hasSavedCard && (
                                        <div className="mt-4">
                                            {autoRenewEnabled ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleAutoRenew(false)}
                                                    disabled={isTogglingAutoRenew}
                                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                                                >
                                                    {isTogglingAutoRenew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                    Turn off automatic renewal
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleAutoRenew(true)}
                                                    disabled={isTogglingAutoRenew}
                                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
                                                >
                                                    {isTogglingAutoRenew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                    Turn on automatic renewal
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                >
                    <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Receipts & Payments</span>
                            <p className="mt-1 text-sm font-bold text-slate-950">{receiptCountLabel}</p>
                        </div>
                        {recentInvoices.data.length > 0 && (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                <span>{paidInvoiceCount} paid</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span>{openInvoiceCount} open</span>
                            </div>
                        )}
                    </div>

                    {recentInvoices.data.length > 0 ? (
                        <>
                            <ul className="divide-y divide-slate-100">
                                {recentInvoices.data.map((invoice) => {
                                    const paid = invoice.status === 'paid';
                                    const overdue = invoice.status === 'overdue';
                                    return (
                                        <li key={invoice.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                                        paid ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                                    }`}
                                                >
                                                    {paid ? (
                                                        <CheckCircleIcon className="h-5 w-5" strokeWidth={2.2} />
                                                    ) : overdue ? (
                                                        <ExclamationTriangleIcon className="h-5 w-5" strokeWidth={2.2} />
                                                    ) : (
                                                        <ClockIcon className="h-5 w-5" strokeWidth={2.2} />
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-950">{invoice.formatted_amount}</p>
                                                    <p className="mt-0.5 break-all text-xs leading-5 text-slate-500">
                                                        {formatDate(invoice.created_at)} · {invoice.invoice_number}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                    paid
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : overdue
                                                          ? 'bg-rose-50 text-rose-700'
                                                          : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {paid ? 'Paid' : overdue ? 'Overdue' : 'Pending'}
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
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 text-[11px] font-black tracking-[0.16em] text-slate-600 uppercase transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50"
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
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center sm:px-8">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <SparklesIcon className="h-5 w-5" strokeWidth={2} />
                            </span>
                            <p className="mt-3 text-sm font-black text-slate-950">No payment history yet</p>
                            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Receipts and payment records will appear here after successful transactions.</p>
                        </div>
                    )}
                </motion.section>

                <p className="mt-6 flex items-center justify-center gap-1.5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[11px] font-bold text-slate-400">
                    <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Payments secured by Gateway
                </p>
            </main>
        </div>
    );
}

ResidentBillingPage.layout = (page: ReactNode) => (
    <ResidentLayout hideHeader hideNav className="bg-[#f6f8fb]">
        {page}
    </ResidentLayout>
);
