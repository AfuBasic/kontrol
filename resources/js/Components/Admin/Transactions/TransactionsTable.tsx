import { router } from '@inertiajs/react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Download, Eye, MoreHorizontal, Loader2 } from 'lucide-react';
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

function RowActions({
    transaction,
    onSelect,
    permissions,
}: {
    transaction: Transaction;
    onSelect: (t: Transaction) => void;
    permissions: Permissions;
}) {
    const [open, setOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (downloading) return;
        setDownloading(true);
        try {
            const response = await axios.get(`/admin/transactions/${transaction.ulid}/download`, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${transaction.reference_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setOpen(false);
        } catch (error) {
            console.error('Failed to download receipt PDF', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(transaction);
                                setOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <Eye className="h-3.5 w-3.5" /> View details
                        </button>
                        {permissions.download_receipts && transaction.status !== 'pending' && (
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                                {downloading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" /> Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-3.5 w-3.5" /> Receipt
                                    </>
                                )}
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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
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