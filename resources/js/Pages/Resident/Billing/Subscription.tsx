import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
    ArrowLeftIcon,
    ArrowTopRightOnSquareIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TagIcon,
    TicketIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import ResidentLayout from '@/Layouts/ResidentLayout';

type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'expired';

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
        computed_status: SubscriptionStatus;
        is_expiring_soon: boolean;
        days_remaining: number;
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
    plans: Plan[];
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
    if (!interval) return 'Term';
    return interval
        .replace(/_/g, '-')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
};

const STATUS_MAP: Record<SubscriptionStatus, { label: string; tone: 'success' | 'info' | 'warning' | 'danger' }> = {
    active: { label: 'Active', tone: 'success' },
    trial: { label: 'Free trial', tone: 'info' },
    past_due: { label: 'Past due', tone: 'warning' },
    expired: { label: 'Expired', tone: 'danger' },
};

const TONE_STYLES = {
    success: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    info: { dot: 'bg-indigo-500', pill: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
    warning: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 ring-amber-200' },
    danger: { dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export default function SubscriptionPage({ subscription, plans, autoAppliedCoupon }: Props) {
    const [isNative, setIsNative] = useState(false);
    const [payingPlanId, setPayingPlanId] = useState<number | null>(null);
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

    const statusKey = (subscription.computed_status || subscription.status) as SubscriptionStatus;
    const statusMeta = STATUS_MAP[statusKey] || STATUS_MAP.active;
    const tone = TONE_STYLES[statusMeta.tone] || TONE_STYLES.info;

    const currentPlan = plans.find((p) => p.id === subscription.plan_id) || plans[0];
    const isPlanActive = statusKey === 'active' || statusKey === 'trial';
    const periodEnd = subscription.current_period_end || subscription.trial_ends_at;
    const renewalDateLabel = formatDate(periodEnd);
    const renewalDateTitle = statusKey === 'trial' ? 'Trial ends' : isPlanActive ? 'Next renewal' : 'Ended on';

    const openWebApp = async () => {
        let url = `${window.location.origin}/resident/billing/subscription`;
        try {
            const response = await fetch(ResidentBillingController.generateMagicUrl.url({ destination: 'subscription' } as any));
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

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
            <Head title="Subscription & Plans" />

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href={ResidentBillingController.index.url()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        aria-label="Back to Billing Hub"
                    >
                        <ArrowLeftIcon className="h-5 w-5" strokeWidth={2.2} />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase leading-tight">Billing destination</p>
                        <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Subscription & Plans</h1>
                    </div>

                    {isNative && (
                        <button
                            type="button"
                            onClick={openWebApp}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                            title="Open in Web Browser"
                        >
                            <span className="hidden sm:inline">Browser</span>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                        </button>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
                {/* Active Plan Overview Card */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${tone.pill}`}>
                                    {statusMeta.label}
                                </span>
                            </div>
                            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{currentPlan?.name || 'Resident Plan'}</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {currentPlan?.formatted_price || '-'}{' '}
                                <span className="font-medium text-slate-500">/ {formatBillingInterval(currentPlan?.billing_interval)}</span>
                            </p>
                        </div>

                        <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:text-right">
                            <span className="text-[10px] font-black tracking-[0.16em] text-slate-400 uppercase">{renewalDateTitle}</span>
                            <span className="text-sm font-black text-slate-950">{renewalDateLabel}</span>
                        </div>
                    </div>
                </motion.section>

                {/* Plan Selection Section */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                >
                    <div className="border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Billing Cycle Options</span>
                        <h3 className="mt-1 text-base font-black tracking-tight text-slate-950">Choose or change your billing term</h3>
                        <p className="mt-1 text-xs text-slate-500">Selecting a term will initiate secure checkout with your preferred billing cycle.</p>
                    </div>

                    {plans.length > 0 ? (
                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan) => {
                                const isCurrent = subscription.plan_id === plan.id && isPlanActive;
                                const isPaying = payingPlanId === plan.id;
                                const appliedCoupon = appliedCoupons[plan.id];

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all ${
                                            isCurrent
                                                ? 'border-indigo-300 bg-indigo-50/60 shadow-xs'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        {isCurrent && (
                                            <span className="absolute top-0 right-0 rounded-tr-2xl rounded-bl-2xl bg-indigo-600 px-3 py-1 text-[9px] font-black tracking-[0.14em] text-white uppercase">
                                                Active Term
                                            </span>
                                        )}

                                        <div>
                                            <h4 className="pr-16 text-sm font-black text-slate-950">{plan.name}</h4>
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
                                            className={`mt-5 flex h-11 w-full items-center justify-center rounded-xl px-4 text-xs font-black transition-all disabled:opacity-60 ${
                                                isCurrent && !appliedCoupon
                                                    ? 'cursor-default bg-slate-100 text-slate-400'
                                                    : 'bg-slate-950 text-white hover:bg-slate-800 active:scale-[0.98]'
                                            }`}
                                        >
                                            {isPaying ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isCurrent ? (
                                                appliedCoupon ? (
                                                    'Renew with coupon'
                                                ) : (
                                                    'Current term'
                                                )
                                            ) : (
                                                'Select term & Pay'
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                            Billing plans are not available right now.
                        </div>
                    )}

                    {/* Auto-renew consent */}
                    <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                        <input
                            type="checkbox"
                            checked={autoRenewConsent}
                            onChange={(event) => setAutoRenewConsent(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span>
                            <span className="block text-sm font-black text-slate-950">Enable automatic renewal for future cycles</span>
                            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                Your card authorization from checkout will be stored securely to auto-renew on the renewal date.
                            </span>
                        </span>
                    </label>

                    {/* Coupon Box */}
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <TicketIcon className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                            <p className="text-xs font-black tracking-[0.14em] text-slate-400 uppercase">Promo or Discount Coupon</p>
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
                </motion.section>

                <p className="mt-6 flex items-center justify-center gap-1.5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[11px] font-bold text-slate-400">
                    <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Payments secured by Gateway
                </p>
            </main>
        </div>
    );
}

SubscriptionPage.layout = (page: ReactNode) => (
    <ResidentLayout hideHeader hideNav className="bg-[#f6f8fb]">
        {page}
    </ResidentLayout>
);
