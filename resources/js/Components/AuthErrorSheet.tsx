import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    error: string | null;
    onClose: () => void;
}

export default function AuthErrorSheet({ error, onClose }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    // A counter that bumps on every new error (even the same message) so
    // AnimatePresence remounts the sheet and replays the slide-up animation.
    const [sheetKey, setSheetKey] = useState(0);
    const prevError = useRef<string | null>(null);

    useEffect(() => {
        if (error) {
            // Always bump the key so the sheet re-animates, even for identical errors
            setSheetKey((k) => k + 1);
            setIsOpen(true);
            prevError.current = error;
        } else {
            setIsOpen(false);
        }
    }, [error]);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 300);
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key={`backdrop-${sheetKey}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden"
                    />

                    {/* Sheet */}
                    <motion.div
                        key={`sheet-${sheetKey}`}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-x-0 bottom-0 z-51 rounded-t-[32px] bg-white px-6 pt-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] lg:hidden"
                    >
                        {/* Drag Handle */}
                        <div className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-200" />

                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <AlertCircle className="h-8 w-8" />
                            </div>

                            <h3 className="mb-2 text-xl font-bold text-slate-900">Unable to sign in</h3>
                            <p className="mb-8 text-sm leading-relaxed text-slate-500">{error}</p>

                            <button
                                onClick={handleClose}
                                className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
