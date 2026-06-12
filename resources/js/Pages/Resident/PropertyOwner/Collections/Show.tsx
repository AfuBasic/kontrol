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
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { index, recordPayment } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';

function AnimatedNumber({ value }: { value: number }) {
    const motionValue = useMotionValue(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1], // ultra premium ease-out curve
            onUpdate: (latest) => {
                if (ref.current) {
                    ref.current.textContent = '₦' + Math.round(latest).toLocaleString();
                }
            }
        });
        return () => controls.stop();
    }, [value, motionValue]);

    return <span ref={ref}>₦0</span>;
}

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

            {/* Unified Premium Financial Overview Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-2xl shadow-indigo-950/20 border border-slate-900">
                {/* Background glow effects */}
                <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-600/10 blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Collection Progress</span>
                        <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black tracking-wider text-emerald-400 uppercase border border-emerald-500/20">
                                {collectedPct}% Collected ({paidBillsCount}/{totalBillsCount} paid)
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Collection Value</p>
                            <h2 className="mt-1 text-3xl font-black tracking-tight">
                                <AnimatedNumber value={Number(collected) + Number(outstanding)} />
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/50 px-3 py-1.5 border border-slate-800 text-[10px] font-bold text-slate-400">
                            <CalendarIcon className="h-4 w-4 text-indigo-400" />
                            <span>Due by {new Date(collection.due_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" 
                                initial={{ width: '0%' }}
                                animate={{ width: `${collectedPct}%` }}
                                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>

                    {/* Split details */}
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-900/60 pt-4">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Collected</span>
                            </div>
                            <p className="mt-1 text-base font-black text-white">
                                <AnimatedNumber value={Number(collected)} />
                            </p>
                        </div>
                        <div className="border-l border-slate-900/60 pl-4">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
                            </div>
                            <p className="mt-1 text-base font-black text-white">
                                <AnimatedNumber value={Number(outstanding)} />
                            </p>
                        </div>
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

            {/* Assignment List */}
            <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900">Billing Directory</h2>

                {assignments.length > 0 ? (
                    <div className="space-y-3">
                        {assignments.map((asg) => {
                            const unpaid = asg.amount_due - asg.amount_paid;
                            const initials = asg.resident_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                            
                            return (
                                <div 
                                    key={asg.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[2rem] bg-white p-5 shadow-xs ring-1 ring-slate-200/60 transition-all hover:shadow-md hover:ring-slate-300/80"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 font-black text-sm text-indigo-600 tracking-wider">
                                            {initials}
                                        </div>
                                        <div>
                                            <h4 className="font-black tracking-tight text-slate-900">{asg.resident_name}</h4>
                                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{asg.property_name || '—'}</p>
                                            
                                            {/* Date displays inside the cards */}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    <span>Due: {new Date(asg.due_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                                </span>
                                                {asg.paid_at && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                                                        <span>Paid: {new Date(asg.paid_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-50 pt-3 sm:border-t-0 sm:pt-0">
                                        <div className="sm:text-right">
                                            <p className="text-[9px] font-bold text-slate-440 uppercase tracking-wider">Amount Due</p>
                                            <p className="text-sm font-black text-slate-900">
                                                ₦{unpaid.toLocaleString()}
                                                {asg.amount_paid > 0 && (
                                                    <span className="ml-1 text-[10px] text-slate-400 font-semibold block sm:inline">
                                                        (paid ₦{asg.amount_paid.toLocaleString()})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase border ${
                                                    asg.status === 'paid'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250/20'
                                                        : asg.status === 'partial'
                                                          ? 'bg-amber-50 text-amber-700 border-amber-250/20'
                                                          : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                {asg.status}
                                            </span>
                                            {asg.status !== 'paid' && (
                                                <button
                                                    onClick={() => {
                                                        setRecordingAssignment(asg);
                                                        paymentForm.setData({
                                                            amount: String(asg.amount_due - asg.amount_paid),
                                                            reference: '',
                                                        });
                                                    }}
                                                    className="text-indigo-600 inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-black transition-all hover:bg-indigo-100 active:scale-95 cursor-pointer"
                                                >
                                                    Record
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-[32px] bg-white py-12 text-center shadow-xs ring-1 ring-slate-100 text-sm font-bold text-slate-400">
                        No billing targets matched for this collection sheet.
                    </div>
                )}
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
                                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
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
