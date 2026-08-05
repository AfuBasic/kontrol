import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Clock3,
    AlertCircle,
    Wallet,
    ArrowRight,
    ShieldCheck,
    RefreshCw,
    FileText,
} from 'lucide-react';

type BulkAssignment = {
    ulid: string;
    name: string | null;
    amount_due: number;
    amount_paid: number;
    remaining: number;
    status: string;
};

type Props = {
    reference: string;
    status: 'paid_in_full' | 'partial' | 'pending' | 'failed';
    paymentStatus: string;
    amountPaid: number;
    amountDue: number;
    amountAlreadyPaid: number;
    remainingBalance: number;
    paidAt: string | null;
    isBulk: boolean;
    collectionName: string;
    payerName: string;
    estateName: string;
    payAgainUrl: string | null;
    bulkAssignments: BulkAssignment[];
    checkoutUrl: string | null;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
    }).format(amount || 0);

export default function PaymentStatus({
    reference,
    status,
    amountPaid,
    amountDue,
    amountAlreadyPaid,
    remainingBalance,
    paidAt,
    isBulk,
    collectionName,
    payerName,
    estateName,
    payAgainUrl,
    bulkAssignments,
    checkoutUrl,
}: Props) {
    const config = {
        paid_in_full: {
            icon: CheckCircle2,
            iconWrap: 'bg-emerald-50 text-emerald-500',
            title: 'Payment received',
            subtitle: isBulk
                ? 'All selected bills have been settled successfully.'
                : `Your payment for ${collectionName} has been received in full.`,
            badge: 'Settled',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        },
        partial: {
            icon: CheckCircle2,
            iconWrap: 'bg-blue-50 text-blue-500',
            title: 'Partial payment received',
            subtitle: `We received ${formatCurrency(amountPaid)} toward ${collectionName}. A balance remains on this bill.`,
            badge: 'Partial',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
        },
        pending: {
            icon: Clock3,
            iconWrap: 'bg-amber-50 text-amber-500',
            title: 'Confirming your transfer',
            subtitle:
                'Your bank transfer may still be processing. This page will update once Paystack confirms the payment. You can safely close this window — we will still record it.',
            badge: 'Pending',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
        },
        failed: {
            icon: AlertCircle,
            iconWrap: 'bg-rose-50 text-rose-500',
            title: 'Payment not completed',
            subtitle: 'This payment was not successful. You can try again whenever you are ready.',
            badge: 'Failed',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-100',
        },
    }[status];

    const Icon = config.icon;

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4 py-16 text-slate-900">
            <Head title={config.title} />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
            >
                <div className="border-b border-slate-100 bg-slate-50 px-8 py-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Kontrol</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{estateName}</p>
                            </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-wider uppercase ${config.badgeClass}`}>
                            {config.badge}
                        </span>
                    </div>
                </div>

                <div className="space-y-8 p-8 sm:p-10">
                    <div className="text-center">
                        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${config.iconWrap}`}>
                            <Icon className="h-10 w-10" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">{config.title}</h1>
                        <p className="mt-3 text-base leading-relaxed font-medium text-slate-500">{config.subtitle}</p>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-6">
                        {(status === 'paid_in_full' || status === 'partial') && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Amount paid now</span>
                                <span className="text-2xl font-black text-slate-900">{formatCurrency(amountPaid)}</span>
                            </div>
                        )}

                        {!isBulk && (
                            <>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-500">Bill total</span>
                                    <span className="font-bold text-slate-800">{formatCurrency(amountDue)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-500">Total paid on bill</span>
                                    <span className="font-bold text-slate-800">{formatCurrency(amountAlreadyPaid)}</span>
                                </div>
                                {remainingBalance > 0 && (
                                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                                        <span className="font-medium text-amber-600">Remaining balance</span>
                                        <span className="text-lg font-black text-amber-600">{formatCurrency(remainingBalance)}</span>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                            <span className="font-medium text-slate-500">Reference</span>
                            <span className="max-w-[60%] truncate font-mono text-xs font-bold text-slate-700">{reference}</span>
                        </div>

                        {paidAt && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-500">Confirmed</span>
                                <span className="font-bold text-slate-800">{new Date(paidAt).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Payer</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{payerName}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Bill</p>
                            <p className="mt-1 truncate text-sm font-bold text-slate-900">{collectionName}</p>
                        </div>
                    </div>

                    {isBulk && bulkAssignments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Bills covered</p>
                            <div className="max-h-48 space-y-2 overflow-y-auto">
                                {bulkAssignments.map((item) => (
                                    <div
                                        key={item.ulid}
                                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                                            <span className="truncate text-sm font-bold text-slate-700">{item.name}</span>
                                        </div>
                                        <span className="ml-3 shrink-0 text-sm font-black text-slate-900">
                                            {formatCurrency(item.amount_due)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {status === 'partial' && payAgainUrl && (
                            <Link
                                href={payAgainUrl}
                                className="group flex w-full items-center justify-center gap-2 rounded-3xl bg-blue-600 py-5 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-500"
                            >
                                Pay remaining {formatCurrency(remainingBalance)}
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        )}

                        {status === 'failed' && checkoutUrl && (
                            <Link
                                href={checkoutUrl}
                                className="group flex w-full items-center justify-center gap-2 rounded-3xl bg-blue-600 py-5 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-500"
                            >
                                Try again
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        )}

                        {status === 'pending' && (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-slate-200 bg-white py-5 text-base font-black text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <RefreshCw className="h-5 w-5" />
                                Refresh status
                            </button>
                        )}

                        {(status === 'paid_in_full' || status === 'partial') && (
                            <p className="pt-2 text-center text-xs font-bold tracking-widest text-slate-400 uppercase">
                                You may close this window
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Secured via Paystack bank transfer</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
