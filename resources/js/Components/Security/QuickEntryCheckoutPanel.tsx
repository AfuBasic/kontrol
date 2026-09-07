import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Clock,
    Loader2,
    LogOut,
    ShieldAlert,
    User,
    Building2,
    Car,
} from 'lucide-react';

const TAG_LENGTH = 4;

interface CheckoutResult {
    id: number;
    tag: string;
    visitor_name?: string;
    organization_name?: string;
    entry_point?: string;
    verified_at?: string;
    vehicle_plate_number?: string | null;
    checked_out_at?: string;
    duration_minutes?: number;
}

interface QuickEntryCheckoutPanelProps {
    gateName: string;
    isOnline: boolean;
}

export default function QuickEntryCheckoutPanel({
    gateName,
    isOnline,
}: QuickEntryCheckoutPanelProps) {
    const [digits, setDigits] = useState<string[]>(Array(TAG_LENGTH).fill(''));
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<CheckoutResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const updateDigit = (index: number, raw: string) => {
        const sanitized = raw
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, TAG_LENGTH);

        if (sanitized.length > 1) {
            const next = Array(TAG_LENGTH).fill('');
            for (let i = 0; i < Math.min(sanitized.length, TAG_LENGTH); i++) {
                next[i] = sanitized[i];
            }
            setDigits(next);
            const focusIndex = Math.min(sanitized.length, TAG_LENGTH - 1);
            inputsRef.current[focusIndex]?.focus();
            if (sanitized.length === TAG_LENGTH) {
                void handleCheckout(next.join(''));
            }
            return;
        }

        const next = [...digits];
        next[index] = sanitized;
        setDigits(next);

        if (sanitized && index < TAG_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }

        if (next.every((d) => d.length === 1)) {
            void handleCheckout(next.join(''));
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
        } else if (e.key === 'ArrowRight' && index < TAG_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
            e.preventDefault();
        }
    };

    const handleCheckout = async (tag: string) => {
        if (!tag || tag.length !== TAG_LENGTH) return;
        setSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await axios.post('/security/quick-entry/checkout', {
                tag,
            });

            if (res.data?.success) {
                const log = res.data.log;
                setResult({
                    id: log.id,
                    tag: log.meta?.tag || tag,
                    visitor_name: log.meta?.visitor_name || 'Visitor',
                    organization_name: log.meta?.organization_name || 'Organization',
                    entry_point: log.entry_point || 'Gate',
                    verified_at: log.verified_at,
                    vehicle_plate_number: log.vehicle_plate_number,
                    checked_out_at: log.checked_out_at || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    duration_minutes: log.meta?.duration_minutes ?? undefined,
                });
            } else {
                setErrorMessage(res.data?.message || 'Checkout failed.');
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setErrorMessage(err.response?.data?.message || "Tag not found or already checked out.");
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setDigits(Array(TAG_LENGTH).fill(''));
        setResult(null);
        setErrorMessage(null);
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
    };

    return (
        <div className="flex w-full flex-col items-center">
            <AnimatePresence mode="wait">
                {result ? (
                    <motion.div
                        key="checkout-result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/80 p-5 shadow-lg backdrop-blur-sm dark:border-emerald-500/20 dark:bg-emerald-950/30"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-xs font-black tracking-wider text-emerald-900 uppercase dark:text-emerald-300">
                                    Exit Recorded Successfully
                                </span>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    Tag {result.tag} Checked Out
                                </h3>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-white p-4 shadow-xs space-y-2.5 dark:bg-slate-900">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-500">Destination</span>
                                <span className="font-extrabold text-slate-900 dark:text-white">{result.organization_name}</span>
                            </div>
                            {result.visitor_name && result.visitor_name !== 'Visitor' && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Visitor</span>
                                    <span className="font-extrabold text-slate-900 dark:text-white">{result.visitor_name}</span>
                                </div>
                            )}
                            {result.vehicle_plate_number && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Vehicle</span>
                                    <span className="font-mono font-black text-slate-900 dark:text-white">{result.vehicle_plate_number}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 dark:border-slate-800">
                                <span className="font-semibold text-slate-500">Checked Out At</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{result.checked_out_at}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={reset}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-md transition-all active:scale-95 dark:bg-slate-100 dark:text-slate-900"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Check Out Next Visitor</span>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="checkout-input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex w-full flex-col items-center"
                    >
                        <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
                            Visitor Exit Gate
                        </p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Enter 4-Char Quick Tag
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Enter visitor's allocated tag to mark checkout
                        </p>

                        {/* 4 Digit Box Inputs */}
                        <div className="mt-8 flex items-center gap-3 sm:gap-4" role="group" aria-label="Quick Tag">
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
                                    maxLength={TAG_LENGTH}
                                    disabled={submitting}
                                    className="h-16 w-14 rounded-2xl border-2 border-slate-200 bg-white text-center font-mono text-3xl font-black tracking-tight text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:h-20 sm:w-16 sm:text-4xl"
                                    aria-label={`Tag character ${i + 1}`}
                                />
                            ))}
                        </div>

                        {errorMessage && (
                            <div className="mt-4 flex max-w-sm items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col items-center gap-1">
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                    <span className="text-sm font-bold text-slate-500">Checking out tag...</span>
                                </div>
                            ) : (
                                <p className="text-xs font-semibold text-slate-400">
                                    Tag checks out automatically upon 4th character
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
