import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone,
    CheckCircle2,
    Download,
    HelpCircle,
    ChevronDown,
    Shield,
    Sparkles,
    ArrowRight,
    Compass,
    Share,
    MoreVertical,
    PlusSquare,
    Home,
} from 'lucide-react';
import React, { useState } from 'react';
import { useInstallPrompt } from '@/Hooks/useInstallPrompt';
import { getBrowserName } from '@/Utils/platform';

interface Props {
    browser: string;
    isInstalled: boolean;
    appStoreUrl?: string;
    playStoreUrl?: string;
}

export default function AndroidInstall({ browser: initialBrowser, isInstalled: initialIsInstalled }: Props) {
    const { canPrompt, isInstalled, promptInstall } = useInstallPrompt();
    const [showSteps, setShowSteps] = useState(false);
    const browser = getBrowserName() || initialBrowser;

    const handleInstallClick = async () => {
        if (canPrompt) {
            const success = await promptInstall();
            if (success) {
                router.visit('/resident/home');
            }
        } else {
            setShowSteps(true);
        }
    };

    if (isInstalled || initialIsInstalled) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12 text-center text-white font-sans">
                <Head title="Kontrol Installed" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-8 shadow-2xl backdrop-blur-xl"
                >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">Kontrol is Installed!</h1>
                    <p className="mt-3 text-sm text-slate-300">
                        You are ready to launch Kontrol directly from your Home Screen or continue to your dashboard.
                    </p>
                    <Link
                        href="/resident/home"
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95"
                    >
                        Continue to Kontrol <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-[100dvh] flex-col justify-between bg-[#020617] font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-white">
            <Head>
                <title>Install Kontrol - Official Android App Experience</title>
                <meta name="description" content="Install Kontrol on your Android device for instant gate codes and estate access control." />
            </Head>

            {/* Ambient Lighting & Grid */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/15 blur-[140px]" />
                <div className="absolute bottom-10 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />
            </div>

            {/* Header / Brand */}
            <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-8 w-auto" />
                </Link>
                <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Official Android PWA
                </div>
            </header>

            {/* Main Journey Container */}
            <main className="relative z-10 mx-auto my-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center rounded-[32px] border border-slate-800 bg-slate-900/80 p-7 text-center shadow-2xl backdrop-blur-2xl sm:p-9"
                >
                    {/* Device Icon Badge */}
                    <div className="relative mb-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/30 bg-indigo-600/10 text-indigo-400 shadow-xl shadow-indigo-500/10">
                            <Smartphone className="h-10 w-10" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                            <Download className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Headlines */}
                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Install Kontrol</h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        Install Kontrol to your device in under a minute.
                    </p>

                    {/* Value Proposition List */}
                    <div className="my-6 w-full space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 text-left">
                        {[
                            'Opens like a native application',
                            'Lives on your Home Screen',
                            'Full-screen experience',
                            'Fast',
                            'Secure',
                            'Optimized for daily estate operations',
                        ].map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-400" />
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {/* Primary Action Button */}
                    <button
                        onClick={handleInstallClick}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95"
                    >
                        <Download className="h-5 w-5" />
                        <span>Install Kontrol</span>
                    </button>

                    {/* Secondary Action Button */}
                    <button
                        onClick={() => setShowSteps(!showSteps)}
                        className="mt-3 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-400 transition-colors hover:text-white"
                    >
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                        <span>View Installation Steps</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showSteps ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Visual Installation Guide Accordion */}
                    <AnimatePresence>
                        {showSteps && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 w-full overflow-hidden text-left"
                            >
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-xs">
                                    <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
                                        <span className="font-bold text-slate-200">
                                            Detected: <span className="capitalize text-indigo-400">{browser} Browser</span>
                                        </span>
                                        <Compass className="h-4 w-4 text-indigo-400" />
                                    </div>

                                    {browser === 'samsung' ? (
                                        <ol className="space-y-3 text-slate-300">
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">1</span>
                                                <span>Tap the <strong>Menu (≡)</strong> icon at the bottom right.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">2</span>
                                                <span>Select <strong>+ Add page to</strong>.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">3</span>
                                                <span>Choose <strong>App screen</strong> or <strong>Home screen</strong>.</span>
                                            </li>
                                        </ol>
                                    ) : browser === 'firefox' ? (
                                        <ol className="space-y-3 text-slate-300">
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">1</span>
                                                <span>Tap the <strong>Three Dots (⋮)</strong> menu button.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">2</span>
                                                <span>Tap <strong>Install</strong> or <strong>Add to Home screen</strong>.</span>
                                            </li>
                                        </ol>
                                    ) : (
                                        <ol className="space-y-3 text-slate-300">
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">1</span>
                                                <span>Tap the <strong>Three Dots (⋮)</strong> at the top right of Chrome/Edge.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">2</span>
                                                <span>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300">3</span>
                                                <span>Confirm <strong>Install</strong> when prompted.</span>
                                            </li>
                                        </ol>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
                <div className="flex items-center justify-center gap-1.5 mb-2 text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Official Kontrol Platform Architecture</span>
                </div>
                © 2026 Kontrol. All rights reserved.
            </footer>
        </div>
    );
}
