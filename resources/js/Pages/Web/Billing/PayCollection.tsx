import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Wallet, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Building2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
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
            // 1. Initiate payment on backend to get reference
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

            // 2. Open Paystack Popup
            if (!window.PaystackPop) {
                alert('Payment gateway is not ready. Please refresh the page.');
                setIsProcessing(false);
                return;
            }

            // Filter out dummy test subaccounts so Paystack widget opens successfully in local environment
            const cleanSubaccount =
                subaccount && !subaccount.startsWith('ACCT_estate') && !subaccount.startsWith('ACCT_landlord') ? subaccount : undefined;

            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: email,
                amount: amount * 100, // Paystack requires amount in kobo
                ref: reference,
                subaccount: cleanSubaccount,
                channels: ['bank_transfer'],
                onClose: () => {
                    setIsProcessing(false);
                },
                callback: (response: any) => {
                    // 3. Verify payment on backend for immediate feedback
                    fetch(CollectionPaymentController.verify.url(response.reference), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
                        },
                    }).then(() => {
                        setPaymentStatus('success');
                        setIsProcessing(false);
                        // Redirect back to mobile app or success page after a delay
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
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <Head title="Payment Successful" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md rounded-[3rem] bg-white p-12 text-center shadow-2xl ring-1 shadow-emerald-500/10 ring-slate-100"
                >
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-4xl bg-emerald-50 text-emerald-500">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Payment Successful</h1>
                    <p className="mt-4 font-medium text-slate-500">
                        Your payment for <span className="font-bold text-slate-900">{assignment.collection.name}</span> has been processed
                        successfully.
                    </p>
                    <div className="mt-8 rounded-2xl bg-slate-50 p-6">
                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Transaction Reference</p>
                        <p className="mt-1 font-mono text-sm font-bold tracking-tighter text-slate-900 uppercase">
                            REF-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                    </div>
                    <p className="mt-8 text-xs font-bold tracking-widest text-slate-400 uppercase">You can now close this window</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 py-12 sm:px-6 lg:px-8">
            <Head title={`Pay for ${assignment.collection.name}`} />

            <div className="w-full max-w-4xl overflow-hidden rounded-[3rem] bg-white shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100 lg:flex">
                {/* Left Side: Summary */}
                <div className="relative bg-slate-900 p-8 text-white lg:w-1/2 lg:p-16">
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <div className="mb-12 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 shadow-xl shadow-blue-500/20">
                                <Wallet className="h-8 w-8" />
                            </div>
                            <h2 className="text-4xl leading-tight font-black tracking-tight">Secure Checkout</h2>
                            <p className="mt-4 max-w-xs text-lg font-medium text-slate-400">
                                Review your payment details and proceed to settle your obligation.
                            </p>
                        </div>

                        <div className="mt-12 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                                    <Building2 className="h-6 w-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Estate</p>
                                    <p className="font-black text-slate-200 uppercase">{assignment.estate.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                                    <User className="h-6 w-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Payer</p>
                                    <p className="font-black text-slate-200">{assignment.user.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
                </div>

                {/* Right Side: Action */}
                <div className="p-8 lg:w-1/2 lg:p-16">
                    <div className="mb-12">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Payment For</span>
                        <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{assignment.collection.name}</h3>
                        <p className="mt-2 font-medium text-slate-500">{assignment.collection.description || 'Estate levy settlement.'}</p>
                    </div>

                    <div className="space-y-6">
                        {/* Payment Type Selector: Full or Partial */}
                        <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Payment Mode</span>
                                <div className="flex bg-slate-200 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMode('full');
                                            setCustomAmount('');
                                        }}
                                        className={`px-3 py-1 text-xs font-black rounded-xl transition ${paymentMode === 'full' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
                                    >
                                        Full Payment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMode('partial')}
                                        className={`px-3 py-1 text-xs font-black rounded-xl transition ${paymentMode === 'partial' ? 'bg-white font-bold text-blue-600 shadow' : 'text-slate-600'}`}
                                    >
                                        Pay in Parts
                                    </button>
                                </div>
                            </div>

                            {paymentMode === 'partial' && (
                                <div className="space-y-2 pt-2 border-t border-slate-200">
                                    <label className="block text-xs font-bold text-slate-600">Enter Partial Amount (NGN)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₦</span>
                                        <input
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            placeholder={`Min: ₦1, Max: ${formatCurrency(amountToPay)}`}
                                            className="w-full rounded-2xl border-slate-200 pl-9 pr-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500">You can pay little by little. Any remaining balance will stay open.</p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-100">
                            <div className="mb-6 space-y-4 border-b border-slate-200 pb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">Total Outstanding</span>
                                    <span className="font-black text-slate-900">{formatCurrency(amountToPay)}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">Selected Amount</span>
                                    <span className="font-black text-blue-600">{formatCurrency(effectivePaymentAmount)}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">Processing Fee (0.5%)</span>
                                    {hasSubscription ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-emerald-600 line-through decoration-emerald-500/30">
                                                {formatCurrency(effectivePaymentAmount * 0.005)}
                                            </span>
                                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                WAIVED
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="font-black text-slate-900">{formatCurrency(effectivePaymentAmount * 0.005)}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Total to pay now</span>
                                <span className="text-4xl font-black tracking-tight text-slate-900">{formatCurrency(effectivePaymentAmount + (hasSubscription ? 0 : effectivePaymentAmount * 0.005))}</span>
                            </div>
                        </div>

                        {!hasSubscription && amountToPay > 0 && (
                            <div className="flex items-center gap-3 rounded-2xl bg-amber-50/80 p-4 text-amber-700 ring-1 ring-amber-200/50">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <p className="text-xs leading-relaxed font-bold">
                                    <span className="block text-amber-800">Processing Fee Applied</span>
                                    This 0.5% processing fee could be avoided if you had an active Kontrol subscription.
                                </p>
                            </div>
                        )}

                        {hasSubscription && amountToPay > 0 && (
                            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/80 p-4 text-emerald-700 ring-1 ring-emerald-200/50">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <p className="text-xs leading-relaxed font-bold">
                                    <span className="block text-emerald-800">Premium Benefit Applied</span>
                                    Your 0.5% processing fee has been cancelled because you are an active premium subscriber.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 rounded-2xl bg-blue-50/50 p-4 text-blue-700">
                            <ShieldCheck className="h-5 w-5 shrink-0" />
                            <p className="text-xs leading-relaxed font-bold">
                                Your payment is processed securely via Paystack. We do not store your card details.
                            </p>
                        </div>

                        {amountToPay > 0 ? (
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl bg-[#1F6FDB] py-6 text-lg font-black text-white shadow-2xl shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        Complete Payment
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="flex w-full items-center justify-center gap-3 rounded-3xl bg-emerald-500 py-6 text-lg font-black text-white shadow-2xl shadow-emerald-500/30">
                                <CheckCircle2 className="h-6 w-6" />
                                Payment Completed
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-3 pt-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5 text-emerald-500"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span className="text-xs font-medium text-slate-400">Secure Payment Gateway</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-300">Automated transaction system</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
