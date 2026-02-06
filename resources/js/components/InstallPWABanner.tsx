import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InstallModal } from '@/components/pwa';

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function InstallPWABanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Don't show if already in standalone mode (PWA installed)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
        if (isStandalone) return;

        // Only show on mobile devices
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;

        // Don't show if dismissed within last 7 days
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            if (Date.now() - dismissedTime < DISMISSED_DURATION) {
                return;
            }
            localStorage.removeItem(DISMISSED_KEY);
        }

        // Show banner after slight delay
        const timer = setTimeout(() => setIsVisible(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    function handleDismiss() {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        setIsVisible(false);
    }

    function handleInstall() {
        setShowModal(true);
        setIsVisible(false);
    }

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 20,
                                mass: 1,
                            },
                        }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        className="mb-6 w-full"
                    >
                        {/* Premium card with gradient border effect */}
                        <div className="relative rounded-2xl bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20">
                            <div className="rounded-[14px] bg-white p-4">
                                {/* Top row: Icon + Text */}
                                <div className="flex items-center gap-3">
                                    {/* App Icon with glow */}
                                    <div className="relative shrink-0">
                                        <div className="absolute inset-0 rounded-xl bg-indigo-500 opacity-30 blur-md" />
                                        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600">
                                            <Smartphone className="h-6 w-6 text-white" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-[15px] font-bold text-gray-900">Get the Kontrol App</h3>
                                        <p className="mt-0.5 text-sm text-gray-500">Install for the best experience</p>
                                    </div>
                                </div>

                                {/* Bottom row: Side-by-side buttons */}
                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        onClick={handleInstall}
                                        className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98]"
                                    >
                                        Install Now
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <InstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}
