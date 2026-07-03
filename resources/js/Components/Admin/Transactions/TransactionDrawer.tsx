import { router } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
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

    const issueRefund = () => {
        if (!transaction) return;
        const reason = window.prompt('Refund reason');
        if (!reason) return;
        const amount = window.prompt('Refund amount in kobo', String(transaction.amount));
        if (!amount) return;

        router.post(
            TransactionController.refund.url(transaction.ulid),
            { amount: Number(amount), reason },
            { preserveScroll: true, onSuccess: onClose },
        );
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Transaction Details</p>
                                <h2 className="text-xl font-black text-slate-900">{transaction?.reference_number || 'Loading...'}</h2>
                            </div>
                            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                            {loading && <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}
                            {!loading && transaction && (
                            <>
                            <section className="rounded-2xl bg-[#F0F5FF] p-4">
                                <p className="text-sm text-slate-500">{transaction.type_label}</p>
                                <p className="mt-1 text-3xl font-black text-[#0A3D91]">{formatCurrency(transaction.amount)}</p>
                                <p className="mt-2 text-sm font-semibold text-slate-700">{transaction.status_label}</p>
                                <p className="mt-1 text-sm text-slate-500">{transaction.description}</p>
                            </section>

                            <Section title="Resident">
                                {transaction.resident ? (
                                    <div>
                                        <p className="font-semibold text-slate-900">{transaction.resident.name}</p>
                                        <p className="text-sm text-slate-500">{transaction.resident.email}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">No resident linked</p>
                                )}
                            </Section>

                            <Section title="Collection">
                                <p className="text-sm text-slate-700">{transaction.collection?.name || 'Not linked to a collection'}</p>
                                {transaction.assignment && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        Paid {transaction.assignment.amount_paid.toLocaleString()} of {transaction.assignment.amount_due.toLocaleString()} ·{' '}
                                        {transaction.assignment.status}
                                    </p>
                                )}
                            </Section>

                            <Section title="Payment Information">
                                <InfoRow label="Method" value={transaction.payment_method_label} />
                                <InfoRow label="Provider" value={transaction.provider} />
                                <InfoRow label="Gateway Reference" value={transaction.gateway_reference} />
                                <InfoRow label="Receipt" value={transaction.receipt_number || transaction.reference_number} />
                                <InfoRow label="Coupon" value={transaction.coupon_code} />
                                <InfoRow label="Created" value={transaction.created_at ? format(parseISO(transaction.created_at), 'PPpp') : null} />
                                <InfoRow label="Paid" value={transaction.paid_at ? format(parseISO(transaction.paid_at), 'PPpp') : null} />
                            </Section>

                            {transaction.reason && (
                                <Section title="Reason">
                                    <p className="text-sm text-slate-600">{transaction.reason}</p>
                                </Section>
                            )}

                            {permissions.audit && transaction.audit_trail.length > 0 && (
                                <Section title="Audit Trail">
                                    <div className="space-y-3">
                                        {transaction.audit_trail.map((audit, index) => (
                                            <div key={index} className="rounded-xl border border-slate-100 p-3">
                                                <p className="text-sm font-semibold text-slate-800">{audit.action}</p>
                                                {audit.reason && <p className="mt-1 text-xs text-slate-500">{audit.reason}</p>}
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {audit.user?.name || 'System'}
                                                    {audit.created_at && ` · ${format(parseISO(audit.created_at), 'PPpp')}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {transaction.related_transactions.length > 0 && (
                                <Section title="Related Transactions">
                                    <div className="space-y-2">
                                        {transaction.related_transactions.map((related) => (
                                            <div key={related.reference_number} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                                <span>{related.reference_number} · {related.type_label}</span>
                                                <span className="font-semibold">{formatCurrency(related.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}
                            </>
                            )}
                        </div>

                        <div className="border-t border-slate-100 px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                                {transaction && permissions.refund && (
                                    <button type="button" onClick={issueRefund} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                                        Issue Refund
                                    </button>
                                )}
                                {permissions.download_receipts && (
                                    <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                        Download Receipt
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{title}</p>
            <div className="mt-2">{children}</div>
        </section>
    );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between gap-4 py-1 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800">{value}</span>
        </div>
    );
}