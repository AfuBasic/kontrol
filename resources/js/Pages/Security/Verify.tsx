import { Head, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ShieldX, User, Home as HomeIcon, Clock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import VerifyController from '@/actions/App/Http/Controllers/Security/VerifyController';

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
            inputsRef.current[0]?.focus();
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

    const recordDecision = (decision: 'admit' | 'reject') => {
        const code = submittedFor.current;
        if (!code) {
            reset();
            return;
        }
        router.post(VerifyController.decision.url(), { decision, code }, { preserveScroll: true, onFinish: reset });
    };

    return (
        <>
            <Head title="Verify Access · Security" />

            <main className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-8 pb-6 sm:px-8">
                <AnimatePresence mode="wait">
                    {result ? (
                        <ResultPanel
                            key="result"
                            result={result}
                            onAdmit={() => recordDecision('admit')}
                            onReject={() => recordDecision('reject')}
                            onReset={reset}
                        />
                    ) : (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-1 flex-col items-center justify-center"
                        >
                            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Enter visitor access code</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Validate code</h1>

                            <div className="mt-8 flex items-center gap-2 sm:gap-3" role="group" aria-label="Access code">
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
                                        className="h-14 w-11 rounded-xl border border-slate-700 bg-slate-900/80 text-center font-mono text-2xl font-semibold tracking-tight text-white caret-emerald-400 shadow-inner shadow-black/30 transition-all focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-400/15 focus:outline-none disabled:opacity-60 sm:h-16 sm:w-14 sm:text-3xl"
                                        aria-label={`Code character ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <p className="mt-5 text-xs text-slate-500">{submitting ? 'Validating…' : 'Validates automatically · paste supported'}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}

// Set custom layout properties if needed (e.g., variant="dark")
SecurityVerify.layout = (page: React.ReactNode) => (
    <SecurityLayout variant="dark">
        {page}
    </SecurityLayout>
);

type ResultPanelProps = {
    result: ValidationResult;
    onAdmit: () => void;
    onReject: () => void;
    onReset: () => void;
};

function ResultPanel({ result, onReset }: ResultPanelProps) {
    const valid = result.valid;
    const expiry = formatExpiry(result.expires_at);

    if (!valid) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center text-center"
            >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
                    <ShieldX className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-white">Invalid Code</h2>
                <p className="mt-2 text-slate-400">{result.message}</p>
                <button
                    onClick={onReset}
                    className="mt-8 flex items-center gap-2 text-sm font-semibold text-rose-400 transition hover:text-rose-300"
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
                <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[#1F2937] bg-[#111827] shadow-2xl">
                    <div className="flex flex-col items-center px-8 pt-12 pb-8">
                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#10B981] text-[#10B981]">
                            <ShieldCheck className="h-12 w-12" strokeWidth={1.5} />
                        </div>
                        
                        <h2 className="text-3xl font-bold tracking-tight text-white">Code Valid</h2>
                        <div className="mt-3 text-center">
                            <p className="text-slate-400">The verification code is valid.</p>
                            <p className="text-slate-400">Access approved.</p>
                        </div>
                    </div>

                    <div className="border-t border-[#1F2937] p-2">
                        <div className="divide-y divide-[#1F2937]/50">
                            {result.host_name && (
                                <DetailRow 
                                    icon={<HomeIcon className="h-5 w-5" strokeWidth={1.5} />} 
                                    label="Host" 
                                    value={result.host_name} 
                                />
                            )}
                            {result.purpose && (
                                <DetailRow 
                                    icon={<User className="h-5 w-5" strokeWidth={1.5} />} 
                                    label="Purpose" 
                                    value={result.purpose} 
                                />
                            )}
                            {expiry && result.code_type !== 'long_lived' && (
                                <DetailRow 
                                    icon={<Clock className="h-5 w-5" strokeWidth={1.5} />} 
                                    label="Expires in" 
                                    value={expiry} 
                                />
                            )}
                        </div>
                    </div>

                    <div className="px-8 pt-6 pb-10">
                        <button
                            type="button"
                            onClick={onReset}
                            className="flex items-center gap-3 text-base font-semibold text-[#10B981] transition hover:opacity-80 active:scale-[0.98]"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Verify another code
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 text-slate-500">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{label}</p>
                <p className="truncate text-base font-semibold text-white">{value}</p>
            </div>
        </div>
    );
}
