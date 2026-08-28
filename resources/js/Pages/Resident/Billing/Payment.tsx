import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowTopRightOnSquareIcon,
    CheckIcon,
    CreditCardIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    SparklesIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import ResidentLayout from '@/Layouts/ResidentLayout';

type Props = {
    subscription: {
        status: string;
        computed_status?: string;
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
        plan_name?: string;
        billing_interval?: string;
    };
};

const formatDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatBillingInterval = (interval?: string) => {
    if (!interval) return 'term';
    return interval
        .replace(/_/g, '-')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
};

export default function PaymentPage({ subscription }: Props) {
    const [isNative, setIsNative] = useState(false);
    const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
    const [isSettingUpCard, setIsSettingUpCard] = useState(false);
    const [isDismissingSuggestion, setIsDismissingSuggestion] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    const hasSavedCard = subscription.has_saved_card;
    const autoRenewEnabled = Boolean(subscription.auto_renew_enabled);
    const cardBrand = subscription.payment_method?.brand || subscription.card_brand || 'Card';
    const cardLast4 = subscription.payment_method?.last4 || subscription.card_last4 || '••••';
    const savedPaymentLabel = hasSavedCard ? `${cardBrand} •••• ${cardLast4}` : 'No saved card yet';
    const periodEnd = subscription.current_period_end || subscription.trial_ends_at;
    const renewalDateLabel = formatDate(periodEnd);
    const intervalLabel = formatBillingInterval(subscription.billing_interval);

    const openWebApp = async () => {
        let url = `${window.location.origin}/resident/billing/payment`;
        try {
            const response = await fetch(ResidentBillingController.generateMagicUrl.url({ destination: 'payment' } as any));
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

    const handleToggleAutoRenew = (enable: boolean) => {
        if (isTogglingAutoRenew) return;
        setIsTogglingAutoRenew(true);

        const endpoint = enable ? ResidentBillingController.enableAutoRenew.url() : ResidentBillingController.disableAutoRenew.url();
        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsTogglingAutoRenew(false),
            },
        );
    };

    const handleSetupPaymentMethod = () => {
        if (isSettingUpCard) return;
        setIsSettingUpCard(true);

        router.post(
            ResidentBillingController.setupPaymentMethod.url(),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsSettingUpCard(false),
            },
        );
    };

    const handleDismissSuggestion = () => {
        if (isDismissingSuggestion) return;
        setIsDismissingSuggestion(true);

        router.post(
            ResidentBillingController.dismissAutoRenewSuggestion.url(),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsDismissingSuggestion(false),
            },
        );
    };

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
            <Head title="Payment & Renewal" />

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
                        <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Payment & Renewal</h1>
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
                {/* Auto-renew Suggestion Banner */}
                {subscription.show_auto_renew_suggestion && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-4"
                    >
                        <div className="flex gap-3">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                                <SparklesIcon className="h-4 w-4" strokeWidth={2.2} />
                            </span>
                            <div>
                                <p className="text-sm font-black text-indigo-950">Turn on seamless automatic renewal</p>
                                <p className="mt-0.5 text-xs leading-5 text-indigo-800/80">
                                    You have a saved {cardBrand} card ending in {cardLast4}. Turn on auto-renewal so your resident access continues uninterrupted on {renewalDateLabel}.
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAutoRenew(true)}
                                        disabled={isTogglingAutoRenew}
                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-black text-white shadow-2xs transition hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isTogglingAutoRenew && <Loader2 className="h-3 w-3 animate-spin" />}
                                        Turn on auto-renewal
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleDismissSuggestion}
                            disabled={isDismissingSuggestion}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Dismiss suggestion"
                        >
                            <XMarkIcon className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                    </motion.div>
                )}

                {/* Saved Payment Method Section */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                >
                    <div className="border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Payment Method</span>
                        <h2 className="mt-1 text-base font-black tracking-tight text-slate-950">Saved payment authorization</h2>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-800 ring-1 ring-slate-200">
                                <CreditCardIcon className="h-6 w-6" strokeWidth={1.8} />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-black text-slate-950 capitalize">{savedPaymentLabel}</p>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ring-1 ${
                                            hasSavedCard
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                                : 'bg-slate-100 text-slate-600 ring-slate-200'
                                        }`}
                                    >
                                        {hasSavedCard && <CheckIcon className="h-3 w-3 stroke-[2.5]" />}
                                        {hasSavedCard ? 'Active' : 'No card saved'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {hasSavedCard
                                        ? 'Card token is stored safely via Paystack for authorized future renewal charges.'
                                        : 'A saved card authorization is automatically captured when completing subscription checkout.'}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <button
                                type="button"
                                onClick={handleSetupPaymentMethod}
                                disabled={isSettingUpCard}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                            >
                                {isSettingUpCard && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {hasSavedCard ? 'Update card method' : 'Authorize a card'}
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* Automatic Renewal Settings */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-20px_rgba(15,23,42,0.22)]"
                >
                    <div className="border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">Subscription Renewal</span>
                        <h2 className="mt-1 text-base font-black tracking-tight text-slate-950">Automatic recurring charges</h2>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${
                                    autoRenewEnabled
                                        ? 'bg-indigo-50 text-indigo-600 ring-indigo-100'
                                        : 'bg-slate-50 text-slate-500 ring-slate-200'
                                }`}
                            >
                                <ArrowPathIcon className="h-6 w-6" strokeWidth={2} />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-black text-slate-950">Automatic Renewal</p>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                            autoRenewEnabled
                                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {autoRenewEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {autoRenewEnabled
                                        ? `Your saved ${cardBrand} card ending in ${cardLast4} will automatically be charged on ${renewalDateLabel} for your ${intervalLabel.toLowerCase()} renewal.`
                                        : hasSavedCard
                                          ? 'Automatic renewal is turned off. Your subscription will pause on expiration unless manually paid.'
                                          : 'Automatic renewal requires an active saved card payment method.'}
                                </p>
                            </div>
                        </div>

                        {hasSavedCard && (
                            <div className="shrink-0">
                                {autoRenewEnabled ? (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAutoRenew(false)}
                                        disabled={isTogglingAutoRenew}
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                                    >
                                        {isTogglingAutoRenew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Turn off automatic renewal
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAutoRenew(true)}
                                        disabled={isTogglingAutoRenew}
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
                                    >
                                        {isTogglingAutoRenew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Turn on automatic renewal
                                    </button>
                                )}
                            </div>
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

PaymentPage.layout = (page: ReactNode) => (
    <ResidentLayout hideHeader hideNav className="bg-[#f6f8fb]">
        {page}
    </ResidentLayout>
);
