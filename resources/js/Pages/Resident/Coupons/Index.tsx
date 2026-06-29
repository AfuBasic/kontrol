import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    Sparkles, 
    Ticket, 
    Copy, 
    Check, 
    Calendar, 
    Lock, 
    Tag, 
    ArrowRight, 
    AlertCircle,
    BadgePercent,
    Gift,
    Coins
} from 'lucide-react';

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

    const handleCopy = (e: React.MouseEvent, coupon: Coupon) => {
        e.stopPropagation(); // Prevent card expansion when clicking copy button
        navigator.clipboard.writeText(coupon.code);
        setCopiedId(coupon.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getScopeLabel = (scope: Coupon['scope']) => {
        switch (scope) {
            case 'estate':
                return 'Estate Exclusive';
            case 'resident':
                return 'Exclusive Reward';
            default:
                return 'Special Promo';
        }
    };

    const getScopeBadgeStyle = (scope: Coupon['scope']) => {
        switch (scope) {
            case 'estate':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'resident':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default:
                return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        }
    };

    // Calculate Hero stats
    const activeOffersCount = coupons.length;
    const maxDiscount = coupons.reduce((max, c) => {
        if (c.type === 'percentage') {
            return c.value > max ? c.value : max;
        }
        return max;
    }, 0);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount / 100);

    return (
        <div className="min-h-screen bg-[#090b11] text-[#f8fafc] font-sans antialiased relative overflow-x-hidden pb-12 selection:bg-indigo-500/30 selection:text-white">
            <Head title="Offers & Coupons" />

            {/* Glowing spot background lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Mobile Nav */}
            <header className="sticky top-0 z-[60] bg-[#090b11]/85 backdrop-blur-xl border-b border-[#1b2030] px-6 py-4">
                <div className="mx-auto max-w-2xl flex items-center justify-between">
                    <button
                        onClick={() => window.history.back()}
                        className="group inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors duration-200"
                    >
                        <ChevronLeft className="h-5 w-5 text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-200" strokeWidth={2.5} />
                        Back
                    </button>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-100">Offers & Coupons</h1>
                    <div className="w-12" /> {/* Spacer */}
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-6 py-8">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-[#13192b] via-[#101423] to-[#1e1c3e] border border-[#212842] p-8 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] mb-8"
                >
                    {/* Glowing Accent Spot */}
                    <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-[#6366f1]/20 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
                                <Sparkles className="h-3 w-3" />
                                Community Perks
                            </span>
                            <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent">
                                {activeOffersCount > 0 ? 'Your Available Savings' : 'Premium Benefits'}
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                                Exclusive rates and promotional vouchers created for you and residents of your estate.
                            </p>
                        </div>
                        {activeOffersCount > 0 && (
                            <div className="flex gap-4 shrink-0">
                                <div className="bg-[#1b2035]/80 backdrop-blur-md rounded-2xl border border-[#272e4c] p-4 text-center min-w-[90px]">
                                    <div className="text-[26px] font-black text-indigo-400 leading-none">
                                        {activeOffersCount}
                                    </div>
                                    <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                        Offers Active
                                    </div>
                                </div>
                                {maxDiscount > 0 && (
                                    <div className="bg-[#1b2035]/80 backdrop-blur-md rounded-2xl border border-[#272e4c] p-4 text-center min-w-[90px]">
                                        <div className="text-[26px] font-black text-emerald-400 leading-none">
                                            {maxDiscount}%
                                        </div>
                                        <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                            Max Saved
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {coupons.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Available Passes</h3>
                            <span className="text-[11px] text-slate-500 font-medium">Tap pass to view terms</span>
                        </div>

                        {coupons.map((coupon, index) => {
                            const isCopyActive = copiedId === coupon.id;
                            const isExpanded = expandedId === coupon.id;
                            const isUsedUp = coupon.personal_limit !== null && coupon.personal_uses >= coupon.personal_limit;

                            return (
                                <motion.div
                                    key={coupon.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                    layout="position"
                                >
                                    <motion.div
                                        whileHover={{ y: isUsedUp ? 0 : -4, scale: isUsedUp ? 1 : 1.01 }}
                                        whileTap={{ scale: isUsedUp ? 1 : 0.99 }}
                                        onClick={() => !isUsedUp && setExpandedId(isExpanded ? null : coupon.id)}
                                        className={`relative flex flex-col sm:flex-row overflow-hidden rounded-[24px] border ${isExpanded ? 'border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.15)]' : 'border-[#1b2030]'} bg-[#0e121d] transition-all duration-300 cursor-pointer ${isUsedUp ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        {/* Left Side: Ticket Tear-off Value Ribbon */}
                                        <div className="flex flex-col items-center justify-center p-6 text-white sm:w-36 shrink-0 text-center relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800">
                                            {/* Notches for event ticket look */}
                                            <div className="absolute top-[-10px] right-[-10px] w-5 h-5 rounded-full bg-[#090b11] border border-transparent z-10" />
                                            <div className="absolute bottom-[-10px] right-[-10px] w-5 h-5 rounded-full bg-[#090b11] border border-transparent z-10" />

                                            <span className="text-[32px] font-black tracking-tighter leading-none font-mono">
                                                {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.formatted_value}
                                            </span>
                                            <span className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-200">
                                                {coupon.type === 'percentage' ? 'OFF' : 'REDUCED'}
                                            </span>
                                            
                                            {/* Dash divider on right of value block */}
                                            <div className="absolute right-0 top-3 bottom-3 border-r border-dashed border-white/20 hidden sm:block" />
                                        </div>

                                        {/* Right Side: Ticket Body */}
                                        <div className="flex-1 p-6 flex flex-col justify-between relative">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black border uppercase tracking-wider ${getScopeBadgeStyle(coupon.scope)}`}>
                                                        {getScopeLabel(coupon.scope)}
                                                    </span>
                                                    {coupon.expires_at && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                                            <Calendar className="h-3 w-3" />
                                                            Expires {coupon.expires_at}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-black text-slate-100 tracking-tight leading-snug">
                                                    {coupon.campaign_name}
                                                </h3>
                                            </div>

                                            {/* Mini Usage Indicator Bar */}
                                            <div className="mt-4 pt-3 border-t border-[#1b2030] flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                                                    <Ticket className="h-3.5 w-3.5 text-slate-500" />
                                                    <span>
                                                        Uses: {coupon.personal_uses} / {coupon.personal_limit !== null ? `${coupon.personal_limit} max` : 'unlimited'}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={(e) => handleCopy(e, coupon)}
                                                    disabled={isUsedUp}
                                                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black transition-all ${
                                                        isCopyActive 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                            : 'bg-[#1b2030] text-slate-300 border border-transparent hover:bg-slate-100 hover:text-slate-950'
                                                    }`}
                                                >
                                                    {isCopyActive ? (
                                                        <>
                                                            <Check className="h-3 w-3" strokeWidth={3} />
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3 w-3" />
                                                            Copy Code
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Inline Details Expansion */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden bg-[#0d101a] border border-[#1b2030] border-t-0 rounded-b-[24px] -mt-3 mx-2 px-6 pb-6 pt-5"
                                            >
                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Offer Code</span>
                                                        <div className="mt-1 flex items-center justify-between bg-[#151928] rounded-xl border border-[#21273e] px-4 py-2 font-mono text-sm text-indigo-400 tracking-wider">
                                                            <span>{coupon.code}</span>
                                                            <button 
                                                                onClick={(e) => handleCopy(e, coupon)}
                                                                className="text-slate-400 hover:text-white transition-colors"
                                                            >
                                                                {isCopyActive ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Discount type</span>
                                                            <p className="mt-0.5 text-xs font-bold text-slate-200 uppercase">{coupon.type}</p>
                                                        </div>
                                                        {coupon.formatted_min_purchase && (
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Min Purchase</span>
                                                                <p className="mt-0.5 text-xs font-bold text-slate-200">{coupon.formatted_min_purchase}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Detailed Description</span>
                                                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                                            {coupon.description || 'Use this code during your subscription renewal or check out to save on subscription fees. It will automatically apply at the check-out screen or you can paste the code manually.'}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-[#131828] border border-[#212842] p-3 flex gap-2">
                                                        <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                                                        <span className="text-[10px] font-semibold text-slate-400 leading-normal">
                                                            Applicable to all primary plan options. Pre-applied automatically at checkout. Copy code and keep handy if manual entry is desired.
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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-[#1b2030] bg-[#0c0f17] p-12 text-center"
                    >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 mb-5 shadow-inner">
                            <Ticket className="h-6 w-6" strokeWidth={1.8} />
                        </span>
                        <h2 className="text-lg font-black text-slate-100 tracking-tight">No Active Perks Today</h2>
                        <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
                            You're currently receiving the best available pricing. We'll notify you via push and email the moment a new reward becomes available.
                        </p>
                        <Link
                            href="/resident/home"
                            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#1b2030] px-5 py-2.5 text-xs font-black text-slate-200 border border-transparent hover:bg-slate-100 hover:text-slate-950 transition active:scale-95 cursor-pointer"
                        >
                            Return to Dashboard
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
