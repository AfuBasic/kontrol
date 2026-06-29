import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    Copy, 
    Check, 
    Calendar, 
    Ticket, 
    ChevronDown, 
    ChevronUp, 
    HelpCircle, 
    Info,
    ArrowRight
} from 'lucide-react';
import ResidentLayout from '@/Layouts/ResidentLayout';
import AnimatedLayout from '@/Layouts/AnimatedLayout';

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
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleCopy = (e: React.MouseEvent, coupon: Coupon) => {
        e.stopPropagation();
        navigator.clipboard.writeText(coupon.code);
        setCopiedId(coupon.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRedeem = (e: React.MouseEvent, coupon: Coupon) => {
        e.stopPropagation();
        router.visit(`/resident/billing?coupon=${coupon.code}`);
    };

    // Separate active versus fully used/expired coupons
    const activeCoupons = coupons.filter(c => {
        const isUsedUp = c.personal_limit !== null && c.personal_uses >= c.personal_limit;
        return !isUsedUp;
    });

    const usedCoupons = coupons.filter(c => {
        const isUsedUp = c.personal_limit !== null && c.personal_uses >= c.personal_limit;
        return isUsedUp;
    });

    const getScopeLabel = (scope: Coupon['scope']) => {
        switch (scope) {
            case 'estate': return 'Estate Special';
            case 'resident': return 'Exclusive Reward';
            default: return 'Global Promo';
        }
    };

    const faqs = [
        {
            q: "How do I redeem my coupon?",
            a: "When you click 'Apply to Renewal' on any coupon, you will be redirected to the billing page with the coupon code automatically pre-applied to your plans. You can also manually copy and paste the code during checkout."
        },
        {
            q: "Who is eligible for these coupons?",
            a: "Eligibility depends on the coupon type. Estate coupons are automatically available to all residents of your estate. Exclusive rewards are targeted to your specific resident profile."
        },
        {
            q: "Can I use multiple coupons at checkout?",
            a: "Only one coupon can be applied per subscription payment. The system will automatically select the best discount for you, but you can choose to apply a different code manually."
        }
    ];

    return (
        <>
            <Head title="Discounts & Offers" />

            <div className="mx-auto min-h-screen max-w-lg bg-[#fafbfd] pb-24 text-slate-900">
                {/* Header Section */}
                <div className="sticky top-0 z-[60] bg-[#fafbfd]/80 px-6 pt-5 pb-5 border-b border-slate-100/60 backdrop-blur-xl mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-[17px] font-black tracking-tight text-slate-900 leading-none">Offers</h1>
                            <p className="text-[11px] font-semibold text-slate-500 mt-1.5">Available discounts for your estate</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-6 mt-8">
                    {/* Active Coupons List */}
                    {activeCoupons.length > 0 ? (
                        <div className="space-y-6">
                            {activeCoupons.map((coupon, idx) => {
                                const isCopyActive = copiedId === coupon.id;
                                const isExpanded = expandedId === coupon.id;

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
                                            onClick={() => setExpandedId(isExpanded ? null : coupon.id)}
                                            className={`relative flex overflow-hidden rounded-[24px] border ${isExpanded ? 'border-indigo-500 shadow-[0_8px_30px_rgba(99,102,241,0.08)]' : 'border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.02)]'} bg-white transition-all duration-300 active:scale-[0.99]`}
                                        >
                                            {/* Left side tear-off (Discount Badge) */}
                                            <div className="flex flex-col items-center justify-center p-5 text-white w-28 shrink-0 text-center relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700">
                                                {/* Left notch ticket cutouts */}
                                                <div className="absolute top-[-10px] right-[-10px] w-5 h-5 rounded-full bg-[#fafbfd] z-10" />
                                                <div className="absolute bottom-[-10px] right-[-10px] w-5 h-5 rounded-full bg-[#fafbfd] z-10" />

                                                <span className="text-3xl font-black tracking-tighter leading-none font-mono">
                                                    {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.formatted_value}
                                                </span>
                                                <span className="mt-1 text-[9px] font-black uppercase tracking-wider text-indigo-200">
                                                    {coupon.type === 'percentage' ? 'OFF' : 'LESS'}
                                                </span>

                                                {/* Dashed vertical separator line */}
                                                <div className="absolute right-0 top-3 bottom-3 border-r border-dashed border-white/20" />
                                            </div>

                                            {/* Right side coupon description */}
                                            <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                                                            {getScopeLabel(coupon.scope)}
                                                        </span>
                                                        {coupon.expires_at && (
                                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                Exp. {coupon.expires_at}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-[15px] font-black text-slate-900 tracking-tight leading-snug truncate">
                                                        {coupon.campaign_name}
                                                    </h3>
                                                    <p className="mt-0.5 text-[11px] text-slate-500 leading-normal line-clamp-1">
                                                        {coupon.description || 'Save on your resident billing subscription fee.'}
                                                    </p>
                                                </div>

                                                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        Uses: {coupon.personal_uses} / {coupon.personal_limit !== null ? coupon.personal_limit : '∞'}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleCopy(e, coupon)}
                                                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                                                                isCopyActive 
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {isCopyActive ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Copy className="h-3.5 w-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleRedeem(e, coupon)}
                                                            className="h-7 rounded-full bg-slate-900 px-3 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expandable details */}
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                    className="overflow-hidden bg-[#fafbfd] border border-slate-100 border-t-0 rounded-b-[24px] -mt-3.5 mx-2.5 px-5 pb-5 pt-6 shadow-[0_4px_16px_rgba(15,23,42,0.02)]"
                                                >
                                                    <div className="space-y-3.5 text-xs">
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Campaign details</span>
                                                            <p className="mt-0.5 font-medium text-slate-650 leading-relaxed">
                                                                {coupon.description || 'This discount is automatically applied to resident subscription invoices. Select a billing plan, apply, and complete payment.'}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Coupon code</span>
                                                                <p className="mt-0.5 font-mono font-bold text-slate-900 uppercase tracking-wide">{coupon.code}</p>
                                                            </div>
                                                            {coupon.formatted_min_purchase && (
                                                                <div>
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Min purchase</span>
                                                                    <p className="mt-0.5 font-bold text-slate-900">{coupon.formatted_min_purchase}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 flex gap-2">
                                                            <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                                                            <span className="text-[10px] font-semibold text-slate-500 leading-normal">
                                                                Valid on all payment terms. Automatically computed at settlement.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 mb-4">
                                <Ticket className="h-5 w-5" />
                            </span>
                            <h2 className="text-base font-black text-slate-900 tracking-tight">No active offers today</h2>
                            <p className="mt-2 text-xs text-slate-500 max-w-xs leading-relaxed">
                                We’ll automatically notify you whenever exclusive estate promotions become available.
                            </p>
                        </motion.div>
                    )}

                    {/* Previously Used Coupons Section */}
                    {usedCoupons.length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 mb-4">Previously Used</h3>
                            <div className="space-y-4">
                                {usedCoupons.map((coupon) => (
                                    <div 
                                        key={coupon.id} 
                                        className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 p-4 opacity-50 grayscale"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-mono font-black text-xs text-slate-500">
                                                {coupon.type === 'percentage' ? `${coupon.value}%` : '₦'}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate leading-none">{coupon.campaign_name}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">{coupon.code}</p>
                                            </div>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-500">
                                            Redeemed
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Frequently Asked Questions */}
                    <div className="mt-12 border-t border-slate-100 pt-8">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 mb-4 flex items-center gap-1.5">
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
                                            className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                                        >
                                            <span>{faq.q}</span>
                                            {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden mt-2 text-[11px] text-slate-500 leading-relaxed font-medium pr-4"
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
        </>
    );
}

CouponIndexPage.layout = (page: React.ReactNode) => (
    <ResidentLayout hideHeader={true} hideNav={true} className="bg-[#fafbfd]">
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
