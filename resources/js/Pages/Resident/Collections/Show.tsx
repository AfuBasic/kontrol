import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Wallet, ChevronLeft, Calendar, Info, ShieldCheck, ExternalLink } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/Resident/CollectionController';
import CollectionPaymentController from '@/actions/App/Http/Controllers/Web/CollectionPaymentController';
import type { SharedData } from '@/types';

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
};

type Payment = {
    id: number;
    amount: number;
    provider: string;
    reference: string;
    paid_at: string;
};

type Assignment = {
    ulid: string;
    id: number;
    collection_id: number;
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'paid' | 'overdue' | 'grace' | 'partial';
    due_date: string;
    period: string | null;
    paid_at: string | null;
    collection: Collection;
    payments?: Payment[];
    is_property_owner_bill?: boolean;
    billing_source?: 'estate' | 'property_owner';
};

type Props = {
    assignment: Assignment;
};

export default function CollectionShow({ assignment }: Props) {
    // Use app_url from shared props — same pattern as useExternalBilling.
    // window.location.origin is unreliable inside Capacitor's webview
    // (it resolves to capacitor://localhost, not the actual server).
    const { app_url: appUrl } = usePage<SharedData>().props;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-100 text-emerald-700';
            case 'overdue':
                return 'bg-rose-100 text-rose-700';
            case 'grace':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-amber-100 text-amber-700';
        }
    };

    // Build the absolute payment URL using the server-provided app_url.
    const rawPaymentUrl = CollectionPaymentController.show.url(assignment.ulid);
    const paymentUrl = rawPaymentUrl.startsWith('//')
        ? `${appUrl.startsWith('https') ? 'https:' : 'http:'}${rawPaymentUrl}`
        : `${appUrl}${rawPaymentUrl}`;

    const handleSettle = async (e: React.MouseEvent<HTMLButtonElement>) => {
        const isNative = Capacitor.isNativePlatform();
        if (isNative) {
            try {
                await Browser.open({ url: paymentUrl });
            } catch (err) {
                console.error('Failed to open in-app browser:', err);
                window.open(paymentUrl, '_system');
            }
        } else {
            window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-32">
            <Head title={assignment.collection.name} />

            {/* Back Button */}
            <section className="px-1">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dues
                </Link>
            </section>

            {/* Main Info Card */}
            <section>
                <motion.div
                    layoutId={`collection-card-${assignment.ulid}`}
                    className="rounded-[2.5rem] bg-white p-8 shadow-xl ring-1 shadow-slate-200/50 ring-slate-100"
                >
                    <div className="flex flex-col items-center text-center">
                        <div
                            className={`mb-6 flex h-20 w-20 items-center justify-center rounded-4xl ${
                                assignment.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                            }`}
                        >
                            <Wallet className="h-10 w-10" />
                        </div>

                        <span
                            className={`mb-3 rounded-full px-4 py-1 text-[10px] font-black tracking-widest uppercase ${getStatusStyles(assignment.status)}`}
                        >
                            {assignment.status}
                        </span>

                        {assignment.billing_source === 'property_owner' ? (
                            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-0.5 text-[9px] font-black tracking-widest text-purple-700 uppercase ring-1 ring-purple-100/50">
                                Property Owner Bill
                            </span>
                        ) : (
                            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-[9px] font-black tracking-widest text-blue-700 uppercase ring-1 ring-blue-100/50">
                                Estate Dues
                            </span>
                        )}

                        <h1 className="text-xl font-black tracking-tight text-slate-900">{assignment.collection.name}</h1>
                        <p className="mt-2 max-w-[280px] text-xs font-medium text-slate-500">
                            {assignment.collection.description ||
                                (assignment.billing_source === 'property_owner'
                                    ? 'Levy/charge issued by your Property Owner.'
                                    : 'Official Estate levy for the current period.')}
                        </p>

                        <div className="mt-8 flex w-full flex-col gap-4 rounded-3xl bg-slate-50 p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Amount Due</span>
                                <span className="text-base font-black text-slate-900">{formatCurrency(assignment.amount_due)}</span>
                            </div>
                            {assignment.amount_paid > 0 && (
                                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Paid Already</span>
                                    <span className="text-sm font-black text-emerald-600">-{formatCurrency(assignment.amount_paid)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Balance</span>
                                <span className="text-lg font-black text-[#1F6FDB]">
                                    {formatCurrency(assignment.amount_due - assignment.amount_paid)}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Details Grid */}
            <section className="grid grid-cols-2 gap-4">
                <div className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <Calendar className="mb-3 h-5 w-5 text-slate-400" />
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Due Date</p>
                    <p className="mt-1 font-black tracking-tight text-slate-900">
                        {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <Info className="mb-3 h-5 w-5 text-slate-400" />
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Billing Cycle</p>
                    <p className="mt-1 font-black tracking-tight text-slate-900 uppercase">{assignment.period || 'One-time'}</p>
                </div>
            </section>

            {/* Payment History / Receipts */}
            {assignment.payments && assignment.payments.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h3 className="px-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Payment History</h3>
                    <div className="flex flex-col gap-3">
                        {assignment.payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                                        <Wallet className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 capitalize">{payment.provider.replace('_', ' ')}</h4>
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Ref: {payment.reference}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">{formatCurrency(payment.amount)}</div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        {new Date(payment.paid_at).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Settlement Section */}
            <section>
                {assignment.status !== 'paid' ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleSettle}
                            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-4xl bg-[#1F6FDB] py-6 text-lg font-black text-white shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
                        >
                            Settle Balance
                            <ExternalLink className="h-5 w-5" />
                        </button>
                        <div className="flex items-center justify-center gap-2 px-6 text-center">
                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Securely resolve dues via Secure Gateway</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-4xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-100 ring-inset">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-emerald-900">Obligation Resolved</h3>
                        <p className="mt-1 text-sm font-medium text-emerald-600">
                            Thank you! This obligation has been fully settled on {new Date(assignment.paid_at!).toLocaleDateString()}.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
