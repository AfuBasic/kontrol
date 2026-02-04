import { useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldX, User, Clock, Home as HomeIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SecurityLayout from '@/layouts/SecurityLayout';
import HomeController from '@/actions/App/Http/Controllers/Security/HomeController';

interface ValidationResult {
    valid: boolean;
    status: string;
    message: string;
    visitor_name: string | null;
    host_name: string | null;
    purpose: string | null;
    expires_at: string | null;
    code_type: string | null;
}

interface PageProps {
    estateName: string;
    flash?: {
        validation_result?: ValidationResult;
    };
    [key: string]: unknown;
}

export default function SecurityHome() {
    const { estateName, flash } = usePage<PageProps>().props;
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        code: '',
    });

    // Handle flash validation result
    useEffect(() => {
        if (flash?.validation_result) {
            setValidationResult(flash.validation_result);
            reset('code');

            // Auto-clear result after 8 seconds for continuous workflow
            const timer = setTimeout(() => {
                handleReset();
            }, 8000);

            return () => clearTimeout(timer);
        }
    }, [flash?.validation_result]);

    // Auto-focus input on mount and after validation
    useEffect(() => {
        if (!validationResult && inputRef.current) {
            inputRef.current.focus();
        }
    }, [validationResult]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.code.trim()) return;

        post(HomeController.validate.url(), {
            preserveScroll: true,
        });
    }

    function handleReset() {
        setValidationResult(null);
        reset('code');
        setTimeout(() => inputRef.current?.focus(), 100);
    }

    function formatTime(dateString: string | null) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function getStatusMessage(result: ValidationResult): string {
        if (result.valid) {
            return result.code_type === 'long_lived' ? 'Permanent Access' : 'Access Granted';
        }

        switch (result.status) {
            case 'not_found':
                return 'Code Not Found';
            case 'already_used':
                return 'Already Used';
            case 'expired':
                return 'Code Expired';
            case 'revoked':
                return 'Code Revoked';
            default:
                return 'Access Denied';
        }
    }

    return (
        <SecurityLayout>
            <div className="flex min-h-[calc(100vh-180px)] flex-col">
                <AnimatePresence mode="wait">
                    {!validationResult ? (
                        // Input Screen
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-1 flex-col items-center justify-center px-2"
                        >
                            {/* App Logo */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="mb-8"
                            >
                                <img
                                    src="/assets/images/icon.png"
                                    alt="Kontrol"
                                    className="h-20 w-20 object-contain"
                                />
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="mb-2 text-center text-2xl font-bold text-slate-900"
                            >
                                Verify Access
                            </motion.h1>
                            <motion.p
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                                className="mb-8 text-center text-sm text-slate-500"
                            >
                                Enter the visitor's access code
                            </motion.p>

                            {/* Input Form */}
                            <motion.form
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                onSubmit={handleSubmit}
                                className="w-full max-w-sm"
                            >
                                <div className="relative mb-4">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-5 text-center text-3xl font-bold tracking-[0.3em] text-slate-900 placeholder-slate-300 transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                                        maxLength={6}
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    {data.code && (
                                        <button
                                            type="button"
                                            onClick={() => setData('code', '')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>

                                {errors.code && (
                                    <p className="mb-4 text-center text-sm text-red-500">{errors.code}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || data.code.length < 4}
                                    className="w-full rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 py-4 text-lg font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/40 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Validating...
                                        </span>
                                    ) : (
                                        'Validate Code'
                                    )}
                                </button>
                            </motion.form>
                        </motion.div>
                    ) : (
                        // Result Screen
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-1 flex-col items-center justify-center px-2"
                        >
                            {/* Status Card */}
                            <div
                                className={`mb-6 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl ${
                                    validationResult.valid
                                        ? 'bg-linear-to-br from-emerald-500 to-green-600 shadow-emerald-500/30'
                                        : 'bg-linear-to-br from-red-500 to-rose-600 shadow-red-500/30'
                                }`}
                            >
                                {/* Status Header */}
                                <div className="px-6 pt-8 pb-6 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                                    >
                                        {validationResult.valid ? (
                                            <ShieldCheck className="h-10 w-10 text-white" strokeWidth={2} />
                                        ) : (
                                            <ShieldX className="h-10 w-10 text-white" strokeWidth={2} />
                                        )}
                                    </motion.div>
                                    <motion.h2
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-2xl font-bold text-white"
                                    >
                                        {getStatusMessage(validationResult)}
                                    </motion.h2>
                                    {!validationResult.valid && (
                                        <motion.p
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.25 }}
                                            className="mt-1 text-sm text-white/80"
                                        >
                                            {validationResult.message}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Details Section */}
                                {(validationResult.visitor_name || validationResult.host_name) && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-white px-6 py-5"
                                    >
                                        <div className="space-y-4">
                                            {validationResult.visitor_name && (
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                                        <User className="h-5 w-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Visitor</p>
                                                        <p className="text-lg font-semibold text-slate-900">{validationResult.visitor_name}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {validationResult.host_name && (
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                                        <HomeIcon className="h-5 w-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Host</p>
                                                        <p className="text-lg font-semibold text-slate-900">{validationResult.host_name}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {validationResult.purpose && (
                                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Purpose</p>
                                                    <p className="mt-0.5 text-sm text-slate-700">{validationResult.purpose}</p>
                                                </div>
                                            )}

                                            {validationResult.expires_at && validationResult.code_type !== 'long_lived' && (
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Valid until {formatTime(validationResult.expires_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Next Button */}
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                onClick={handleReset}
                                className="w-full max-w-sm rounded-2xl border-2 border-slate-200 bg-white py-4 text-lg font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                            >
                                Scan Next Visitor
                            </motion.button>

                            {/* Auto-dismiss indicator */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-4 text-xs text-slate-400"
                            >
                                Auto-resetting in a few seconds...
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SecurityLayout>
    );
}
