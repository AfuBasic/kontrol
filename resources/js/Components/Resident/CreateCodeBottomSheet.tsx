import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, User, Phone, MessageSquare, Clock, ShieldCheck, Zap } from 'lucide-react';
import { router, useForm, usePage } from '@inertiajs/react';
import AccessCodeController from '@/actions/App/Http/Controllers/Resident/AccessCodeController';
import type { SharedData } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'type' | 'details' | 'duration';

const purposes = [
    { id: 'Guest', icon: User },
    { id: 'Delivery', icon: Zap },
    { id: 'Service', icon: ShieldCheck },
    { id: 'Emergency', icon: Zap },
];

export default function CreateCodeBottomSheet({ isOpen, onClose }: Props) {
    const { auth, access_code_durations, access_code_constraints } = usePage<SharedData>().props;
    const [step, setStep] = useState<Step>('type');
    const form = useForm({
        type: 'single_use' as 'single_use' | 'long_lived',
        visitor_name: '',
        visitor_phone: '',
        purpose: 'Guest',
        duration_minutes: access_code_durations?.[0]?.minutes || access_code_constraints?.min || 60,
    });

    const resetAndClose = () => {
        setStep('type');
        form.reset();
        onClose();
    };

    const submit = () => {
        form.post(AccessCodeController.store.url(), {
            onSuccess: () => {
                resetAndClose();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={resetAndClose}
                        className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-lg overflow-hidden rounded-t-[40px] bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="relative border-b border-slate-100 p-6">
                            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black tracking-tight text-slate-900">
                                    {step === 'type' ? 'Select Type' : step === 'details' ? 'Visitor Details' : 'Set Duration'}
                                </h2>
                                <button onClick={resetAndClose} className="rounded-full bg-slate-100 p-2 text-slate-500 active:scale-90">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {auth?.user?.resident_subscription?.status === 'past_due' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center py-8"
                                >
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600 mb-6">
                                        <ShieldCheck className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3">Access Restricted</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed mb-10 px-4">
                                        Your subscription for this estate is currently inactive. Please visit the Kontrol web platform to manage your access.
                                    </p>
                                    <button 
                                        onClick={resetAndClose}
                                        className="w-full rounded-[28px] bg-slate-900 py-5 text-lg font-black text-white shadow-xl transition-all active:scale-95"
                                    >
                                        Got it
                                    </button>
                                </motion.div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    {step === 'type' && (
                                        <motion.div
                                            key="step-type"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid gap-4">
                                                <button
                                                    onClick={() => form.setData('type', 'single_use')}
                                                    className={`flex items-center justify-between rounded-3xl border p-6 transition-all active:scale-[0.98] ${
                                                        form.data.type === 'single_use' 
                                                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20' 
                                                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${form.data.type === 'single_use' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
                                                            <Zap className="h-7 w-7" />
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${form.data.type === 'single_use' ? 'text-indigo-900' : 'text-slate-900'}`}>One-Time Visit</p>
                                                            <p className="text-sm font-medium text-slate-500">Perfect for guests & deliveries</p>
                                                        </div>
                                                    </div>
                                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${form.data.type === 'single_use' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>
                                                        {form.data.type === 'single_use' && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => form.setData('type', 'long_lived')}
                                                    className={`flex items-center justify-between rounded-3xl border p-6 transition-all active:scale-[0.98] ${
                                                        form.data.type === 'long_lived' 
                                                            ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20' 
                                                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${form.data.type === 'long_lived' ? 'bg-amber-600 text-white' : 'bg-white text-amber-600'}`}>
                                                            <Clock className="h-7 w-7" />
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${form.data.type === 'long_lived' ? 'text-amber-900' : 'text-slate-900'}`}>Long-Term Access</p>
                                                            <p className="text-sm font-medium text-slate-500">For regular staff or family</p>
                                                        </div>
                                                    </div>
                                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${form.data.type === 'long_lived' ? 'border-amber-600 bg-amber-600' : 'border-slate-200'}`}>
                                                        {form.data.type === 'long_lived' && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="pt-4">
                                                <p className="mb-4 text-xs font-black tracking-widest text-slate-400 uppercase">Popular Purposes</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {purposes.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => form.setData('purpose', p.id)}
                                                            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                                                                form.data.purpose === p.id 
                                                                    ? 'bg-slate-900 text-white shadow-lg' 
                                                                    : 'bg-slate-50 text-slate-600 ring-1 ring-slate-100'
                                                            }`}
                                                        >
                                                            <p.icon className="h-4 w-4" />
                                                            {p.id}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-6">
                                                <button 
                                                    onClick={() => setStep('details')}
                                                    className="w-full rounded-[28px] bg-slate-900 py-5 text-lg font-black text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95"
                                                >
                                                    Continue
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 'details' && (
                                        <motion.div
                                            key="step-details"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <User className="absolute top-4.5 left-5 h-5 w-5 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Visitor Name"
                                                        value={form.data.visitor_name}
                                                        onChange={e => form.setData('visitor_name', e.target.value)}
                                                        className="w-full rounded-2xl bg-slate-50 py-4.5 pl-14 pr-6 font-bold text-slate-900 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Phone className="absolute top-4.5 left-5 h-5 w-5 text-slate-400" />
                                                    <input
                                                        type="tel"
                                                        placeholder="Phone Number (Optional)"
                                                        value={form.data.visitor_phone}
                                                        onChange={e => form.setData('visitor_phone', e.target.value)}
                                                        className="w-full rounded-2xl bg-slate-50 py-4.5 pl-14 pr-6 font-bold text-slate-900 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => setStep('type')}
                                                    className="flex-1 rounded-2xl bg-slate-100 py-4.5 font-black text-slate-600 transition-all active:scale-95"
                                                >
                                                    Back
                                                </button>
                                                <button 
                                                    onClick={() => setStep('duration')}
                                                    className="flex-[2] rounded-2xl bg-slate-900 py-4.5 font-black text-white shadow-xl transition-all active:scale-95"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 'duration' && (
                                        <motion.div
                                            key="step-duration"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                {(usePage().props as unknown as SharedData).access_code_durations.map((d) => (
                                                    <button
                                                        key={d.minutes}
                                                        onClick={() => form.setData('duration_minutes', d.minutes)}
                                                        className={`rounded-3xl p-6 text-center transition-all ${
                                                            form.data.duration_minutes === d.minutes
                                                                ? 'bg-indigo-600 text-white shadow-xl ring-4 ring-indigo-500/20'
                                                                : 'bg-slate-50 text-slate-900 ring-1 ring-slate-100'
                                                        }`}
                                                    >
                                                        <p className="text-xl font-black">{d.label}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-4">
                                                <button 
                                                    onClick={submit}
                                                    disabled={form.processing}
                                                    className="flex w-full items-center justify-center gap-3 rounded-[28px] bg-linear-to-br from-indigo-500 to-indigo-700 py-6 text-xl font-black text-white shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {form.processing ? 'Generating...' : 'Generate Access Code'}
                                                </button>
                                                <button 
                                                    onClick={() => setStep('details')}
                                                    className="w-full py-2 text-sm font-bold text-slate-400"
                                                >
                                                    Go Back
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Safe area spacer */}
                        <div className="h-10" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
