import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISSED_KEY = 'push-prompt-dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PushNotificationPrompt() {
    const { permission, isSubscribed, isLoading, subscribe, isSupported } = usePushNotifications();
    const [isDismissed, setIsDismissed] = useState(true); // Start hidden until we check
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user dismissed the prompt recently
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            if (Date.now() - dismissedTime < DISMISSED_DURATION) {
                setIsDismissed(true);
                return;
            }
            localStorage.removeItem(DISMISSED_KEY);
        }
        setIsDismissed(false);
    }, []);

    useEffect(() => {
        // Show prompt after a short delay for better UX
        if (!isDismissed && isSupported && !isSubscribed && permission !== 'denied' && !isLoading) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
        setIsVisible(false);
    }, [isDismissed, isSupported, isSubscribed, permission, isLoading]);

    function handleDismiss() {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        setIsVisible(false);
        setIsDismissed(true);
    }

    async function handleEnable() {
        const success = await subscribe();
        if (success) {
            setIsVisible(false);
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed top-4 right-4 left-4 z-50 mx-auto max-w-lg"
                >
                    <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/10">
                        {/* Gradient accent bar */}
                        <div className="h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        <div className="p-4">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                                    <Bell className="h-6 w-6 text-white" />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">Enable Push Notifications</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get instant alerts when your visitors arrive at the gate.</p>
                                        </div>
                                        <button
                                            onClick={handleDismiss}
                                            className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 flex items-center gap-3">
                                        <button
                                            onClick={handleEnable}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                            fill="none"
                                                        />
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        />
                                                    </svg>
                                                    Enabling...
                                                </>
                                            ) : (
                                                'Enable Now'
                                            )}
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                                        >
                                            Not now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
