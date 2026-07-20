import { router } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ShieldCheck, CreditCard, RefreshCcw, Download, User, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';

import TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';

interface TransactionDetail {
    ulid: string;
    reference_number: string;
    gateway_reference: string | null;
    receipt_number: string | null;
    type_label: string;
    status_label: string;
    payment_method_label: string | null;
    provider: string | null;
    amount: number;
    description: string | null;
    reason: string | null;
    coupon_code: string | null;
    created_at: string | null;
    paid_at: string | null;
    resident: { id: number; name: string; email: string } | null;
    collection: { id: number; name: string } | null;
    created_by: { id: number; name: string } | null;
    approved_by: { id: number; name: string } | null;
    metadata: Record<string, unknown> | null;
    gateway_response: Record<string, unknown> | null;
    related_transactions: Array<{ reference_number: string; type_label: string; amount: number; status_label: string }>;
    audit_trail: Array<{
        action: string;
        reason: string | null;
        user: { name: string } | null;
        created_at: string | null;
    }>;
    assignment: { amount_due: number; amount_paid: number; status: string } | null;
    invoice: { invoice_number: string; amount: number } | null;
}

interface Permissions {
    refund: boolean;
    adjust: boolean;
    audit: boolean;
    download_receipts: boolean;
}

interface Props {
    transactionUlid: string | null;
    open: boolean;
    onClose: () => void;
    permissions: Permissions;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

export default function TransactionDrawer({ transactionUlid, open, onClose, permissions }: Props) {
    const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !transactionUlid) {
            return;
        }

        setLoading(true);
        axios
            .get(TransactionController.show.url(transactionUlid), { headers: { Accept: 'application/json' } })
            .then((response) => setTransaction(response.data.transaction))
            .finally(() => setLoading(false));
    }, [open, transactionUlid]);

    if (!open) return null;

    const downloadPdf = () => {
        if (!transaction) return;
        window.location.href = `/admin/transactions/${transaction.ulid}/download`;
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-slate-50 shadow-2xl border-l border-slate-200/50"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-4.5 bg-white border-b border-slate-200/50">
                            <div>
                                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                    Ledger Receipt
                                </span>
                                <h2 className="text-sm font-black text-slate-900 tracking-tight mt-0.5">
                                    {transaction?.reference_number || 'Loading details...'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                            {loading && (
                                <div className="space-y-4">
                                    <div className="h-28 animate-pulse rounded-3xl bg-white border border-slate-150" />
                                    <div className="h-40 animate-pulse rounded-3xl bg-white border border-slate-150" />
                                </div>
                            )}

                            {!loading && transaction && (
                                <>
                                    {/* ── Apple Wallet style Premium Invoice Bill header ── */}
                                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {transaction.type_label}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                                                transaction.status_label.toLowerCase().includes('success') || transaction.status_label.toLowerCase().includes('paid')
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    : transaction.status_label.toLowerCase().includes('fail')
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-105'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-105'
                                            }`}>
                                                {transaction.status_label}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                                            {formatCurrency(transaction.amount)}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 font-medium">
                                            {transaction.description || 'No transaction description recorded.'}
                                        </p>
                                    </div>

                                    {/* Resident card */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
                                        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Resident Owner</span>
                                        </div>
                                        {transaction.resident ? (
                                            <div>
                                                <p className="font-extrabold text-slate-800 text-sm">{transaction.resident.name}</p>
                                                <p className="text-xs text-slate-400 font-semibold">{transaction.resident.email}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-semibold">No resident linked</p>
                                        )}
                                    </div>

                                    {/* Collection details */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
                                        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                                            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Linked Levy</span>
                                        </div>
                                        <p className="font-extrabold text-slate-800 text-sm">{transaction.collection?.name || 'Manual system ledger entry'}</p>
                                        {transaction.assignment && (
                                            <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">
                                                Paid {formatCurrency(transaction.assignment.amount_paid)} of {formatCurrency(transaction.assignment.amount_due)} outstanding balance ({transaction.assignment.status}).
                                            </p>
                                        )}
                                    </div>

                                    {/* Payment details */}
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
                                        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                            <CreditCard className="h-4 w-4 text-slate-400" />
                                            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Payment Metadata</span>
                                        </div>
                                        <div className="divide-y divide-slate-100/70">
                                            <InfoRow label="Method" value={transaction.payment_method_label} />
                                            <InfoRow label="Provider" value={transaction.provider} />
                                            <InfoRow label="Gateway Ref" value={transaction.gateway_reference} />
                                            <InfoRow label="Receipt Number" value={transaction.receipt_number || transaction.reference_number} />
                                            {transaction.coupon_code && <InfoRow label="Coupon" value={transaction.coupon_code} />}
                                            <InfoRow label="Initiated At" value={transaction.created_at ? format(parseISO(transaction.created_at), 'PPpp') : null} />
                                            <InfoRow label="Cleared At" value={transaction.paid_at ? format(parseISO(transaction.paid_at), 'PPpp') : null} />
                                        </div>
                                    </div>

                                    {/* Audit History */}
                                    {permissions.audit && transaction.audit_trail.length > 0 && (
                                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
                                            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                                <RefreshCcw className="h-4 w-4 text-slate-400" />
                                                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Ledger Audit Trail</span>
                                            </div>
                                            <div className="space-y-3">
                                                {transaction.audit_trail.map((audit, i) => (
                                                    <div key={i} className="flex gap-2.5 items-start">
                                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-350" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 leading-tight">{audit.action}</p>
                                                            {audit.reason && (
                                                                <p className="mt-0.5 text-[11px] text-slate-400 italic">
                                                                    "{audit.reason}"
                                                                </p>
                                                            )}
                                                            <p className="mt-0.5 text-[10px] text-slate-400 font-semibold">
                                                                By {audit.user?.name || 'System'} • {audit.created_at ? format(parseISO(audit.created_at), 'PP') : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Related Transactions */}
                                    {transaction.related_transactions.length > 0 && (
                                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
                                            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                                <ArrowDownLeft className="h-4 w-4 text-slate-400" />
                                                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Related Adjustments</span>
                                            </div>
                                            <div className="space-y-2">
                                                {transaction.related_transactions.map((related) => (
                                                    <div key={related.reference_number} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold">
                                                        <span className="text-slate-600">{related.reference_number} • {related.type_label}</span>
                                                        <span className="text-slate-900">{formatCurrency(related.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Drawer Actions */}
                        <div className="border-t border-slate-200/50 bg-white px-6 py-4.5">
                            <div className="flex gap-2">
                                {permissions.download_receipts && (
                                    <button
                                        type="button"
                                        onClick={downloadPdf}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black tracking-wider uppercase text-slate-700 hover:bg-slate-50 active:scale-98 transition w-full"
                                    >
                                        <Download className="h-3.5 w-3.5" /> Download PDF
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between gap-4 py-2 text-xs font-bold">
            <span className="text-slate-400 font-semibold">{label}</span>
            <span className="text-slate-800 text-right truncate max-w-[240px]">{value}</span>
        </div>
    );
}