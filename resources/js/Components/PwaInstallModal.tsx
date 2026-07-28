import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, CheckCircle2, ChevronRight, Compass, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/Hooks/useInstallPrompt';
import { getBrowserName, getOperatingSystem } from '@/Utils/platform';

const STORAGE_KEY = 'kontrol_pwa_modal_dismissed_at_v2';

export default function PwaInstallModal() {
    const { canPrompt, isChecking, isInstalled, promptInstall } = useInstallPrompt();
    const [isOpen, setIsOpen] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const os = getOperatingSystem();

        // STRICTLY ANDROID ONLY per user directive
        if (os !== 'android') return;

        // Dismissal check temporarily bypassed for design review per user directive
        if (!isInstalled) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isInstalled]);

    const handleInstallClick = async () => {
        if (canPrompt) {
            setIsInstalling(true);
            const accepted = await promptInstall();
            setIsInstalling(false);
            if (accepted) {
                setIsOpen(false);
            }
        } else {
            setShowGuideModal(true);
        }
    };

    const handleDismiss = () => {
        setIsOpen(false);
        try {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        } catch {
            // Ignore storage errors
        }
    };

    const browser = getBrowserName();

    return (
        <>
            {/* Main PWA Install Prompt Modal */}
            <AnimatePresence>
                {isOpen && !showGuideModal && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleDismiss}
                            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
                        />

                        {/* Sheet Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.96 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-lg rounded-t-[36px] border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-indigo-950/50 backdrop-blur-2xl sm:rounded-[36px] sm:p-8 text-white font-sans overflow-hidden"
                        >
                            {/* Ambient Glow */}
                            <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[70px]" />

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                                aria-label="Close install prompt"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* App Icon & Header */}
                            <div className="flex items-start gap-4">
                                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/20 to-indigo-600/05 p-3 shadow-xl shadow-indigo-500/10 backdrop-blur-sm">
                                    <img src="/assets/images/app-icon.png" alt="Kontrol Icon" className="h-full w-full object-contain rounded-xl" />
                                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                                        <Sparkles className="h-3 w-3" />
                                    </div>
                                </div>

                                <div className="pr-6 pt-0.5">
                                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-indigo-400">
                                        Android PWA Experience
                                    </span>
                                    <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">Install Kontrol on your phone</h3>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="mt-3.5 text-xs leading-relaxed text-slate-300">
                                Add Kontrol to your home screen for an instant app experience, offline visitor access codes, and fast gate passes.
                            </p>

                            {/* Feature Badges */}
                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-200">
                                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/50 px-3.5 py-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>Instant Gate Access</span>
                                </div>
                                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/50 px-3.5 py-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-400" />
                                    <span>Offline Access Codes</span>
                                </div>
                            </div>

                            {/* Single Primary Action Slot with Initial Loading State */}
                            <div className="mt-6 flex flex-col gap-3">
                                {isChecking ? (
                                    <div className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-indigo-500/20 bg-indigo-950/40 px-6 text-xs font-bold text-indigo-300 backdrop-blur-md">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                                        <span>Checking install compatibility...</span>
                                    </div>
                                ) : canPrompt ? (
                                    <button
                                        onClick={handleInstallClick}
                                        disabled={isInstalling}
                                        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <Download className="h-5 w-5" />
                                        <span>{isInstalling ? 'Installing Kontrol...' : 'Install App'}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowGuideModal(true)}
                                        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98]"
                                    >
                                        <Compass className="h-5 w-5" />
                                        <span>View Step-by-Step Guide</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                )}

                                {/* Secondary Action */}
                                <button
                                    onClick={handleDismiss}
                                    className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 px-6 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                                >
                                    Continue on Web
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dedicated Step-by-Step Install Guide Modal */}
            <AnimatePresence>
                {showGuideModal && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowGuideModal(false)}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg transition-opacity"
                        />

                        {/* Guide Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 120, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 120, scale: 0.95 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-lg rounded-t-[36px] border border-slate-800 bg-slate-900/98 p-6 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl sm:rounded-[36px] sm:p-8 text-white font-sans overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Ambient Glow */}
                            <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-500/25 blur-[70px]" />

                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowGuideModal(false)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <div>
                                        <h3 className="text-lg font-black text-white">Installation Guide</h3>
                                        <p className="text-xs font-semibold text-indigo-400 capitalize">{browser} Browser on Android</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowGuideModal(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Steps Content */}
                            <div className="mt-5 space-y-3.5 overflow-y-auto pr-1">
                                <div className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 font-black text-indigo-400 border border-indigo-500/30">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Open Browser Menu</h4>
                                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                            Tap the <strong>Menu (⋮ or ≡)</strong> button at the top right or bottom of your browser window.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 font-black text-indigo-400 border border-indigo-500/30">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Select Install App</h4>
                                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                            Look for <strong>Add to Home screen</strong> or <strong>Install app</strong> in the dropdown menu.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 font-black text-indigo-400 border border-indigo-500/30">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Confirm & Enjoy</h4>
                                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                            Tap <strong>Install</strong> when prompted. Kontrol will instantly appear on your home screen like a native app.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Back/Close Button */}
                            <div className="mt-6 pt-2">
                                <button
                                    onClick={() => setShowGuideModal(false)}
                                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-[0.98]"
                                >
                                    <span>Got it, back to app</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
