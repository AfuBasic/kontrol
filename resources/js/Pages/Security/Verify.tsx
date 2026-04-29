import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ShieldX, User, Home as HomeIcon, Clock, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import HomeController from '@/actions/App/Http/Controllers/Security/HomeController';
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

const STATUS_LABELS: Record<string, string> = {
    granted: 'Valid · Let in',
    not_found: 'Code not found',
    already_used: 'Already used',
    expired: 'Expired',
    revoked: 'Revoked',
    inactive: 'Inactive',
};

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

function formatClock() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SecurityVerify() {
    const { estateName, gateName, flash } = usePage<PageProps>().props;
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [clock, setClock] = useState(formatClock());
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const submittedFor = useRef<string | null>(null);

    useEffect(() => {
        const t = setInterval(() => setClock(formatClock()), 30000);
        return () => clearInterval(t);
    }, []);

    // Match the OS status bar to the dark terminal chrome.
    // Native: light icons via Capacitor StatusBar.
    // Web: <meta name="theme-color"> is handled in <Head>.
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        return () => {
            StatusBar.setStyle({ style: Style.Light }).catch(() => {});
        };
    }, []);

    const goBack = useCallback(() => {
        router.visit(HomeController.url());
    }, []);

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
        router.post(VerifyController.validate.url(), { code }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
        });
    }, []);

    const updateDigit = (index: number, raw: string) => {
        const sanitized = raw
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, CODE_LENGTH);

        if (sanitized.length > 1) {
            // Paste handling — distribute across boxes
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
        router.post(
            VerifyController.decision.url(),
            { decision, code },
            { preserveScroll: true, onFinish: reset },
        );
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            <Head title="Verify Access · Security">
                <meta name="theme-color" content="#020617" />
            </Head>

            {/* Terminal header — pt-safe is on the header itself so the safe-area
                inset is part of its own height. The status bar overlays this padded
                strip and our slate-950 chrome shows through behind it. */}
            <header className="pt-safe sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
                    <button
                        onClick={goBack}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        aria-label="Back to command center"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Security Terminal</p>
                        <p className="truncate text-sm font-semibold text-white">
                            {gateName} <span className="text-slate-500">·</span>{' '}
                            <span className="font-normal text-slate-400">{estateName}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-300">{clock}</span>
                    </div>
                </div>
            </header>

            <main className="pb-safe mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-8 pb-6 sm:px-8">
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
                                        className="h-14 w-11 rounded-xl border border-slate-700 bg-slate-900/80 text-center font-mono text-2xl font-semibold tracking-tight text-white shadow-inner shadow-black/30 caret-emerald-400 transition-all focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-400/15 focus:outline-none disabled:opacity-60 sm:h-16 sm:w-14 sm:text-3xl"
                                        aria-label={`Code character ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <p className="mt-5 text-xs text-slate-500">
                                {submitting ? 'Validating…' : 'Validates automatically · paste supported'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

type ResultPanelProps = {
    result: ValidationResult;
    onAdmit: () => void;
    onReject: () => void;
    onReset: () => void;
};

function ResultPanel({ result, onAdmit, onReject, onReset }: ResultPanelProps) {
    const valid = result.valid;
    const accent = valid
        ? { bar: 'bg-emerald-400', surface: 'bg-emerald-500/10 border-emerald-400/40', icon: 'text-emerald-400', headline: 'text-emerald-300' }
        : { bar: 'bg-rose-400', surface: 'bg-rose-500/10 border-rose-400/40', icon: 'text-rose-400', headline: 'text-rose-300' };

    const headline = STATUS_LABELS[result.status] ?? (valid ? 'Valid' : 'Invalid code');
    const expiry = formatExpiry(result.expires_at);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col"
            role="status"
            aria-live="polite"
        >
            <div className={`overflow-hidden rounded-2xl border ${accent.surface}`}>
                <div className={`h-1 w-full ${accent.bar}`} />
                <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900/60 ${accent.icon}`}>
                        {valid ? (
                            <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                        ) : (
                            <ShieldX className="h-5 w-5" strokeWidth={2.2} />
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold tracking-[0.16em] uppercase ${accent.headline}`}>
                            {valid ? 'Valid' : 'Invalid'}
                        </p>
                        <p className="truncate text-base font-semibold text-white">{headline}</p>
                    </div>
                </div>

                {valid && (result.visitor_name || result.host_name) && (
                    <div className="grid grid-cols-1 gap-px bg-slate-800/80 sm:grid-cols-2">
                        {result.visitor_name && (
                            <DetailRow icon={<User className="h-4 w-4" strokeWidth={2.2} />} label="Visitor" value={result.visitor_name} />
                        )}
                        {result.host_name && (
                            <DetailRow icon={<HomeIcon className="h-4 w-4" strokeWidth={2.2} />} label="Host" value={result.host_name} />
                        )}
                        {result.purpose && (
                            <DetailRow label="Purpose" value={result.purpose} className="sm:col-span-2" />
                        )}
                        {expiry && result.code_type !== 'long_lived' && (
                            <DetailRow icon={<Clock className="h-4 w-4" strokeWidth={2.2} />} label="Expires in" value={expiry} className="sm:col-span-2" />
                        )}
                    </div>
                )}

                {!valid && (
                    <div className="border-t border-slate-800/60 bg-slate-900/40 px-5 py-3 text-sm text-slate-300 sm:px-6">{result.message}</div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onReset}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.99] ${
                            valid ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
                        {valid ? 'Verify another' : 'Try again'}
                    </button>
            </div>
        </motion.div>
    );
}

function DetailRow({
    icon,
    label,
    value,
    className,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-3 bg-slate-900/40 px-5 py-3 sm:px-6 ${className ?? ''}`}>
            {icon && <span className="text-slate-500">{icon}</span>}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">{label}</p>
                <p className="truncate text-sm font-semibold text-white">{value}</p>
            </div>
        </div>
    );
}
