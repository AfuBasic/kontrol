import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';

interface Transaction {
    ulid: string;
    reference_number: string;
    gateway_reference: string | null;
    type_label: string;
    status: string;
    status_label: string;
    amount: number;
    payment_method_label: string | null;
    provider: string | null;
    created_at: string | null;
    resident: { name: string } | null;
    collection: { name: string } | null;
    created_by: { name: string } | null;
}

interface PaginatedTransactions {
    data: Transaction[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    transactions: PaginatedTransactions;
    onSelect: (transaction: Transaction) => void;
}

const formatCurrency = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

function StatusBadge({ status, label }: { status: string; label: string }) {
    const classes = {
        success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        pending: 'bg-amber-50 text-amber-700 ring-amber-200',
        failed: 'bg-rose-50 text-rose-700 ring-rose-200',
        reversed: 'bg-violet-50 text-violet-700 ring-violet-200',
        cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
        partial: 'bg-blue-50 text-blue-700 ring-blue-200',
    }[status] || 'bg-slate-100 text-slate-600 ring-slate-200';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ring-1 ring-inset ${classes}`}>
            {label}
        </span>
    );
}

export default function TransactionsTable({ transactions, onSelect }: Props) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Transactions</p>
                    <p className="mt-1 text-sm text-slate-500">{transactions.total.toLocaleString()} records</p>
                </div>
            </div>

            <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                            {['Resident', 'Collection', 'Type', 'Amount', 'Method', 'Reference', 'Status', 'Created', 'By', ''].map((heading) => (
                                <th key={heading} className="px-4 py-3 text-left text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.data.map((transaction) => (
                            <tr
                                key={transaction.ulid}
                                onClick={() => onSelect(transaction)}
                                className="group cursor-pointer border-b border-slate-50 transition hover:bg-[#F0F5FF]/60"
                            >
                                <td className="px-4 py-4 text-sm font-medium text-slate-900">{transaction.resident?.name || '—'}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{transaction.collection?.name || '—'}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{transaction.type_label}</td>
                                <td className="px-4 py-4 text-sm font-bold text-slate-900">{formatCurrency(transaction.amount)}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{transaction.payment_method_label || transaction.provider || '—'}</td>
                                <td className="px-4 py-4 text-sm text-slate-600">{transaction.reference_number}</td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={transaction.status} label={transaction.status_label} />
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-500">
                                    {transaction.created_at ? format(parseISO(transaction.created_at), 'MMM d, h:mm a') : '—'}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-500">{transaction.created_by?.name || '—'}</td>
                                <td className="px-4 py-4">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(transaction);
                                        }}
                                        className="rounded-lg p-2 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-[#1F6FDB]"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
                {transactions.data.map((transaction) => (
                    <button
                        key={transaction.ulid}
                        type="button"
                        onClick={() => onSelect(transaction)}
                        className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-[#1F6FDB]/20"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-slate-900">{transaction.resident?.name || 'System'}</p>
                                <p className="text-sm text-slate-500">{transaction.collection?.name || transaction.type_label}</p>
                            </div>
                            <p className="font-bold text-slate-900">{formatCurrency(transaction.amount)}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <StatusBadge status={transaction.status} label={transaction.status_label} />
                            <span className="text-xs text-slate-400">{transaction.reference_number}</span>
                        </div>
                    </button>
                ))}
            </div>

            {transactions.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                    <p className="text-sm text-slate-500">
                        Page {transactions.current_page} of {transactions.last_page}
                    </p>
                    <div className="flex gap-2">
                        {transactions.links.map((link, index) => {
                            if (!link.url || link.label.includes('Previous') || link.label.includes('Next')) {
                                const isPrev = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');
                                if (!isPrev && !isNext) return null;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className="rounded-xl border border-slate-200 p-2 disabled:opacity-40"
                                    >
                                        {isPrev ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}