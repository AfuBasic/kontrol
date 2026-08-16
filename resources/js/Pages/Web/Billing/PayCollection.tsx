import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Building2, User, Sparkles, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as CollectionPaymentController from '@/actions/App/Http/Controllers/Web/CollectionPaymentController';

/** Partial payments are only offered when remaining balance is at least this share of the original bill. */
const MIN_REMAINING_RATIO_FOR_PARTIAL = 0.2;

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
    allowPartialPayments?: boolean;
    minPartialAmount?: number;
    minPartialPercentage?: number;
};

declare global {
    interface Window {
        PaystackPop: any;
    }
}

export default function PayCollection({
    assignment,
    paystackKey,
    feeBreakdown,
    hasSubscription,
    allowPartialPayments = true,
    minPartialAmount = 0,
    minPartialPercentage = 10,
}: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
    const [customAmount, setCustomAmount] = useState<string>('');

    // assignment.amount_due / amount_paid are stored and displayed in NGN
    const originalBill = Math.max(0, Number(assignment.amount_due) || 0);
    const amountToPay = Math.max(0, originalBill - (Number(assignment.amount_paid) || 0));
    const minPctAmount = (originalBill * minPartialPercentage) / 100;
    const minThreshold = Math.max(minPartialAmount, minPctAmount);
    const allowsPartialPayment = allowPartialPayments && originalBill > 0 && amountToPay >= minThreshold;
    const activePaymentMode = allowsPartialPayment ? paymentMode : 'full';
    const parsedCustom = parseFloat(customAmount) || 0;
    const effectivePaymentAmount = activePaymentMode === 'partial' && parsedCustom > 0 ? Math.min(parsedCustom, amountToPay) : amountToPay;
    const remainingAfterPayment = Math.max(0, amountToPay - effectivePaymentAmount);

    const kontrolFee = hasSubscription ? 0 : effectivePaymentAmount * 0.005;
    const totalChargeToday = effectivePaymentAmount + kontrolFee;

    const minRequiredPartialAmount = Math.max(minPartialAmount, Math.ceil((amountToPay * minPartialPercentage) / 100));

    useEffect(() => {
        if (!allowsPartialPayment && paymentMode === 'partial') {
            setPaymentMode('full');
            setCustomAmount('');
        }
    }, [allowsPartialPayment, paymentMode]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const response = await fetch(CollectionPaymentController.initiate.url(assignment.ulid), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    // Send amount in NGN (same unit as amount_due)
                    amount: Math.round(effectivePaymentAmount),
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (data.already_paid) {
                // Already settled - send them to a receipt-like reload of this bill
                window.location.reload();
                return;
            }

            if (!response.ok) {
                setErrorMessage(data.message || 'Could not start payment. Please try again.');
                setIsProcessing(false);
                return;
            }

            const amountKobo = Number(data.amount_kobo);
            if (!Number.isFinite(amountKobo) || amountKobo < 100) {
                setErrorMessage('Payment amount is invalid. Please refresh and try again.');
                setIsProcessing(false);
                return;
            }

            if (!paystackKey) {
                setErrorMessage('Payment gateway is not configured. Please contact support.');
                setIsProcessing(false);
                return;
            }

            if (!window.PaystackPop) {
                setErrorMessage('Payment gateway is not ready. Please refresh the page.');
                setIsProcessing(false);
                return;
            }

            const subaccount =
                data.subaccount && !String(data.subaccount).startsWith('ACCT_estate') && !String(data.subaccount).startsWith('ACCT_landlord')
                    ? data.subaccount
                    : null;

            const validEmail = data.email && String(data.email).includes('@') ? data.email : assignment.user?.email || 'support@usekontrol.com';

            const statusUrlFor = (ref: string) => `/billing/collection/status/${encodeURIComponent(ref)}`;

            const setupOptions: Record<string, unknown> = {
                key: paystackKey,
                email: validEmail,
                amount: amountKobo,
                reference: data.reference,
                channels: ['bank_transfer'],
                callback_url: statusUrlFor(data.reference),
                onClose: () => {
                    setIsProcessing(false);
                },
                callback: (paystackResponse: { reference: string }) => {
                    // Redirect to receipt/status page - it syncs with Paystack and shows full/partial outcome
                    window.location.href = statusUrlFor(paystackResponse.reference);
                },
            };

            // Only pass split params when a real Paystack subaccount is configured
            if (subaccount) {
                setupOptions.subaccount = subaccount;
                setupOptions.bearer = data.bearer || 'account';
                if (data.transaction_charge) {
                    setupOptions.transaction_charge = data.transaction_charge;
                }
            }

            const handler = window.PaystackPop.setup(setupOptions);
            handler.openIframe();
        } catch (error) {
            console.error('Payment initiation failed', error);
            setErrorMessage('Payment initiation failed. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col justify-between bg-[#0F172A] text-slate-100 selection:bg-blue-500 selection:text-white">
            <Head title={`Pay for ${assignment.collection.name}`} />

            {/* Top Navigation / Brand Header */}
            <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
                        <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-black tracking-tight text-white uppercase">{assignment.estate.name}</span>
                </div>
                {hasSubscription && (
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Premium Member</span>
                    </div>
                )}
            </header>

            {/* Main Checkout Container */}
            <main className="mx-auto w-full max-w-2xl space-y-12 px-4 py-6 sm:px-6">
                {/* 1. BILL INFORMATION (Spacious & Clean Header Anchor) */}
                <section className="space-y-6 text-center sm:text-left">
                    <div className="space-y-2">
                        <span className="text-xs font-black tracking-widest text-blue-400 uppercase">Collection Notice</span>
                        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{assignment.collection.name}</h1>
                        <p className="max-w-xl text-base leading-relaxed font-medium text-slate-400">
                            {assignment.collection.description || 'Estate levy & obligation settlement.'}
                        </p>
                    </div>

                    {/* Primary Visual Financial Anchor */}
                    <div className="flex flex-col justify-between gap-2 border-b border-slate-800 pt-4 pb-6 sm:flex-row sm:items-baseline">
                        <div>
                            <span className="block text-xs font-bold tracking-widest text-slate-400 uppercase">Outstanding Balance</span>
                            <span className="mt-1 block text-5xl font-black tracking-tight text-white sm:text-6xl">
                                {formatCurrency(amountToPay)}
                            </span>
                        </div>
                        <div className="space-y-1 text-left sm:text-right">
                            <span className="block text-xs font-semibold text-slate-400">Assigned Resident</span>
                            <span className="block text-sm font-bold text-slate-200">{assignment.user.name}</span>
                        </div>
                    </div>
                </section>

                {/* 2. PAYMENT METHOD (Primary Decision: Large Cards) */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Payment Method</h2>
                        <span className="text-xs font-medium text-slate-500">
                            {allowsPartialPayment ? 'Select how you want to pay' : 'Full payment required'}
                        </span>
                    </div>

                    <div className={`grid grid-cols-1 gap-4 ${allowsPartialPayment ? 'sm:grid-cols-2' : ''}`}>
                        {/* Option 1: Full Amount */}
                        <div
                            onClick={() => {
                                setPaymentMode('full');
                                setCustomAmount('');
                            }}
                            className={`relative flex cursor-pointer flex-col justify-between rounded-3xl border-2 p-6 transition-all duration-200 ${
                                activePaymentMode === 'full'
                                    ? 'border-blue-500 bg-slate-800/90 shadow-xl ring-1 shadow-blue-500/10 ring-blue-500/30'
                                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                            }`}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                                        activePaymentMode === 'full' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                                    }`}
                                >
                                    {activePaymentMode === 'full' && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                                    {allowsPartialPayment ? 'Recommended' : 'Required'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Pay Full Amount</h3>
                                <p className="mt-1 text-xs leading-relaxed font-medium text-slate-400">
                                    Settle the entire outstanding balance today and clear this bill completely.
                                </p>
                            </div>
                        </div>

                        {/* Option 2: Pay Part - only when remaining balance ≥ 20% of original bill */}
                        {allowsPartialPayment && (
                            <div
                                onClick={() => {
                                    setPaymentMode('partial');
                                    if (!customAmount || parseFloat(customAmount) < minRequiredPartialAmount) {
                                        setCustomAmount(minRequiredPartialAmount.toString());
                                    }
                                }}
                                className={`relative flex cursor-pointer flex-col justify-between rounded-3xl border-2 p-6 transition-all duration-200 ${
                                    activePaymentMode === 'partial'
                                        ? 'border-blue-500 bg-slate-800/90 shadow-xl ring-1 shadow-blue-500/10 ring-blue-500/30'
                                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                                }`}
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                                            activePaymentMode === 'partial' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                                        }`}
                                    >
                                        {activePaymentMode === 'partial' && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300">
                                        Flexible
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Pay Part of Bill</h3>
                                    <p className="mt-1 text-xs leading-relaxed font-medium text-slate-400">
                                        Pay any amount today. Remaining balance stays open for future settlement.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. PARTIAL PAYMENT EXPERIENCE (Smooth Expansion) */}
                <AnimatePresence>
                    {activePaymentMode === 'partial' && allowsPartialPayment && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="space-y-4 overflow-hidden pt-2"
                        >
                            <div className="space-y-6 rounded-3xl border border-blue-500/30 bg-slate-900/80 p-6 sm:p-8">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black tracking-widest text-blue-400 uppercase">Amount Paying Today</label>
                                    <span className="text-xs font-bold text-slate-400">Max: {formatCurrency(amountToPay)}</span>
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
                                        className={`w-full rounded-2xl border-2 border-slate-700 bg-slate-950 py-5 pr-24 pl-14 font-black text-white shadow-inner transition focus:border-blue-500 focus:outline-none ${
                                            (customAmount?.length || 0) > 9 ? 'text-xl' : (customAmount?.length || 0) > 6 ? 'text-2xl' : 'text-3xl'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCustomAmount(amountToPay.toString())}
                                        className="absolute top-1/2 right-4 -translate-y-1/2 rounded-xl border border-blue-500/30 bg-blue-600/20 px-3 py-2 text-xs font-black text-blue-400 transition hover:bg-blue-600/30"
                                    >
                                        SET MAX
                                    </button>
                                </div>

                                {/* Dynamic Realtime Breakdown */}
                                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
                                    <div>
                                        <span className="block font-medium text-slate-500">Paying Today</span>
                                        <span className="mt-0.5 block text-base font-bold text-white">{formatCurrency(effectivePaymentAmount)}</span>
                                    </div>
                                    <div className="border-l border-slate-800 pl-4">
                                        <span className="block font-medium text-slate-500">Remaining Balance</span>
                                        <span className="mt-0.5 block text-base font-bold text-amber-400">
                                            {formatCurrency(remainingAfterPayment)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* 4. LIVE PAYMENT SUMMARY (Clean Hierarchy, No Box Crowding) */}
                <section className="space-y-4 border-t border-slate-800 pt-4">
                    <h2 className="px-1 text-xs font-black tracking-widest text-slate-400 uppercase">Payment Summary</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between font-medium text-slate-400">
                            <span>Outstanding Balance</span>
                            <span className="font-bold text-slate-200">{formatCurrency(amountToPay)}</span>
                        </div>

                        {activePaymentMode === 'partial' && allowsPartialPayment && (
                            <>
                                <div className="flex items-center justify-between font-medium text-slate-400">
                                    <span>Paying Today</span>
                                    <span className="font-bold text-blue-400">{formatCurrency(effectivePaymentAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between font-medium text-slate-400">
                                    <span>Remaining After Payment</span>
                                    <span className="font-bold text-amber-400">{formatCurrency(remainingAfterPayment)}</span>
                                </div>
                            </>
                        )}

                        <div className="flex items-center justify-between font-medium text-slate-400">
                            <span>Processing Fee (0.5%)</span>
                            {hasSubscription ? (
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-500 line-through">{formatCurrency(effectivePaymentAmount * 0.005)}</span>
                                    <span className="text-xs font-bold text-emerald-400">✓ Waived for Premium</span>
                                </div>
                            ) : (
                                <span className="font-bold text-slate-200">{formatCurrency(kontrolFee)}</span>
                            )}
                        </div>

                        {/* Total Highlight */}
                        <div className="flex items-baseline justify-between border-t border-slate-800 pt-4">
                            <span className="text-base font-black text-white">Total Charge Today</span>
                            <span className="text-4xl font-black tracking-tight text-white">{formatCurrency(totalChargeToday)}</span>
                        </div>
                    </div>
                </section>

                {/* 5. BENEFITS (Lightweight Success Banner / Fee Note) */}
                {hasSubscription ? (
                    <div className="flex items-center gap-2.5 px-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>✓ Premium Member - 0.5% processing fee has been waived on this payment.</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 px-1 text-xs font-medium text-slate-400">
                        <AlertCircle className="h-4 w-4 shrink-0 text-slate-500" />
                        <span>A 0.5% processing fee applies. Free for active Kontrol premium subscribers.</span>
                    </div>
                )}

                {/* 6. PAY BUTTON */}
                <section className="space-y-4 pt-4">
                    {errorMessage && (
                        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

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

                    <div className="flex items-center justify-center gap-2 pt-2 text-xs font-medium text-slate-500">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Encrypted SSL Gateway via Paystack</span>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-800/50 px-6 py-6 text-center text-xs font-medium text-slate-600">
                Kontrol Compliance & Automated Billing System
            </footer>
        </div>
    );
}
