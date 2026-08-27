import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Copy, Check, Calendar, Ticket, ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react';
import ResidentLayout from '@/Layouts/ResidentLayout';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import { useExternalBilling } from '@/Hooks/useExternalBilling';

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
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const { openExternalBilling } = useExternalBilling();

    const handleCopy = (e: React.MouseEvent, coupon: Coupon) => {
        e.stopPropagation();
        navigator.clipboard.writeText(coupon.code);
        setCopiedId(coupon.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRedeem = (e: React.MouseEvent, coupon: Coupon) => {
        e.stopPropagation();
        openExternalBilling(coupon.code);
    };

    // Separate active versus fully used/expired coupons
    const activeCoupons = coupons.filter((c) => {
        const isUsedUp = c.personal_limit !== null && c.personal_uses >= c.personal_limit;
        return !isUsedUp;
    });

    const usedCoupons = coupons.filter((c) => {
        const isUsedUp = c.personal_limit !== null && c.personal_uses >= c.personal_limit;
        return isUsedUp;
    });

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

    const faqs = [
        {
            q: 'How do I redeem my coupon?',
            a: "When you click 'Apply' on any coupon, you will be redirected to the billing page with the coupon code automatically pre-applied to your plans. You can also manually copy and paste the code during checkout.",
        },
        {
            q: 'Who is eligible for these coupons?',
            a: 'Eligibility depends on the coupon type. Estate coupons are automatically available to all residents of your estate. Exclusive rewards are targeted to your specific resident profile.',
        },
        {
            q: 'Can I use multiple coupons at checkout?',
            a: 'Only one coupon can be applied per subscription payment. The system will automatically select the best discount for you, but you can choose to apply a different code manually.',
        },
    ];

    const getValueFontSize = (val: string) => {
        if (val.length > 7) return 'text-[18px] sm:text-[20px]';
        if (val.length > 5) return 'text-[22px] sm:text-[24px]';
        return 'text-3xl';
    };

    return (
        <>
            <Head title="Discounts & Offers" />

            <div className="mx-auto min-h-screen max-w-lg bg-[#fafbfd] pb-24 text-slate-900">
                {/* Header Section */}
                <div className="mb-6 border-b border-slate-100/60 bg-[#fafbfd] px-6 pt-2 pb-5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-[17px] leading-none font-black tracking-tight text-slate-900">Offers</h1>
                            <p className="mt-1.5 text-[11px] font-semibold text-slate-500">Available discounts for your estate</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mt-8 px-6">
                    {/* Active Coupons List */}
                    {activeCoupons.length > 0 ? (
                        <div className="space-y-6">
                            {activeCoupons.map((coupon, idx) => {
                                const isCopyActive = copiedId === coupon.id;

                                return (
                                    <motion.div
                                        key={coupon.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                        className="relative"
                                    >
                                        {/* Boarding Pass Style Digital Voucher */}
                                        <div
                                            onClick={() => setSelectedCoupon(coupon)}
                                            className="relative flex cursor-pointer overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.02)] transition-all duration-300 hover:shadow-md active:scale-[0.99]"
                                        >
                                            {/* Left side tear-off (Discount Badge) */}
                                            <div className="relative flex w-28 shrink-0 flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-5 text-center text-white">
                                                {/* Left notch ticket cutouts */}
                                                <div className="absolute top-[-10px] right-[-10px] z-10 h-5 w-5 rounded-full bg-[#fafbfd]" />
                                                <div className="absolute right-[-10px] bottom-[-10px] z-10 h-5 w-5 rounded-full bg-[#fafbfd]" />

                                                <span
                                                    className={`font-mono leading-none font-black tracking-tighter ${getValueFontSize(coupon.type === 'percentage' ? `${coupon.value}%` : coupon.formatted_value)}`}
                                                >
                                                    {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.formatted_value}
                                                </span>
                                                <span className="mt-1 text-[9px] font-black tracking-wider text-indigo-200 uppercase">
                                                    {coupon.type === 'percentage' ? 'OFF' : 'LESS'}
                                                </span>

                                                {/* Dashed vertical separator line */}
                                                <div className="absolute top-3 right-0 bottom-3 border-r border-dashed border-white/20" />
                                            </div>

                                            {/* Right side coupon description */}
                                            <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
                                                <div>
                                                    <div className="mb-1 flex items-center gap-1.5">
                                                        <span className="rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-indigo-600 uppercase">
                                                            {getScopeLabel(coupon.scope)}
                                                        </span>
                                                        {coupon.expires_at && (
                                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                Exp. {coupon.expires_at}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="truncate text-[15px] leading-snug font-black tracking-tight text-slate-900">
                                                        {coupon.campaign_name}
                                                    </h3>
                                                    <p className="mt-0.5 line-clamp-1 text-[11px] leading-normal text-slate-500">
                                                        {coupon.description || 'Save on your resident billing subscription fee.'}
                                                    </p>
                                                </div>

                                                <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {coupon.personal_limit !== null
                                                            ? `${coupon.personal_limit - coupon.personal_uses} use${coupon.personal_limit - coupon.personal_uses === 1 ? '' : 's'} left`
                                                            : 'Unlimited uses'}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleCopy(e, coupon)}
                                                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                                                                isCopyActive
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {isCopyActive ? (
                                                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleRedeem(e, coupon)}
                                                            className="h-7 rounded-full bg-slate-900 px-3 text-[10px] font-black tracking-wider text-white uppercase shadow-sm transition hover:bg-slate-800 active:scale-95"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white p-12 text-center"
                        >
                            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                                <Ticket className="h-5 w-5" />
                            </span>
                            <h2 className="text-base font-black tracking-tight text-slate-900">No active offers today</h2>
                            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
                                We’ll automatically notify you whenever exclusive estate promotions become available.
                            </p>
                        </motion.div>
                    )}

                    {/* Previously Used Coupons Section */}
                    {usedCoupons.length > 0 && (
                        <div className="mt-12">
                            <h3 className="mb-4 px-1 text-xs font-black tracking-wider text-slate-400 uppercase">Previously Used</h3>
                            <div className="space-y-4">
                                {usedCoupons.map((coupon) => (
                                    <div
                                        key={coupon.id}
                                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 opacity-50 grayscale"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-black text-slate-500">
                                                {coupon.type === 'percentage' ? `${coupon.value}%` : '₦'}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm leading-none font-bold text-slate-700">{coupon.campaign_name}</p>
                                                <p className="mt-1 font-mono text-[10px] tracking-wider text-slate-400 uppercase">{coupon.code}</p>
                                            </div>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-500">Redeemed</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Frequently Asked Questions */}
                    <div className="mt-12 border-t border-slate-100 pt-8">
                        <h3 className="mb-4 flex items-center gap-1.5 px-1 text-xs font-black tracking-wider text-slate-400 uppercase">
                            <HelpCircle className="h-4 w-4 text-slate-400" />
                            Frequently Asked Questions
                        </h3>
                        <div className="divide-y divide-slate-100 border-b border-slate-100">
                            {faqs.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={idx} className="py-3">
                                        <button
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-700 transition-colors hover:text-slate-900"
                                        >
                                            <span>{faq.q}</span>
                                            {isOpen ? (
                                                <ChevronUp className="h-4 w-4 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                            )}
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-2 overflow-hidden pr-4 text-[11px] leading-relaxed font-medium text-slate-500"
                                                >
                                                    {faq.a}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* iOS style Bottom Sheet for coupon details */}
            <AnimatePresence>
                {selectedCoupon && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCoupon(null)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        />

                        {/* Sheet Container */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-[32px] border-x border-t border-slate-100 bg-white px-6 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+32px)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)]"
                        >
                            {/* Drag handle for mobile */}
                            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-200" />

                            {/* Header */}
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <span className="inline-flex items-center rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-black tracking-wider text-indigo-600 uppercase">
                                        {getScopeLabel(selectedCoupon.scope)}
                                    </span>
                                    <h3 className="mt-1.5 text-lg leading-snug font-black tracking-tight text-slate-900">
                                        {selectedCoupon.campaign_name}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedCoupon(null)}
                                    className="rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Value Highlight */}
                            <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div>
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Discount Amount</span>
                                    <p className="text-3xl font-black tracking-tight text-slate-900">
                                        {selectedCoupon.type === 'percentage' ? `${selectedCoupon.value}% OFF` : selectedCoupon.formatted_value}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Personal Uses</span>
                                    <p className="mt-1 text-sm font-bold text-slate-700">
                                        {selectedCoupon.personal_uses} /{' '}
                                        {selectedCoupon.personal_limit !== null ? selectedCoupon.personal_limit : 'unlimited'}
                                    </p>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="space-y-4 text-xs">
                                <div>
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Coupon code</span>
                                    <div className="border-slate-150 text-indigo-650 mt-1 flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-2.5 font-mono text-sm tracking-wider">
                                        <span>{selectedCoupon.code}</span>
                                        <button
                                            onClick={(e) => handleCopy(e, selectedCoupon)}
                                            className="text-slate-400 transition-colors hover:text-indigo-600"
                                        >
                                            {copiedId === selectedCoupon.id ? (
                                                <Check className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {selectedCoupon.formatted_min_purchase && (
                                    <div>
                                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Minimum Purchase</span>
                                        <p className="mt-0.5 text-xs font-bold text-slate-800">{selectedCoupon.formatted_min_purchase}</p>
                                    </div>
                                )}

                                {selectedCoupon.expires_at && (
                                    <div>
                                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Expiration Date</span>
                                        <p className="mt-0.5 text-xs font-bold text-slate-800">{selectedCoupon.expires_at}</p>
                                    </div>
                                )}

                                <div>
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Terms & Conditions</span>
                                    <p className="mt-1 text-xs leading-relaxed font-medium text-slate-500">
                                        {selectedCoupon.description ||
                                            'This discount is automatically applied during resident subscription invoice payment checkout. This coupon is not transferable.'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={(e) => handleCopy(e, selectedCoupon)}
                                    className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-98"
                                >
                                    {copiedId === selectedCoupon.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    {copiedId === selectedCoupon.id ? 'Copied' : 'Copy Code'}
                                </button>
                                <button
                                    onClick={(e) => {
                                        handleRedeem(e, selectedCoupon);
                                        setSelectedCoupon(null);
                                    }}
                                    className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-900 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 active:scale-98"
                                >
                                    Apply Offer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

CouponIndexPage.layout = (page: React.ReactNode) => (
    <ResidentLayout className="bg-[#fafbfd]">
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
