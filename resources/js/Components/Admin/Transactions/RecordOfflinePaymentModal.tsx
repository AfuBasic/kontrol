import { router } from '@inertiajs/react';
import { useState } from 'react';

import { recordOfflinePayment } from '@/actions/App/Http/Controllers/Admin/TransactionController';
import ConfirmationModal from '@/Components/ConfirmationModal';
import CustomSelect from '@/Components/UI/CustomSelect';

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
                            <CustomSelect
                                value={assignmentId}
                                onChange={(val) => {
                                    setAssignmentId(String(val));
                                    const assignment = assignments.find((a) => a.id === Number(val));
                                    if (assignment) {
                                        setAmount(String(assignment.remaining));
                                    }
                                }}
                                placeholder="Select resident & collection…"
                                options={[
                                    { value: '', label: 'Select resident & collection…' },
                                    ...assignments.map((a) => ({
                                        value: String(a.id),
                                        label: `${a.resident_name} - ${a.collection_name} (₦${a.remaining.toLocaleString()} due)`,
                                    })),
                                ]}
                            />
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
                            {selected && <p className="mt-1 text-xs text-slate-400">Maximum: ₦{selected.remaining.toLocaleString()}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Payment Method</label>
                            <CustomSelect
                                value={method}
                                onChange={(val) => setMethod(String(val))}
                                options={[
                                    { value: 'bank_transfer', label: 'Bank Transfer' },
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'offline', label: 'Offline' },
                                    { value: 'manual', label: 'Manual' },
                                ]}
                            />
                        </div>
                    </>
                )}
            </div>
        </ConfirmationModal>
    );
}
