import { router } from '@inertiajs/react';
import { useState } from 'react';

import { recordOfflinePayment } from '@/actions/App/Http/Controllers/Admin/TransactionController';
import ConfirmationModal from '@/Components/ConfirmationModal';

interface RecordableAssignment {
    id: number;
    resident_name: string | null;
    collection_name: string | null;
    remaining: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    assignments: RecordableAssignment[];
}

export default function RecordOfflinePaymentModal({ isOpen, onClose, assignments }: Props) {
    const [assignmentId, setAssignmentId] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bank_transfer');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selected = assignments.find((a) => a.id === Number(assignmentId));

    const canSubmit = Boolean(assignmentId && amount && Number(amount) > 0);

    const handleConfirm = () => {
        if (!canSubmit) return;

        setIsSubmitting(true);
        router.post(
            recordOfflinePayment.url(),
            {
                assignment_id: Number(assignmentId),
                amount: Number(amount),
                method,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignmentId('');
                    setAmount('');
                    setMethod('bank_transfer');
                    onClose();
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    return (
        <ConfirmationModal
            isOpen={isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            title="Record Offline Payment"
            message="Record a payment received outside the online gateway. It will appear in the estate ledger immediately."
            confirmLabel="Record Payment"
            cancelLabel="Cancel"
            type="info"
            isLoading={isSubmitting}
        >
            <div className="mt-5 space-y-4">
                {assignments.length === 0 ? (
                    <p className="text-sm text-slate-500">No outstanding collection assignments to record payments against.</p>
                ) : (
                    <>
                        <div>
                            <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Assignment</label>
                            <select
                                value={assignmentId}
                                onChange={(e) => {
                                    setAssignmentId(e.target.value);
                                    const assignment = assignments.find((a) => a.id === Number(e.target.value));
                                    if (assignment) {
                                        setAmount(String(assignment.remaining));
                                    }
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            >
                                <option value="">Select resident & collection…</option>
                                {assignments.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.resident_name} — {a.collection_name} (₦{a.remaining.toLocaleString()} due)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Amount (NGN)</label>
                            <input
                                type="number"
                                min="0.01"
                                max={selected?.remaining}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                placeholder="0"
                            />
                            {selected && (
                                <p className="mt-1 text-xs text-slate-400">Maximum: ₦{selected.remaining.toLocaleString()}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Payment Method</label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="offline">Offline</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                    </>
                )}
            </div>
        </ConfirmationModal>
    );
}