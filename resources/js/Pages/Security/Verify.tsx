import { Head, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ShieldX, User, Home as HomeIcon, Clock, Car, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import VerifyController from '@/actions/App/Http/Controllers/Security/VerifyController';
import SecurityLayout from '@/Layouts/SecurityLayout';

const CODE_LENGTH = 6;

type ValidationResult = {
    valid: boolean;
    status: string;
    message: string;
    visitor_name: string | null;
    host_name: string | null;
    purpose: string | null;
    expires_at: string | null;
    code_type: string | null;
    has_vehicle: boolean;
};

interface PageProps {
    estateName: string;
    gateName: string;
    flash?: {
        validation_result?: ValidationResult;
    };
    [key: string]: unknown;
}

function formatExpiry(iso: string | null) {
    if (!iso) return null;
    const date = new Date(iso);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return 'Expired';
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${mins}m`;
}

export default function SecurityVerify() {
    const { flash } = usePage<PageProps>().props;
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const submittedFor = useRef<string | null>(null);

    useEffect(() => {
        if (flash?.validation_result) {
            setResult(flash.validation_result);
            setSubmitting(false);
        }
    }, [flash?.validation_result]);

    useEffect(() => {
        if (!result) {
            const timer = setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [result]);

    const submit = useCallback((code: string) => {
        if (submittedFor.current === code) return;
        submittedFor.current = code;
        setSubmitting(true);
        router.post(
            VerifyController.validate.url(),
            { code },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    }, []);

    const updateDigit = (index: number, raw: string) => {
        const sanitized = raw
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, CODE_LENGTH);

        if (sanitized.length > 1) {
            const next = Array(CODE_LENGTH).fill('');
            for (let i = 0; i < Math.min(sanitized.length, CODE_LENGTH); i++) {
                next[i] = sanitized[i];
            }
            setDigits(next);
            const focusIndex = Math.min(sanitized.length, CODE_LENGTH - 1);
            inputsRef.current[focusIndex]?.focus();
            if (sanitized.length === CODE_LENGTH) {
                submit(next.join(''));
            }
            return;
        }

        const next = [...digits];
        next[index] = sanitized;
        setDigits(next);

        if (sanitized && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }

        if (next.every((d) => d.length === 1)) {
            submit(next.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
            const next = [...digits];
            next[index - 1] = '';
            setDigits(next);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputsRef.current[index - 1]?.focus();
            e.preventDefault();
        } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
            e.preventDefault();
        }
    };

    const reset = () => {
        setDigits(Array(CODE_LENGTH).fill(''));
        setResult(null);
        submittedFor.current = null;
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
    };

    const recordDecision = (decision: 'admit' | 'reject', extraData: any = {}) => {
        const code = submittedFor.current;
        if (!code) {
            reset();
            return;
        }
        router.post(VerifyController.decision.url(), { 
            decision, 
            code,
            ...extraData 
        }, { 
            preserveScroll: true, 
            onFinish: reset 
        });
    };

    return (
        <>
            <Head title="Verify Access · Security" />

            <main className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-8 pb-6 px-4 sm:px-8">
                <AnimatePresence mode="wait">
                    {result ? (
                        <ResultPanel
                            key="result"
                            result={result}
                            onAdmit={(data) => recordDecision('admit', data)}
                            onReject={(data) => recordDecision('reject', data)}
                            onReset={reset}
                        />
                    ) : (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-1 flex-col items-center justify-center pt-10"
                        >
                            <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Verification Terminal</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Enter Access Code</h1>

                            <div className="mt-12 flex items-center gap-2 sm:gap-4" role="group" aria-label="Access code">
                                {digits.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => {
                                            inputsRef.current[i] = el;
                                        }}
                                        value={digit}
                                        onChange={(e) => updateDigit(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        onFocus={(e) => e.currentTarget.select()}
                                        inputMode="text"
                                        autoCapitalize="characters"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        autoComplete="off"
                                        maxLength={CODE_LENGTH}
                                        disabled={submitting}
                                        className="h-16 w-12 rounded-2xl border-2 border-slate-200 bg-white text-center font-mono text-3xl font-black tracking-tight text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none disabled:opacity-60 sm:h-20 sm:w-16 sm:text-4xl"
                                        aria-label={`Code character ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <div className="mt-10 flex flex-col items-center gap-1">
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                        <span className="text-sm font-bold text-slate-500">Validating...</span>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-slate-400">Code validates automatically as you type</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}

SecurityVerify.layout = (page: React.ReactNode) => (
    <SecurityLayout variant="light">
        {page}
    </SecurityLayout>
);

type ResultPanelProps = {
    result: ValidationResult;
    onAdmit: (data?: any) => void;
    onReject: (data?: any) => void;
    onReset: () => void;
};

function ResultPanel({ result, onAdmit, onReject, onReset }: ResultPanelProps) {
    const valid = result.valid;
    const expiry = formatExpiry(result.expires_at);

    if (!valid) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center text-center pt-10"
            >
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-rose-50 text-rose-500 ring-4 ring-rose-500/5">
                    <ShieldX className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Invalid Code</h2>
                <p className="mt-3 text-lg font-medium text-slate-500 max-w-xs">{result.message}</p>
                
                <button
                    onClick={onReset}
                    className="mt-12 flex items-center gap-3 rounded-2xl bg-slate-100 px-8 py-4 text-sm font-black text-slate-900 transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Try another code
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-1 flex-col"
        >
            <div className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl">
                    <div className="flex flex-col items-center px-8 pt-12 pb-8">
                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/5">
                            <ShieldCheck className="h-12 w-12" strokeWidth={2} />
                        </div>
                        
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Access Granted</h2>
                        <div className="mt-2 text-center">
                            <p className="text-base font-medium text-slate-500">Visitor verification successful.</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/50 p-2">
                        <div className="divide-y divide-slate-100">
                            {result.visitor_name && (
                                <DetailRow 
                                    icon={<User className="h-5 w-5" strokeWidth={2} />} 
                                    label="Visitor" 
                                    value={result.visitor_name} 
                                />
                            )}
                            {result.host_name && (
                                <DetailRow 
                                    icon={<HomeIcon className="h-5 w-5" strokeWidth={2} />} 
                                    label="Host" 
                                    value={result.host_name} 
                                />
                            )}
                            {expiry && result.code_type !== 'long_lived' && (
                                <DetailRow 
                                    icon={<Clock className="h-5 w-5" strokeWidth={2} />} 
                                    label="Expires in" 
                                    value={expiry} 
                                />
                            )}
                        </div>
                    </div>

                    <div className="px-8 pt-8 pb-10">
                        <VehicleForm 
                            show={result.has_vehicle} 
                            onSubmit={(data) => onAdmit(data)} 
                        />

                        {!result.has_vehicle && (
                            <button
                                type="button"
                                onClick={() => onAdmit()}
                                className="w-full rounded-[1.25rem] bg-indigo-600 py-5 text-lg font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
                            >
                                Admit Visitor
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onReset}
                            className="mt-6 flex w-full items-center justify-center gap-3 text-sm font-black text-slate-400 transition-all hover:text-slate-600 active:scale-[0.98]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Verify another code
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function VehicleForm({ show, onSubmit }: { show: boolean; onSubmit: (data: any) => void }) {
    const [data, setData] = useState({
        vehicle_make: '',
        vehicle_model: '',
        vehicle_plate_number: '',
    });

    if (!show) return null;

    return (
        <div className="space-y-6 pt-2">
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-4">
                <div className="flex items-center gap-3 text-indigo-600">
                    <Car className="h-5 w-5" />
                    <p className="text-xs font-black uppercase tracking-widest">Vehicle Details Required</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Vehicle Make (e.g. Toyota)"
                        value={data.vehicle_make}
                        onChange={(e) => setData({ ...data, vehicle_make: e.target.value })}
                        className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Vehicle Model (e.g. Camry)"
                        value={data.vehicle_model}
                        onChange={(e) => setData({ ...data, vehicle_model: e.target.value })}
                        className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Plate Number"
                        value={data.vehicle_plate_number}
                        onChange={(e) => setData({ ...data, vehicle_plate_number: e.target.value })}
                        className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={() => onSubmit(data)}
                disabled={!data.vehicle_make || !data.vehicle_plate_number}
                className="w-full rounded-[1.25rem] bg-indigo-600 py-5 text-lg font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
                Admit with Vehicle
            </button>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{label}</p>
                <p className="truncate text-base font-bold text-slate-900 leading-tight">{value}</p>
            </div>
        </div>
    );
}
