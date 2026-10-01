import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import React from 'react';
import { useExternalBilling } from '@/Hooks/useExternalBilling';

interface SubscriptionGateSheetProps {
    open: boolean;
    onClose: () => void;
}

export default function SubscriptionGateSheet({ open, onClose }: SubscriptionGateSheetProps) {
    const { openExternalBilling } = useExternalBilling();

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        key="sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white px-6 pt-5 shadow-2xl"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
                    >
                        {/* Handle */}
                        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200" />

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Icon */}
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
                            <AlertCircle className="h-7 w-7 text-rose-500" strokeWidth={2} />
                        </div>

                        {/* Text */}
                        <h2 className="text-[20px] font-black tracking-tight text-slate-900">Access Limited</h2>
                        <p className="mt-2 text-[14px] leading-relaxed font-medium text-slate-500">
                            Your subscription is inactive. Settle your account to create passes, invite visitors, and manage members.
                        </p>

                        {/* Actions */}
                        <div className="mt-7 space-y-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    openExternalBilling();
                                }}
                                className="flex w-full items-center justify-center rounded-2xl bg-slate-900 py-4 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all active:scale-[0.98]"
                            >
                                Settle Account
                            </button>
                            <button
                                onClick={onClose}
                                className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-4 text-[15px] font-semibold text-slate-700 transition-all active:scale-[0.98]"
                            >
                                Not Now
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
