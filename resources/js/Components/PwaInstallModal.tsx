import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, CheckCircle2, ChevronRight, Compass, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/Hooks/useInstallPrompt';
import { getBrowserName, getOperatingSystem } from '@/Utils/platform';

const STORAGE_KEY = 'kontrol_pwa_modal_dismissed_at_v2';
const COOLDOWN_DAYS = 7; // Reshow after 7 days if dismissed

export default function PwaInstallModal() {
    const { canPrompt, isInstalled, promptInstall } = useInstallPrompt();
    const [isOpen, setIsOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
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
            }, 1200);

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
            setShowGuide(!showGuide);
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
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
                    />

                    {/* Modal Content / Sheet */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-lg rounded-t-[32px] border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl sm:rounded-[32px] sm:p-7 text-white font-sans overflow-hidden"
                    >
                        {/* Ambient Glow */}
                        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[60px]" />

                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            aria-label="Close install prompt"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* App Icon & Branding */}
                        <div className="flex items-start gap-4">
                            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/20 to-indigo-600/05 p-2.5 shadow-inner shadow-indigo-500/20">
                                <img src="/assets/images/app-icon.png" alt="Kontrol Icon" className="h-full w-full object-contain rounded-xl" />
                                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                                    <Sparkles className="h-3 w-3" />
                                </div>
                            </div>

                            <div className="pr-6">
                                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                    Android App Available
                                </span>
                                <h3 className="text-lg font-black tracking-tight text-white sm:text-xl">Install Kontrol on your phone</h3>
                            </div>
                        </div>

                        {/* Value Props */}
                        <p className="mt-3 text-xs leading-relaxed text-slate-300">
                            Add Kontrol to your home screen for an instant app experience, faster code generation, and offline access.
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
                            <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                <span>Instant Gate Access</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                <span>Offline Access Codes</span>
                            </div>
                        </div>

                        {/* Manual Instructions Guide Toggleable */}
                        <AnimatePresence>
                            {showGuide && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-4 text-xs"
                                >
                                    <div className="mb-2 flex items-center justify-between border-b border-indigo-500/20 pb-2 font-bold text-indigo-200">
                                        <span className="capitalize">Instructions for {browser} Browser</span>
                                        <Compass className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <ol className="space-y-2 text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-300">
                                                1
                                            </span>
                                            <span>
                                                Tap the <strong>Menu (⋮ or ≡)</strong> button in your browser.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-300">
                                                2
                                            </span>
                                            <span>
                                                Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-300">
                                                3
                                            </span>
                                            <span>Confirm installation when prompted.</span>
                                        </li>
                                    </ol>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Buttons */}
                        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                            <button
                                onClick={handleInstallClick}
                                disabled={isInstalling}
                                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" />
                                <span>{canPrompt ? (isInstalling ? 'Installing...' : 'Install App') : showGuide ? 'Hide Instructions' : 'View Install Guide'}</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="flex h-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 px-5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                            >
                                Continue on Web
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
