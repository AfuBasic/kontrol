import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Eye, MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

interface Transaction {
    ulid: string;
    reference_number: string;
    gateway_reference: string | null;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    amount: number;
    direction: string;
    payment_method_label: string | null;
    provider: string | null;
    created_at: string | null;
    resident: { name: string } | null;
    collection: { name: string } | null;
}

interface PaginatedTransactions {
    data: Transaction[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface Permissions {
    export: boolean;
    download_receipts: boolean;
}

interface Props {
    transactions: PaginatedTransactions;
    onSelect: (transaction: Transaction) => void;
    permissions: Permissions;
}

const formatCurrency = (amountKobo: number, direction?: string) => {
    const formatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);
    return direction === 'debit' ? `−${formatted}` : formatted;
};

function StatusBadge({ status, label }: { status: string; label: string }) {
    const classes = {
        success: 'bg-emerald-50 text-emerald-700',
        pending: 'bg-amber-50 text-amber-700',
        failed: 'bg-rose-50 text-rose-700',
        reversed: 'bg-violet-50 text-violet-700',
        cancelled: 'bg-slate-100 text-slate-600',
        partial: 'bg-blue-50 text-blue-700',
    }[status] || 'bg-slate-100 text-slate-600';

    return <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${classes}`}>{label}</span>;
}

function RowActions({ transaction, onSelect, permissions }: { transaction: Transaction; onSelect: (t: Transaction) => void; permissions: Permissions }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(transaction); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                            <Eye className="h-3.5 w-3.5" /> View details
                        </button>
                        {permissions.download_receipts && (
                            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                                <Download className="h-3.5 w-3.5" /> Receipt
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default function TransactionsTable({ transactions, onSelect, permissions }: Props) {
    return (
        <div className="overflow-hidden rounded-xl bg-white">
            <div className="border-b border-slate-100 px-5 py-3">
                <p className="text-sm font-semibold text-slate-900 font-black">All Transactions</p>
                <p className="text-xs text-slate-400 font-bold">{transactions.total.toLocaleString()} records</p>
            </div>

            {transactions.data.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold">No ledger transactions found</div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-[10px] font-black tracking-wide text-slate-400 uppercase">
                                    {['Transaction', 'Resident', 'Collection', 'Amount', 'Method', 'Status', 'Reference', 'Date', ''].map((h) => (
                                        <th key={h} className="px-4 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {transactions.data.map((tx) => (
                                    <tr key={tx.ulid} onClick={() => onSelect(tx)} className="group cursor-pointer transition hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-bold text-slate-900">{tx.type_label}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{tx.resident?.name || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{tx.collection?.name || '—'}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{formatCurrency(tx.amount, tx.direction)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 font-semibold">{tx.payment_method_label || tx.provider || '—'}</td>
                                        <td className="px-4 py-3"><StatusBadge status={tx.status} label={tx.status_label} /></td>
                                        <td className="px-4 py-3 font-mono text-[10px] text-slate-450 font-semibold">{tx.reference_number}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 font-semibold">
                                            {tx.created_at ? format(parseISO(tx.created_at), 'MMM d, h:mm a') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <RowActions transaction={tx} onSelect={onSelect} permissions={permissions} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {transactions.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                            <p className="text-xs text-slate-400">Page {transactions.current_page} of {transactions.last_page}</p>
                            <div className="flex gap-1">
                                {transactions.links.map((link, i) => {
                                    if (!link.url) return null;
                                    if (link.label.includes('Previous')) {
                                        return (
                                            <button key={i} type="button" onClick={() => router.get(link.url!, {}, { preserveState: true })} className="rounded-md border border-slate-200 p-1.5">
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                        );
                                    }
                                    if (link.label.includes('Next')) {
                                        return (
                                            <button key={i} type="button" onClick={() => router.get(link.url!, {}, { preserveState: true })} className="rounded-md border border-slate-200 p-1.5">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}