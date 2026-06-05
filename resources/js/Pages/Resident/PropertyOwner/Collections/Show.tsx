import {
    WalletIcon,
    ArrowLeftIcon,
    CalendarIcon,
    PlusIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ClockIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { index, recordPayment } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';

interface Assignment {
    id: number;
    ulid: string;
    resident_name: string;
    property_name: string;
    amount_due: number;
    amount_paid: number;
    status: string;
    due_date: string;
    paid_at: string | null;
}

interface Props {
    collection: {
        id: number;
        ulid: string;
        name: string;
        description: string | null;
        amount: number;
        due_at: string;
        status: string;
    };
    assignments: Assignment[];
    collected: number;
    outstanding: number;
}

export default function Show({ collection, assignments, collected, outstanding }: Props) {
    const [recordingAssignment, setRecordingAssignment] = useState<Assignment | null>(null);

    const paymentForm = useForm({
        amount: '',
        reference: '',
    });

    const handleRecordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recordingAssignment) return;

        paymentForm.post(recordPayment.url(recordingAssignment.ulid), {
            onSuccess: () => {
                setRecordingAssignment(null);
                paymentForm.reset();
            },
        });
    };

    const totalBillsCount = assignments.length;
    const paidBillsCount = assignments.filter((a) => a.status === 'paid').length;
    const collectedPct = totalBillsCount > 0 ? Math.round((paidBillsCount / totalBillsCount) * 100) : 0;

    return (
        <div className="space-y-6 pb-24">
            <Head title={`Collection Details - ${collection.name}`} />

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href={index.url()}
                    className="text-slate-600 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs ring-1 ring-slate-100 transition-all hover:bg-slate-50"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900">{collection.name}</h1>
                    <p className="text-xs text-slate-500">Rent & Fees Billing Sheet</p>
                </div>
            </div>

            {/* Collection Metrics */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                    <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Collected</h3>
                    <p className="mt-2 text-2xl font-black text-slate-950">₦{collected.toLocaleString()}</p>
                </div>

                <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                    <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Outstanding Balance</h3>
                    <p className="text-slate-950 mt-2 text-2xl font-black">₦{outstanding.toLocaleString()}</p>
                </div>

                <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                    <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Collection Rate</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-950">{collectedPct}%</span>
                        <span className="text-xs font-bold text-slate-400">
                            ({paidBillsCount}/{totalBillsCount} paid)
                        </span>
                    </div>
                    <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${collectedPct}%` }} />
                    </div>
                </div>
            </div>

            {/* Billing details info */}
            {collection.description && (
                <div className="rounded-[32px] bg-slate-50 p-6 ring-1 ring-slate-100">
                    <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Description</h4>
                    <p className="mt-2 text-sm leading-relaxed font-semibold text-slate-700">{collection.description}</p>
                </div>
            )}

            {/* Assignment Table */}
            <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900">Billing Directory</h2>

                <div className="overflow-hidden rounded-[32px] bg-white shadow-xs ring-1 ring-slate-100">
                    {assignments.length > 0 ? (
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Resident</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Property</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Amount Due
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</th>
                                    <th className="relative px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {assignments.map((asg) => (
                                    <tr key={asg.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-900">{asg.resident_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-500">{asg.property_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900">
                                                ₦{(asg.amount_due - asg.amount_paid).toLocaleString()}
                                                {asg.amount_paid > 0 && (
                                                    <span className="ml-1.5 text-xs font-bold text-slate-400">
                                                        (paid ₦{asg.amount_paid.toLocaleString()})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                                                    asg.status === 'paid'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : asg.status === 'partial'
                                                          ? 'bg-amber-100 text-amber-700'
                                                          : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {asg.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            {asg.status !== 'paid' && (
                                                <button
                                                    onClick={() => {
                                                        setRecordingAssignment(asg);
                                                        paymentForm.setData({
                                                            amount: String(asg.amount_due - asg.amount_paid),
                                                            reference: '',
                                                        });
                                                    }}
                                                    className="text-indigo-600 inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-black transition-colors hover:bg-indigo-100"
                                                >
                                                    Record Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 text-center text-sm font-bold text-slate-400">
                            No billing targets matched for this collection sheet.
                        </div>
                    )}
                </div>
            </div>

            {/* Record Payment Modal */}
            <AnimatePresence>
                {recordingAssignment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRecordingAssignment(null)}
                            className="bg-slate-900/60 absolute inset-0 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-slate-100 sm:p-8"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-950">Record Offline Payment</h3>
                                <button
                                    onClick={() => setRecordingAssignment(null)}
                                    className="hover:text-slate-700 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-50"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleRecordPayment} className="mt-6 space-y-4">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Resident</p>
                                    <p className="mt-0.5 text-sm font-black text-slate-900">{recordingAssignment.resident_name}</p>
                                    <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase">Outstanding balance</p>
                                    <p className="mt-0.5 text-sm font-black text-slate-900">
                                        ₦{(recordingAssignment.amount_due - recordingAssignment.amount_paid).toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="payment-amount" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                        Amount Received (₦)
                                    </label>
                                    <input
                                        type="number"
                                        id="payment-amount"
                                        required
                                        min="1"
                                        max={recordingAssignment.amount_due - recordingAssignment.amount_paid}
                                        value={paymentForm.data.amount}
                                        onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                        placeholder="Amount"
                                    />
                                    {paymentForm.errors.amount && <p className="mt-1 text-xs font-bold text-rose-600">{paymentForm.errors.amount}</p>}
                                </div>

                                <div>
                                    <label htmlFor="payment-reference" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                        Reference / Note <span className="font-normal text-slate-400">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="payment-reference"
                                        value={paymentForm.data.reference}
                                        onChange={(e) => paymentForm.setData('reference', e.target.value)}
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                        placeholder="e.g. Cash, Bank Transfer reference"
                                    />
                                    {paymentForm.errors.reference && (
                                        <p className="mt-1 text-xs font-bold text-rose-600">{paymentForm.errors.reference}</p>
                                    )}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setRecordingAssignment(null)}
                                        className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={paymentForm.processing}
                                        className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
                                    >
                                        {paymentForm.processing ? 'Recording...' : 'Record Payment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
