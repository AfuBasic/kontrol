import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import ApplicationForm from './ApplicationForm';
import SuccessState from './SuccessState';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

function FloatingShape({ className, delay = 0 }: { className: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5 }}
            className={className}
        />
    );
}

export default function ApplicationModal({ isOpen, onClose }: Props) {
    const [submitted, setSubmitted] = useState(false);
    const [estateName, setEstateName] = useState('');

    function handleSuccess(name: string) {
        setEstateName(name);
        setSubmitted(true);
    }

    function handleClose() {
        onClose();
        setTimeout(() => {
            setSubmitted(false);
            setEstateName('');
        }, 300);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 overflow-y-auto"
                    >
                        <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                                transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
                                className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
                            >
                                {/* Close Button - Always visible */}
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 z-20 rounded-full bg-white/90 p-2 text-slate-500 shadow-lg ring-1 ring-slate-900/5 backdrop-blur-sm transition-all hover:bg-white hover:text-slate-700 hover:shadow-xl"
                                >
                                    <X className="h-5 w-5" />
                                </button>

                                {/* Decorative Header */}
                                {!submitted && (
                                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pb-8 pt-12 sm:px-8">
                                        {/* Gradient orbs */}
                                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                            <FloatingShape
                                                delay={0.1}
                                                className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 blur-3xl"
                                            />
                                            <FloatingShape
                                                delay={0.2}
                                                className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 blur-3xl"
                                            />
                                            <FloatingShape
                                                delay={0.3}
                                                className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 blur-2xl"
                                            />
                                        </div>

                                        {/* Grid pattern overlay */}
                                        <div
                                            className="pointer-events-none absolute inset-0 opacity-[0.03]"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                            }}
                                        />

                                        {/* Content */}
                                        <div className="relative">
                                            {/* Badge */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20 backdrop-blur-sm"
                                            >
                                                <span className="flex h-2 w-2">
                                                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                                </span>
                                                <span className="text-xs font-medium text-white/90">100% Free Forever</span>
                                            </motion.div>

                                            {/* Title */}
                                            <motion.h2
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                                            >
                                                Get Your Estate on Kontrol
                                            </motion.h2>

                                            {/* Subtitle */}
                                            <motion.p
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="mt-2 text-base text-slate-300"
                                            >
                                                Join hundreds of estates using modern access control.
                                            </motion.p>

                                            {/* Trust indicators */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.35 }}
                                                className="mt-5 flex flex-wrap items-center gap-4 text-sm"
                                            >
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span>Setup in 48hrs</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span>No payment required</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span>Full support</span>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                )}

                                {/* Form Content - extra bottom padding on mobile for keyboard clearance */}
                                <div className="max-h-[55vh] overflow-y-auto px-6 pt-6 pb-24 sm:max-h-[60vh] sm:px-8 sm:pb-6">
                                    <AnimatePresence mode="wait">
                                        {submitted ? (
                                            <SuccessState key="success" estateName={estateName} />
                                        ) : (
                                            <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                                <ApplicationForm onSuccess={handleSuccess} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Footer */}
                                {!submitted && (
                                    <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:px-8">
                                        <p className="text-center text-xs text-slate-500">
                                            By applying, you agree to our{' '}
                                            <a href="/terms" className="font-medium text-slate-700 hover:text-slate-900 hover:underline">
                                                Terms
                                            </a>{' '}
                                            and{' '}
                                            <a href="/privacy" className="font-medium text-slate-700 hover:text-slate-900 hover:underline">
                                                Privacy Policy
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
