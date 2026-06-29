import { ArrowLeftIcon, TicketIcon, CheckIcon, ClipboardDocumentIcon, ClockIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Coupon = {
    id: number;
    code: string;
    campaign_name: string;
    description: string | null;
    type: 'fixed' | 'percentage';
    value: number;
    formatted_value: string;
    min_purchase: number | null;
    formatted_min_purchase: string | null;
    expires_at: string | null;
    scope: 'estate' | 'resident' | 'global';
    personal_limit: number | null;
    personal_uses: number;
};

type Props = {
    coupons: Coupon[];
};

export default function CouponIndexPage({ coupons }: Props) {
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopy = (coupon: Coupon) => {
        navigator.clipboard.writeText(coupon.code);
        setCopiedId(coupon.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getScopeLabel = (scope: Coupon['scope']) => {
        switch (scope) {
            case 'estate':
                return 'Estate Special';
            case 'resident':
                return 'Exclusive Reward';
            default:
                return 'Global Promo';
        }
    };

    const getScopeBadgeStyle = (scope: Coupon['scope']) => {
        switch (scope) {
            case 'estate':
                return 'bg-indigo-50 text-indigo-700 ring-indigo-200/50';
            case 'resident':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-200/50';
            default:
                return 'bg-violet-50 text-violet-700 ring-violet-200/50';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/60 pb-16">
            <Head title="Offers & Coupons" />

            {/* Premium Decorative Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

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
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Offers & Coupons</h1>
                        <p className="text-sm text-slate-500">View and apply active discounts for your subscription payments.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-10">
                {coupons.length > 0 ? (
                    <div className="space-y-6">
                        {coupons.map((coupon) => {
                            const isCopyActive = copiedId === coupon.id;
                            const isUsedUp = coupon.personal_limit !== null && coupon.personal_uses >= coupon.personal_limit;

                            return (
                                <motion.div
                                    key={coupon.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`relative flex flex-col md:flex-row overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition hover:shadow-md ${isUsedUp ? 'opacity-60' : ''}`}
                                >
                                    {/* Left Coupon Ribbon - Discount Value */}
                                    <div className="flex flex-col items-center justify-center bg-slate-900 p-6 text-white md:w-44 shrink-0 text-center relative">
                                        <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-slate-50/60" />
                                        <div className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-slate-50/60" />
                                        
                                        <span className="text-[28px] font-black tracking-tight leading-none">
                                            {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.formatted_value}
                                        </span>
                                        <span className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Discount
                                        </span>
                                    </div>

                                    {/* Right Coupon Body */}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${getScopeBadgeStyle(coupon.scope)}`}>
                                                    {getScopeLabel(coupon.scope)}
                                                </span>
                                                {coupon.expires_at && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                                        <ClockIcon className="h-3 w-3" />
                                                        Expires {coupon.expires_at}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                                                {coupon.campaign_name}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                                {coupon.description || 'Enjoy a discount on your next subscription invoice payment.'}
                                            </p>
                                        </div>

                                        {/* Usage metrics / action footer */}
                                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-650">
                                                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>
                                                        Uses: {coupon.personal_uses} / {coupon.personal_limit !== null ? `${coupon.personal_limit} max` : 'unlimited'}
                                                    </span>
                                                </div>
                                                {coupon.personal_limit !== null && (
                                                    <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                                        <div 
                                                            className="h-full bg-slate-900" 
                                                            style={{ width: `${Math.min(100, (coupon.personal_uses / coupon.personal_limit) * 100)}%` }} 
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleCopy(coupon)}
                                                disabled={isUsedUp}
                                                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition ${
                                                    isCopyActive 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                                                }`}
                                            >
                                                {isCopyActive ? (
                                                    <>
                                                        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                                        Copy Code
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-350 bg-white p-12 text-center shadow-sm"
                    >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 mb-4 shadow-inner animate-pulse">
                            <TicketIcon className="h-6 w-6" strokeWidth={1.8} />
                        </span>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">No Active Offers</h2>
                        <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
                            There are currently no active discount coupons available for your resident account. Please check back later.
                        </p>
                        <Link
                            href="/resident/home"
                            className="mt-6 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                        >
                            Return to Dashboard
                        </Link>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
