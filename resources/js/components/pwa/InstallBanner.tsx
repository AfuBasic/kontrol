import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface InstallBannerProps {
    onInstallClick: () => void;
}

export default function InstallBanner({ onInstallClick }: InstallBannerProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const isStandalone = false;
        // window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;

        if (isStandalone) return;

        // Check if mobile device
        const isMobile = true; //iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            if (Date.now() - dismissedTime < DISMISSED_DURATION) {
                return;
            }
            localStorage.removeItem(DISMISSED_KEY);
        }

        // Show after delay for better UX
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    function handleDismiss() {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        setIsVisible(false);
    }

    function handleInstall() {
        onInstallClick();
        setIsVisible(false);
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="fixed right-4 bottom-20 left-4 z-40 mx-auto max-w-sm"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 shadow-gray-900/10 ring-gray-900/5">
                        {/* Gradient accent */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500" />

                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="p-4 pt-5">
                            <div className="flex items-start gap-3.5">
                                {/* App Icon */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                                    <Download className="h-6 w-6 text-white" />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1 pr-6">
                                    <h3 className="text-[15px] font-semibold text-gray-900">Install Kontrol</h3>
                                    <p className="mt-0.5 text-[13px] leading-snug text-gray-500">Add to home screen for faster access</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex items-center gap-3">
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                                >
                                    Download App
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
