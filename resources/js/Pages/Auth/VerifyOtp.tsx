import LoginOtpController from '@/Actions/App/Http/Controllers/Auth/LoginOtpController';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
    email: string;
}

export default function VerifyOtp({ email }: Props) {
    const { flash } = usePage<{ flash: { status?: string } }>().props;
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        code: '',
    });

    const digits = data.code.padEnd(6, ' ').split('');

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleDigitChange = useCallback(
        (index: number, value: string) => {
            if (!/^\d?$/.test(value)) {
                return;
            }

            clearErrors('code');
            const newDigits = data.code.padEnd(6, ' ').split('');
            newDigits[index] = value || ' ';
            const newCode = newDigits.join('').replace(/ /g, '');
            setData('code', newCode);

            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        },
        [data.code, setData, clearErrors],
    );

    const handleKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        },
        [digits],
    );

    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

            if (pasted.length > 0) {
                setData('code', pasted);
                const focusIndex = Math.min(pasted.length, 5);
                inputRefs.current[focusIndex]?.focus();
            }
        },
        [setData],
    );

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(LoginOtpController.verify.url());
    }

    function handleResend() {
        if (resendCooldown > 0) {
            return;
        }

        router.post(
            LoginOtpController.resend.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setResendCooldown(60),
            },
        );
    }

    return (
        <>
            <Head title="Verify your identity" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
                    <div className="rounded-2xl bg-white px-8 py-10 shadow-xl shadow-gray-200/50">
                        {/* Icon */}
                        <div className="mb-6 flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1F6FDB]/10">
                                <svg className="h-8 w-8 text-[#1F6FDB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <h2 className="mb-2 text-center text-2xl font-semibold text-gray-900">Verify your identity</h2>
                        <p className="mb-8 text-center text-sm text-gray-500">
                            We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
                        </p>

                        {flash?.status && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{flash.status}</div>}

                        <form onSubmit={submit}>
                            {/* OTP Input Boxes */}
                            <div className="mb-6 flex justify-center gap-3" onPaste={handlePaste}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => {
                                            inputRefs.current[i] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digits[i]?.trim() || ''}
                                        onChange={(e) => handleDigitChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className={`h-14 w-12 rounded-xl border text-center text-xl font-semibold transition-all focus:border-[#1F6FDB] focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none ${
                                            errors.code ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'
                                        }`}
                                        autoComplete="one-time-code"
                                    />
                                ))}
                            </div>

                            {errors.code && <p className="mb-4 text-center text-sm text-red-600">{errors.code}</p>}

                            <button
                                type="submit"
                                disabled={processing || data.code.length < 6}
                                className="w-full rounded-xl bg-[#1F6FDB] px-4 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#1F6FDB]/25 transition-all hover:bg-[#0A3D91] hover:shadow-[#0A3D91]/25 focus:ring-2 focus:ring-[#1F6FDB] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify & sign in'
                                )}
                            </button>
                        </form>

                        {/* Resend */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                {"Didn't receive the code? "}
                                {resendCooldown > 0 ? (
                                    <span className="text-gray-400">Resend in {resendCooldown}s</span>
                                ) : (
                                    <button type="button" onClick={handleResend} className="font-medium text-[#1F6FDB] hover:underline">
                                        Resend code
                                    </button>
                                )}
                            </p>
                        </div>

                        {/* Back to login */}
                        <div className="mt-4 text-center">
                            <a href="/login" className="text-sm text-gray-400 hover:text-gray-600">
                                Back to sign in
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
