import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function InstallPWABanner() {
    const { canPrompt, promptInstall, dismissPrompt } = usePWAInstall();

    if (!canPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
            >
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                            <Download className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900">Install Kontrol</h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Add to your home screen for quick access and a better experience.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={promptInstall}
                                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                                >
                                    Install App
                                </button>
                                <button
                                    onClick={dismissPrompt}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={dismissPrompt}
                            className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
