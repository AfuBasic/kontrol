import { ArchiveBoxIcon, ArrowUturnLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import ZeusModal from '@/Components/Zeus/ZeusModal';
import { formatKobo } from '@/Lib/expenses';
import ReceiptList from './ReceiptList';
import type { ExpenseRow, Receipt } from './types';

type Props = {
    expense: ExpenseRow | null;
    onClose: () => void;
    onEdit: (expense: ExpenseRow) => void;
    onArchive: (expense: ExpenseRow) => void;
    onRestore: (expense: ExpenseRow) => void;
    onViewReceipt: (receipt: Receipt) => void;
};

function longDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/** Read-only details of one expense, with its receipts, and the buttons to edit, archive or restore it. */
export default function ExpenseDetailModal({ expense, onClose, onEdit, onArchive, onRestore, onViewReceipt }: Props) {
    const [confirmArchive, setConfirmArchive] = useState(false);

    useEffect(() => setConfirmArchive(false), [expense?.id]);

    return (
        <ZeusModal
            isOpen={expense !== null}
            onClose={onClose}
            title={expense?.payee ?? 'Expense'}
            subtitle={expense ? longDate(expense.incurred_on) : undefined}
            size="lg"
            footer={
                expense &&
                (confirmArchive ? (
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-rose-100">Archive this expense? It leaves the totals but nothing is deleted.</p>
                        <div className="flex shrink-0 gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmArchive(false)}
                                className="min-h-10 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-white/5"
                            >
                                Keep it
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onArchive(expense);
                                    onClose();
                                }}
                                className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-500"
                            >
                                Archive
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3">
                        {expense.archived ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onRestore(expense);
                                    onClose();
                                }}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                                <ArrowUturnLeftIcon className="h-5 w-5" />
                                Restore
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirmArchive(true)}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-rose-300"
                            >
                                <ArchiveBoxIcon className="h-5 w-5" />
                                Archive
                            </button>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-10 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-white/5"
                            >
                                Close
                            </button>
                            {!expense.archived && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(expense)}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white hover:bg-primary-500"
                                >
                                    <PencilSquareIcon className="h-5 w-5" />
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>
                ))
            }
        >
            {expense && (
                <div className="space-y-6">
                    <div className="flex items-baseline justify-between gap-4">
                        <p className="text-3xl font-black tracking-tight whitespace-nowrap text-white tabular-nums">{formatKobo(expense.amount)}</p>
                        {expense.archived && (
                            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-200">Archived</span>
                        )}
                    </div>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <Detail label="Paid to" value={expense.payee} />
                        <Detail
                            label="Category"
                            value={`${expense.category.name ?? 'Uncategorised'}${expense.category.archived ? ' (archived)' : ''}`}
                        />
                        <Detail label="Original amount" value={expense.original_amount_note ?? '—'} />
                        <Detail label="Receipts" value={expense.receipts.length === 0 ? 'None attached' : `${expense.receipts.length} attached`} />
                    </dl>

                    <div>
                        <p className="mb-1.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Note</p>
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-200">{expense.note ?? 'No note.'}</p>
                    </div>

                    {expense.receipts.length > 0 && (
                        <div>
                            <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Receipts</p>
                            <ReceiptList receipts={expense.receipts} onView={onViewReceipt} />
                        </div>
                    )}
                </div>
            )}
        </ZeusModal>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <dt className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</dt>
            <dd className="mt-1 text-sm font-medium break-words text-white">{value}</dd>
        </div>
    );
}
