import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { router, useForm } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { store, update } from '@/actions/App/Http/Controllers/Zeus/ExpenseController';
import { destroy as removeReceipt } from '@/actions/App/Http/Controllers/Zeus/ExpenseReceiptController';
import ZeusModal from '@/Components/Zeus/ZeusModal';
import { cleanAmountInput, formatBytes, koboToInput, pickReceipts, today } from '@/Lib/expenses';
import ReceiptList from './ReceiptList';
import type { Category, ExpenseRow, Limits, Receipt } from './types';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    /** The expense being edited, or null to record a new one. */
    expense: ExpenseRow | null;
    categories: Category[];
    limits: Limits;
    onViewReceipt: (receipt: Receipt) => void;
};

const field =
    'w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none';
const label = 'mb-1.5 block text-[11px] font-bold tracking-widest text-slate-400 uppercase';

export default function ExpenseFormModal({ isOpen, onClose, expense, categories, limits, onViewReceipt }: Props) {
    const form = useForm<{
        incurred_on: string;
        amount: string;
        expense_category_id: string;
        payee: string;
        note: string;
        original_amount_note: string;
        receipts: File[];
    }>({
        incurred_on: today(),
        amount: '',
        expense_category_id: '',
        payee: '',
        note: '',
        original_amount_note: '',
        receipts: [],
    });
    const [pickProblems, setPickProblems] = useState<string[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);

    // Start fresh (or prefilled) every time the modal opens.
    useEffect(() => {
        if (!isOpen) return;
        form.clearErrors();
        setPickProblems([]);
        form.setData({
            incurred_on: expense?.incurred_on ?? today(),
            amount: expense ? koboToInput(expense.amount) : '',
            expense_category_id: expense?.category.id ? String(expense.category.id) : '',
            payee: expense?.payee ?? '',
            note: expense?.note ?? '',
            original_amount_note: expense?.original_amount_note ?? '',
            receipts: [],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, expense?.id]);

    function addFiles(event: ChangeEvent<HTMLInputElement>) {
        const { accepted, problems } = pickReceipts(
            form.data.receipts,
            Array.from(event.target.files ?? []),
            limits.max_receipts,
            limits.max_receipt_mb,
        );
        setPickProblems(problems);
        if (accepted.length) form.setData('receipts', [...form.data.receipts, ...accepted]);
        event.target.value = '';
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = { forceFormData: true, preserveScroll: true, onSuccess: onClose };

        // Files cannot travel in a PUT, so an edit is sent as a POST that the server treats as a PUT.
        form.transform((data) => (expense ? { ...data, _method: 'put' } : data));
        form.post(expense ? update.url(expense.id) : store.url(), options);
    }

    function removeExisting(receipt: Receipt) {
        router.delete(removeReceipt.url(receipt.id), { preserveScroll: true, preserveState: true, only: ['expenses', 'summary'] });
    }

    const receiptError = Object.entries(form.errors).find(([key]) => key === 'receipts' || key.startsWith('receipts.'))?.[1];
    const canSave = form.data.amount !== '' && form.data.payee.trim() !== '' && form.data.expense_category_id !== '' && !form.processing;

    return (
        <ZeusModal
            isOpen={isOpen}
            onClose={onClose}
            title={expense ? 'Edit expense' : 'Add expense'}
            subtitle={expense ? expense.payee : 'Write down money that went out.'}
            size="lg"
            footer={
                <div className="flex items-center justify-end gap-3">
                    {form.processing && form.progress && (
                        <div
                            role="progressbar"
                            aria-valuenow={form.progress.percentage ?? 0}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="mr-auto h-1.5 w-40 overflow-hidden rounded-full bg-slate-700"
                        >
                            <div
                                className="h-full rounded-full bg-primary-500 transition-all"
                                style={{ width: `${form.progress.percentage ?? 0}%` }}
                            />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-10 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="expense-form"
                        disabled={!canSave}
                        className="min-h-10 min-w-36 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {form.processing
                            ? form.progress
                                ? `Uploading ${form.progress.percentage ?? 0}%`
                                : 'Saving…'
                            : expense
                              ? 'Save changes'
                              : 'Save expense'}
                    </button>
                </div>
            }
        >
            <form id="expense-form" onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="expense-amount" className={label}>
                            Amount (₦)
                        </label>
                        <input
                            id="expense-amount"
                            inputMode="decimal"
                            autoComplete="off"
                            autoFocus={!expense}
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', cleanAmountInput(e.target.value))}
                            placeholder="0.00"
                            className={`${field} tabular-nums`}
                        />
                        {form.errors.amount && <p className="mt-1 text-xs text-rose-400">{form.errors.amount}</p>}
                    </div>
                    <div>
                        <label htmlFor="expense-date" className={label}>
                            Date
                        </label>
                        <input
                            id="expense-date"
                            type="date"
                            max={today()}
                            value={form.data.incurred_on}
                            onChange={(e) => form.setData('incurred_on', e.target.value)}
                            className={field}
                        />
                        {form.errors.incurred_on && <p className="mt-1 text-xs text-rose-400">{form.errors.incurred_on}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="expense-payee" className={label}>
                            Paid to
                        </label>
                        <input
                            id="expense-payee"
                            value={form.data.payee}
                            maxLength={150}
                            onChange={(e) => form.setData('payee', e.target.value)}
                            placeholder="Who did you pay?"
                            className={field}
                        />
                        {form.errors.payee && <p className="mt-1 text-xs text-rose-400">{form.errors.payee}</p>}
                    </div>
                    <div>
                        <label htmlFor="expense-category" className={label}>
                            Category
                        </label>
                        <select
                            id="expense-category"
                            value={form.data.expense_category_id}
                            onChange={(e) => form.setData('expense_category_id', e.target.value)}
                            className={field}
                        >
                            <option value="" disabled>
                                Choose a category
                            </option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                            {/* An archived category still names an old expense, but cannot be chosen for new ones. */}
                            {expense?.category.archived && expense.category.id && (
                                <option value={expense.category.id} disabled>
                                    {expense.category.name} (archived)
                                </option>
                            )}
                        </select>
                        {form.errors.expense_category_id && <p className="mt-1 text-xs text-rose-400">{form.errors.expense_category_id}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="expense-note" className={label}>
                        Note <span className="font-medium tracking-normal text-slate-500 normal-case">(optional)</span>
                    </label>
                    <textarea
                        id="expense-note"
                        rows={3}
                        maxLength={2000}
                        value={form.data.note}
                        onChange={(e) => form.setData('note', e.target.value)}
                        className={`${field} resize-none`}
                    />
                    {form.errors.note && <p className="mt-1 text-xs text-rose-400">{form.errors.note}</p>}
                </div>

                <div>
                    <label htmlFor="expense-original" className={label}>
                        Original amount <span className="font-medium tracking-normal text-slate-500 normal-case">(optional, for example USD 20)</span>
                    </label>
                    <input
                        id="expense-original"
                        value={form.data.original_amount_note}
                        maxLength={60}
                        onChange={(e) => form.setData('original_amount_note', e.target.value)}
                        className={field}
                    />
                </div>

                <div>
                    <span className={label}>Receipts</span>

                    {expense && expense.receipts.length > 0 && (
                        <div className="mb-2">
                            <ReceiptList receipts={expense.receipts} onView={onViewReceipt} onRemove={removeExisting} />
                        </div>
                    )}

                    {form.data.receipts.length > 0 && (
                        <ul className="mb-2 space-y-2">
                            {form.data.receipts.map((file, index) => (
                                <li
                                    key={`${file.name}-${index}`}
                                    className="flex items-center gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 px-3 py-2"
                                >
                                    <PaperClipIcon className="h-5 w-5 shrink-0 text-primary-300" />
                                    <span className="min-w-0 flex-1 truncate text-sm text-white">{file.name}</span>
                                    <span className="shrink-0 text-xs text-slate-400">{formatBytes(file.size)}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            form.setData(
                                                'receipts',
                                                form.data.receipts.filter((_, i) => i !== index),
                                            )
                                        }
                                        aria-label={`Remove ${file.name}`}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <input
                        ref={fileInput}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={addFiles}
                        className="sr-only"
                        tabIndex={-1}
                    />
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white"
                    >
                        <PaperClipIcon className="h-5 w-5" />
                        Attach receipt (photo or PDF)
                    </button>
                    <p className="mt-1.5 text-xs text-slate-500">
                        JPG, PNG, WEBP or PDF, up to {limits.max_receipt_mb} MB each, {limits.max_receipts} at a time.
                    </p>
                    {pickProblems.map((problem) => (
                        <p key={problem} className="mt-1 text-xs text-amber-300">
                            {problem}
                        </p>
                    ))}
                    {receiptError && <p className="mt-1 text-xs text-rose-400">{receiptError}</p>}
                </div>
            </form>
        </ZeusModal>
    );
}
