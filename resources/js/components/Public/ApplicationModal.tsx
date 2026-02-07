import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import ApplicationForm from './ApplicationForm';
import SuccessState from './SuccessState';

interface Props {
    isOpen: boolean;
    onClose: () => void;
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
        // Reset state after animation
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
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Container - handles centering and scroll */}
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
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                                className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
                            >
                                {/* Header */}
                                <div className="relative border-b border-slate-100 px-5 py-4">
                                    {/* Close Button */}
                                    <button
                                        onClick={handleClose}
                                        className="absolute top-3 right-3 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>

                                    {!submitted && (
                                        <>
                                            <h2 className="text-lg font-bold text-slate-900">Apply for Access</h2>
                                            <p className="mt-0.5 pr-8 text-sm text-slate-500">
                                                Join estates using Kontrol for seamless access control.
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Content - constrained height on mobile */}
                                <div className="max-h-[60vh] overflow-y-auto px-5 py-4 sm:max-h-[65vh] sm:py-5">
                                    <AnimatePresence mode="wait">
                                        {submitted ? (
                                            <SuccessState key="success" estateName={estateName} />
                                        ) : (
                                            <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                                {/* Free Badge */}
                                                <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                                                        ✓
                                                    </div>
                                                    <span className="text-sm font-medium text-emerald-700">100% Free, No payment ever required</span>
                                                </div>

                                                <ApplicationForm onSuccess={handleSuccess} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Footer */}
                                {!submitted && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                                        <p className="text-center text-xs text-slate-400">
                                            By applying, you agree to our{' '}
                                            <a href="/terms" className="text-blue-500 hover:underline">
                                                Terms
                                            </a>{' '}
                                            and{' '}
                                            <a href="/privacy" className="text-blue-500 hover:underline">
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
