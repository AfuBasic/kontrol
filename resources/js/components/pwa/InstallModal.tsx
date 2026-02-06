import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Platform = 'ios' | 'android';

export default function InstallModal({ isOpen, onClose }: InstallModalProps) {
    const [platform, setPlatform] = useState<Platform>('ios');

    useEffect(() => {
        // Auto-detect platform
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        setPlatform(isIOS ? 'ios' : 'android');
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl"
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Install Kontrol</h2>
                                <p className="mt-0.5 text-sm text-gray-500">Add to your home screen</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Platform Tabs */}
                        <div className="px-6">
                            <div className="flex rounded-xl bg-gray-100 p-1">
                                <button
                                    onClick={() => setPlatform('ios')}
                                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                                        platform === 'ios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <AppleIcon className="h-4 w-4" />
                                        iPhone / iPad
                                    </span>
                                </button>
                                <button
                                    onClick={() => setPlatform('android')}
                                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                                        platform === 'android' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <AndroidIcon className="h-4 w-4" />
                                        Android
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                            <AnimatePresence mode="wait">
                                {platform === 'ios' ? <IOSInstructions key="ios" /> : <AndroidInstructions key="android" />}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function IOSInstructions() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <StepItem
                number={1}
                title="Tap the Share button"
                description="Find the share icon at the bottom of Safari"
                illustration={<SafariShareIcon />}
            />
            <StepItem
                number={2}
                title="Scroll down and tap"
                description={
                    <span className="inline-flex items-center gap-1.5">
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-900">Add to Home Screen</span>
                    </span>
                }
                illustration={<AddToHomeScreenIcon />}
            />
            <StepItem number={3} title="Tap Add" description="The app will appear on your home screen" illustration={<TapAddIcon />} />

            {/* Safari only notice */}
            <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This only works in Safari. If you're using Chrome or another browser, please open this page in Safari.
                </p>
            </div>
        </motion.div>
    );
}

function AndroidInstructions() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <StepItem
                number={1}
                title="Tap the menu button"
                description="Look for the three dots in the top right corner"
                illustration={<ChromeMenuIcon />}
            />
            <StepItem
                number={2}
                title="Tap Install app"
                description={
                    <span>
                        Or look for <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-900">Add to Home Screen</span>
                    </span>
                }
                illustration={<InstallAppIcon />}
            />
            <StepItem
                number={3}
                title="Confirm installation"
                description="The app will be added to your home screen"
                illustration={<ConfirmInstallIcon />}
            />

            {/* Chrome notice */}
            <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> For the best experience, use Chrome or Samsung Internet browser.
                </p>
            </div>
        </motion.div>
    );
}

interface StepItemProps {
    number: number;
    title: string;
    description: React.ReactNode;
    illustration: React.ReactNode;
}

function StepItem({ number, title, description, illustration }: StepItemProps) {
    return (
        <div className="flex items-start gap-4">
            {/* Step number */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/30">
                {number}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>

            {/* Illustration */}
            <div className="shrink-0">{illustration}</div>
        </div>
    );
}

// Icons
function AppleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
    );
}

function AndroidIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 00-.83.22l-1.88 3.24a11.463 11.463 0 00-8.94 0L5.65 5.67a.643.643 0 00-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 001 18h22a10.78 10.78 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
        </svg>
    );
}

function SafariShareIcon() {
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-200">
            <svg
                className="h-7 w-7 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
        </div>
    );
}

function AddToHomeScreenIcon() {
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-200">
            <svg
                className="h-7 w-7 text-gray-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
        </div>
    );
}

function TapAddIcon() {
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600">
            <span className="text-sm font-bold text-white">Add</span>
        </div>
    );
}

function ChromeMenuIcon() {
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-200">
            <svg className="h-7 w-7 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
            </svg>
        </div>
    );
}

function InstallAppIcon() {
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-200">
            <svg
                className="h-7 w-7 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
        </div>
    );
}

function ConfirmInstallIcon() {
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-emerald-600">
            <svg
                className="h-7 w-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>
    );
}
