import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Building2, User, Sparkles, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import CollectionPaymentController from '@/actions/App/Http/Controllers/Web/CollectionPaymentController';

type Collection = {
    name: string;
    description: string | null;
};

type Estate = {
    name: string;
    logo_url: string | null;
};

type AssignmentUser = {
    name: string;
    email: string;
};

type Assignment = {
    ulid: string;
    id: number;
    amount_due: number;
    amount_paid: number;
    collection: Collection;
    estate: Estate;
    user: AssignmentUser;
};

type Props = {
    assignment: Assignment;
    paystackKey: string;
    feeBreakdown: {
        kontrol_fee: number;
        paystack_fee: number;
        total_amount: number;
        transaction_charge: number;
    };
    hasSubscription: boolean;
};

declare global {
    interface Window {
        PaystackPop: any;
    }
}

export default function PayCollection({ assignment, paystackKey, feeBreakdown, hasSubscription }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
    const [customAmount, setCustomAmount] = useState<string>('');

    const amountToPay = Math.max(0, assignment.amount_due - assignment.amount_paid);
    const parsedCustom = parseFloat(customAmount) || 0;
    const effectivePaymentAmount = paymentMode === 'partial' && parsedCustom > 0 ? Math.min(parsedCustom, amountToPay) : amountToPay;
    const remainingAfterPayment = Math.max(0, amountToPay - effectivePaymentAmount);

    const kontrolFee = hasSubscription ? 0 : effectivePaymentAmount * 0.005;
    const totalChargeToday = effectivePaymentAmount + kontrolFee;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            const response = await fetch(CollectionPaymentController.initiate.url(assignment.ulid), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
                },
                body: JSON.stringify({
                    amount: Math.round(effectivePaymentAmount * 100), // send in kobo
                }),
            });

            const data = await response.json();

            if (data.already_paid) {
                setPaymentStatus('success');
                setIsProcessing(false);
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                return;
            }

            const { reference, email, amount, subaccount } = data;

            if (!window.PaystackPop) {
                alert('Payment gateway is not ready. Please refresh the page.');
                setIsProcessing(false);
                return;
            }

            const cleanSubaccount =
                subaccount && !subaccount.startsWith('ACCT_estate') && !subaccount.startsWith('ACCT_landlord') ? subaccount : undefined;

            const validEmail = (email && email.includes('@')) ? email : (assignment.user?.email || 'resident@kontrol.ng');

            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: validEmail,
                amount: Math.round(amount * 100), // data.amount is returned in NGN from backend, convert to kobo for Paystack
                ref: reference,
                subaccount: cleanSubaccount,
                channels: ['bank_transfer'],
                onClose: () => {
                    setIsProcessing(false);
                },
                callback: (response: any) => {
                    fetch(CollectionPaymentController.verify.url(response.reference), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
                        },
                    }).then(() => {
                        setPaymentStatus('success');
                        setIsProcessing(false);
                        setTimeout(() => {
                            window.location.reload();
                        }, 3000);
                    });
                },
            });

            handler.openIframe();
        } catch (error) {
            console.error('Payment initiation failed', error);
            setPaymentStatus('error');
            setIsProcessing(false);
        }
    };

    if (paymentStatus === 'success') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-16 text-slate-900">
                <Head title="Payment Successful" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg rounded-[2.5rem] bg-white p-12 text-center shadow-2xl"
                >
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-500">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Payment Successful</h1>
                    <p className="mt-4 text-base font-medium text-slate-500">
                        Your payment for <span className="font-bold text-slate-900">{assignment.collection.name}</span> has been processed.
                    </p>
                    <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-left border border-slate-100">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Payer</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{assignment.user.name}</p>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-4">Estate</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{assignment.estate.name}</p>
                    </div>
                    <p className="mt-8 text-xs font-bold tracking-widest text-slate-400 uppercase">You may close this window</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
            <Head title={`Pay for ${assignment.collection.name}`} />

            {/* Top Navigation / Brand Header */}
            <header className="px-6 py-8 max-w-4xl mx-auto w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
                        <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-black tracking-tight text-white uppercase">{assignment.estate.name}</span>
                </div>
                {hasSubscription && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Premium Member</span>
                    </div>
                )}
            </header>

            {/* Main Checkout Container */}
            <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12">
                
                {/* 1. BILL INFORMATION (Spacious & Clean Header Anchor) */}
                <section className="space-y-6 text-center sm:text-left">
                    <div className="space-y-2">
                        <span className="text-xs font-black tracking-widest text-blue-400 uppercase">Collection Notice</span>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">{assignment.collection.name}</h1>
                        <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xl">
                            {assignment.collection.description || 'Estate levy & obligation settlement.'}
                        </p>
                    </div>

                    {/* Primary Visual Financial Anchor */}
                    <div className="pt-4 pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Outstanding Balance</span>
                            <span className="text-5xl sm:text-6xl font-black tracking-tight text-white mt-1 block">
                                {formatCurrency(amountToPay)}
                            </span>
                        </div>
                        <div className="text-left sm:text-right space-y-1">
                            <span className="text-xs font-semibold text-slate-400 block">Assigned Resident</span>
                            <span className="text-sm font-bold text-slate-200 block">{assignment.user.name}</span>
                        </div>
                    </div>
                </section>

                {/* 2. PAYMENT METHOD (Primary Decision: Large Cards) */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Payment Method</h2>
                        <span className="text-xs text-slate-500 font-medium">Select how you want to pay</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: Full Amount */}
                        <div
                            onClick={() => {
                                setPaymentMode('full');
                                setCustomAmount('');
                            }}
                            className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border-2 relative flex flex-col justify-between ${
                                paymentMode === 'full'
                                    ? 'bg-slate-800/90 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30'
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                                    paymentMode === 'full' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                                }`}>
                                    {paymentMode === 'full' && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    Recommended
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Pay Full Amount</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed">
                                    Settle the entire outstanding balance today and clear this bill completely.
                                </p>
                            </div>
                        </div>

                        {/* Option 2: Pay Part */}
                        <div
                            onClick={() => {
                                setPaymentMode('partial');
                                if (!customAmount) {
                                    setCustomAmount(Math.round(amountToPay / 2).toString());
                                }
                            }}
                            className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border-2 relative flex flex-col justify-between ${
                                paymentMode === 'partial'
                                    ? 'bg-slate-800/90 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30'
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                                    paymentMode === 'partial' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                                }`}>
                                    {paymentMode === 'partial' && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    Flexible
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Pay Part of Bill</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed">
                                    Pay any amount today. Remaining balance stays open for future settlement.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. PARTIAL PAYMENT EXPERIENCE (Smooth Expansion) */}
                <AnimatePresence>
                    {paymentMode === 'partial' && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden space-y-4 pt-2"
                        >
                            <div className="rounded-3xl bg-slate-900/80 p-6 sm:p-8 border border-blue-500/30 space-y-6">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black tracking-widest text-blue-400 uppercase">
                                        Amount Paying Today
                                    </label>
                                    <span className="text-xs font-bold text-slate-400">
                                        Max: {formatCurrency(amountToPay)}
                                    </span>
                                </div>

                                {/* Prominent Monetary Input with Formatted Commas & Dynamic Font Scaling */}
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
                                        <span className="text-3xl font-black text-blue-400">₦</span>
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={customAmount ? Number(customAmount.replace(/,/g, '')).toLocaleString('en-US') : ''}
                                        onChange={(e) => {
                                            const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                            if (rawVal === '') {
                                                setCustomAmount('');
                                                return;
                                            }
                                            const num = parseFloat(rawVal);
                                            if (num > amountToPay) {
                                                setCustomAmount(amountToPay.toString());
                                            } else {
                                                setCustomAmount(num.toString());
                                            }
                                        }}
                                        className={`w-full rounded-2xl border-2 border-slate-700 bg-slate-950 py-5 pl-14 pr-24 font-black text-white shadow-inner focus:border-blue-500 focus:outline-none transition ${
                                            (customAmount?.length || 0) > 9
                                                ? 'text-xl'
                                                : (customAmount?.length || 0) > 6
                                                ? 'text-2xl'
                                                : 'text-3xl'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCustomAmount(amountToPay.toString())}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 px-3 py-2 text-xs font-black text-blue-400 border border-blue-500/30 transition"
                                    >
                                        SET MAX
                                    </button>
                                </div>

                                {/* Dynamic Realtime Breakdown */}
                                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                                    <div>
                                        <span className="text-slate-500 block font-medium">Paying Today</span>
                                        <span className="text-base font-bold text-white mt-0.5 block">{formatCurrency(effectivePaymentAmount)}</span>
                                    </div>
                                    <div className="border-l border-slate-800 pl-4">
                                        <span className="text-slate-500 block font-medium">Remaining Balance</span>
                                        <span className="text-base font-bold text-amber-400 mt-0.5 block">{formatCurrency(remainingAfterPayment)}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* 4. LIVE PAYMENT SUMMARY (Clean Hierarchy, No Box Crowding) */}
                <section className="space-y-4 pt-4 border-t border-slate-800">
                    <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase px-1">Payment Summary</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center text-slate-400 font-medium">
                            <span>Outstanding Balance</span>
                            <span className="text-slate-200 font-bold">{formatCurrency(amountToPay)}</span>
                        </div>

                        {paymentMode === 'partial' && (
                            <>
                                <div className="flex justify-between items-center text-slate-400 font-medium">
                                    <span>Paying Today</span>
                                    <span className="text-blue-400 font-bold">{formatCurrency(effectivePaymentAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 font-medium">
                                    <span>Remaining After Payment</span>
                                    <span className="text-amber-400 font-bold">{formatCurrency(remainingAfterPayment)}</span>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between items-center text-slate-400 font-medium">
                            <span>Processing Fee (0.5%)</span>
                            {hasSubscription ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 line-through font-bold">{formatCurrency(effectivePaymentAmount * 0.005)}</span>
                                    <span className="text-emerald-400 text-xs font-bold">✓ Waived for Premium</span>
                                </div>
                            ) : (
                                <span className="text-slate-200 font-bold">{formatCurrency(kontrolFee)}</span>
                            )}
                        </div>

                        {/* Total Highlight */}
                        <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                            <span className="text-base font-black text-white">Total Charge Today</span>
                            <span className="text-4xl font-black text-white tracking-tight">{formatCurrency(totalChargeToday)}</span>
                        </div>
                    </div>
                </section>

                {/* 5. BENEFITS (Lightweight Success Banner / Fee Note) */}
                {hasSubscription ? (
                    <div className="flex items-center gap-2.5 text-xs text-emerald-400 font-semibold px-1">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>✓ Premium Member — 0.5% processing fee has been waived on this payment.</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 text-xs text-slate-400 font-medium px-1">
                        <AlertCircle className="h-4 w-4 shrink-0 text-slate-500" />
                        <span>A 0.5% processing fee applies. Free for active Kontrol premium subscribers.</span>
                    </div>
                )}

                {/* 6. PAY BUTTON */}
                <section className="space-y-4 pt-4">
                    {amountToPay > 0 ? (
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing || effectivePaymentAmount <= 0}
                            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl bg-blue-600 py-6 text-lg font-black text-white shadow-2xl shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Pay {formatCurrency(totalChargeToday)} Now</span>
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="flex w-full items-center justify-center gap-3 rounded-3xl bg-emerald-500 py-6 text-lg font-black text-white shadow-2xl shadow-emerald-500/20">
                            <CheckCircle2 className="h-6 w-6" />
                            <span>Bill Fully Settled</span>
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 pt-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Encrypted SSL Gateway via Paystack</span>
                    </div>
                </section>
            </main>

            <footer className="px-6 py-6 text-center text-xs text-slate-600 font-medium border-t border-slate-800/50">
                Kontrol Compliance & Automated Billing System
            </footer>
        </div>
    );
}
