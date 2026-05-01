import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Wallet, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Building2, User } from 'lucide-react';
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
};

declare global {
    interface Window {
        PaystackPop: any;
    }
}

export default function PayCollection({ assignment, paystackKey }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const amountToPay = assignment.amount_due - assignment.amount_paid;

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
            const response = await fetch(CollectionPaymentController.initiate.url(assignment.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
                },
            });

            const { reference, email, amount } = await response.json();

            // 2. Open Paystack Popup
            const handler = window.PaystackPop.setup({
                key: paystackKey,
                email: email,
                amount: amount * 100, // Paystack requires amount in kobo
                ref: reference,
                onClose: () => {
                    setIsProcessing(false);
                },
                callback: (response: any) => {
                    setPaymentStatus('success');
                    setIsProcessing(false);
                    // Redirect back to mobile app or success page after a delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
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
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-emerald-50 text-emerald-500">
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
            <Head>
                <title>Pay for {assignment.collection.name}</title>
                <script src="https://js.paystack.co/v1/inline.js"></script>
            </Head>

            <div className="w-full max-w-4xl overflow-hidden rounded-[3rem] bg-white shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100 lg:flex">
                {/* Left Side: Summary */}
                <div className="relative bg-slate-900 p-8 text-white lg:w-1/2 lg:p-16">
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <div className="mb-12 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-blue-600 shadow-xl shadow-blue-500/20">
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
                        <div className="rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Total to pay</span>
                                <span className="text-4xl font-black tracking-tight text-slate-900">{formatCurrency(amountToPay)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-blue-50/50 p-4 text-blue-700">
                            <ShieldCheck className="h-5 w-5 shrink-0" />
                            <p className="text-xs leading-relaxed font-bold">
                                Your payment is processed securely via Paystack. We do not store your card details.
                            </p>
                        </div>

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

                        <div className="flex flex-col items-center gap-4 pt-4">
                            <img src="https://paystack.com/assets/payment/cards.png" alt="Paystack Secure" className="h-6 opacity-50 grayscale" />
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Secure Payment Gateway</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
