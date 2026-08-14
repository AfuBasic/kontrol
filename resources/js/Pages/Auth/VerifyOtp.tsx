import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, Check, ShieldCheck } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as LoginOtpController from '@/actions/App/Http/Controllers/Auth/LoginOtpController';

interface Props {
    email: string;
}

export default function VerifyOtp({ email }: Props) {
    const { flash } = usePage<{ flash: { status?: string; error?: string } }>().props;
    const [resendCooldown, setResendCooldown] = useState(30);
    const [isResending, setIsResending] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { data, setData, setError, clearErrors, errors, processing } = useForm({
        code: '',
    });

    const digits = data.code.padEnd(6, ' ').split('');

    // Force background color matching modern dark ambient aesthetic
    useEffect(() => {
        const originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#020617';

        // Auto-focus first input on page load
        const focusTimer = setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);

        return () => {
            document.body.style.backgroundColor = originalBg;
            clearTimeout(focusTimer);
        };
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Format timer as 00:30
    const formattedTimer = `00:${resendCooldown.toString().padStart(2, '0')}`;

    // Mask email for privacy/security display
    const maskedEmail = React.useMemo(() => {
        if (!email || !email.includes('@')) return email || '';
        const [local, domain] = email.split('@');
        if (local.length <= 2) return `${local[0]}*@${domain}`;
        return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
    }, [email]);

    // Trigger verification submission with explicit 6-digit payload
    const submitVerification = useCallback(
        (codeToSubmit: string) => {
            if (processing || isAutoSubmitting || codeToSubmit.length !== 6) return;

            setIsAutoSubmitting(true);
            clearErrors('code');

            router.post(
                LoginOtpController.verify.url(),
                { code: codeToSubmit },
                {
                    preserveScroll: true,
                    onError: (errs) => {
                        setIsAutoSubmitting(false);
                        setIsShaking(true);
                        if (errs.code) {
                            setError('code', errs.code);
                        }
                        setTimeout(() => setIsShaking(false), 600);
                        // Select first input to make correction effortless
                        inputRefs.current[0]?.focus();
                    },
                    onFinish: () => {
                        setIsAutoSubmitting(false);
                    },
                },
            );
        },
        [processing, isAutoSubmitting, clearErrors, setError],
    );

    const handleDigitChange = useCallback(
        (index: number, value: string) => {
            if (!/^\d?$/.test(value)) return;

            clearErrors('code');
            const newDigits = data.code.padEnd(6, ' ').split('');
            newDigits[index] = value || ' ';
            const newCode = newDigits.join('').replace(/ /g, '');
            setData('code', newCode);

            // Move focus to next input
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }

            // Automatic verification on 6th digit entry
            if (newCode.length === 6 && !processing) {
                submitVerification(newCode);
            }
        },
        [data.code, setData, clearErrors, processing, submitVerification],
    );

    const handleKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace') {
                if (!digits[index]?.trim() && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                e.preventDefault();
                inputRefs.current[index - 1]?.focus();
            } else if (e.key === 'ArrowRight' && index < 5) {
                e.preventDefault();
                inputRefs.current[index + 1]?.focus();
            }
        },
        [digits],
    );

    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

            if (pasted.length > 0) {
                clearErrors('code');
                setData('code', pasted);
                const focusIndex = Math.min(pasted.length, 5);
                inputRefs.current[focusIndex]?.focus();

                if (pasted.length === 6 && !processing) {
                    submitVerification(pasted);
                }
            }
        },
        [setData, clearErrors, processing, submitVerification],
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.code.length === 6) {
            submitVerification(data.code);
        }
    };

    const handleResend = () => {
        if (resendCooldown > 0 || isSubmitting || isResending) return;

        setIsResending(true);
        router.post(
            LoginOtpController.resend.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResendCooldown(30);
                    clearErrors('code');
                },
                onFinish: () => {
                    setIsResending(false);
                },
            },
        );
    };

    const isSubmitting = processing || isAutoSubmitting;

    return (
        <>
            <Head title="Verify Your Identity - Kontrol" />

            <div className="relative flex min-h-[100dvh] flex-col justify-between bg-[#020617] font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-white">
                {/* Ambient Depth & Glow Background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/12 blur-[140px]" />
                    <div className="absolute bottom-10 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-purple-600/08 blur-[120px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
                </div>

                {/* Top Brand Header */}
                <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
                    <Link href="/login" className="group flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Back to sign in</span>
                    </Link>
                </header>

                {/* Main Card Container */}
                <main className="relative z-10 mx-auto my-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-6 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={
                            isShaking
                                ? { x: [-8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.5 } }
                                : { opacity: 1, y: 0, scale: 1 }
                        }
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-[32px] border border-slate-800/80 bg-slate-900/80 p-7 shadow-2xl shadow-slate-950/80 backdrop-blur-xl sm:p-9"
                    >
                        {/* Official Kontrol Logo */}
                        <div className="mb-6 flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-500/15 to-indigo-600/05 p-2.5 shadow-xl shadow-indigo-500/10 backdrop-blur-sm">
                                <img src="/assets/images/app-icon.png" alt="Kontrol Icon" className="h-full w-full object-contain rounded-xl" />
                            </div>
                        </div>

                        {/* Title & Hierarchy */}
                        <div className="text-center">
                            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Verify your identity</h1>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">Almost there</p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                We&apos;ve sent a secure 6-digit verification code to
                                <br />
                                <span className="mt-1 inline-block rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-200 tracking-wide">
                                    {maskedEmail}
                                </span>
                            </p>
                        </div>

                        {/* Flash Status Messages */}
                        <AnimatePresence>
                            {flash?.status && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs font-medium text-emerald-300"
                                >
                                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>{flash.status}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Banner */}
                        <AnimatePresence>
                            {errors.code && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-2.5 text-xs font-medium text-rose-300"
                                >
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                    <span>{errors.code}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form & OTP Input Grid */}
                        <form onSubmit={handleSubmit} className="mt-7">
                            <div className="flex justify-between gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const hasValue = !!digits[i]?.trim();
                                    return (
                                        <input
                                            key={i}
                                            ref={(el) => {
                                                inputRefs.current[i] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={1}
                                            value={digits[i]?.trim() || ''}
                                            onChange={(e) => handleDigitChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            disabled={isSubmitting}
                                            className={`h-13 w-11 sm:h-14 sm:w-12 rounded-2xl border text-center text-xl font-extrabold text-white transition-all duration-200 focus:outline-none ${
                                                errors.code
                                                    ? 'border-rose-500/50 bg-rose-950/20 text-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
                                                    : hasValue
                                                      ? 'border-indigo-500/60 bg-indigo-950/25 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                                                      : 'border-slate-800 bg-slate-950/60 focus:border-indigo-500 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/15'
                                            }`}
                                            autoComplete="one-time-code"
                                            aria-label={`Digit ${i + 1} of verification code`}
                                        />
                                    );
                                })}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || data.code.length < 6}
                                className="mt-7 flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-4 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/25 transition-all duration-200 hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        <span>Verifying identity...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <span>Verify & continue</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Resend Experience */}
                        <div className="mt-7 text-center">
                            <p className="text-xs text-slate-400">
                                Didn&apos;t receive the code?{' '}
                                {isResending ? (
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-400">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Sending code...</span>
                                    </span>
                                ) : resendCooldown > 0 ? (
                                    <span className="font-semibold text-slate-300 tabular-nums">
                                        Resend in <span className="text-indigo-400">{formattedTimer}</span>
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isSubmitting || isResending}
                                        className="font-bold text-indigo-400 transition-colors hover:text-indigo-300 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Resend code
                                    </button>
                                )}
                            </p>
                        </div>
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5 text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                        <span>256-bit Encrypted Identity Verification</span>
                    </div>
                    © 2026 Kontrol. All rights reserved.
                </footer>
            </div>
        </>
    );
}
