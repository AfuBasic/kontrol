import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Smartphone, Apple, Play, ArrowLeft, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Header from '@/Components/Public/Header';

export default function DownloadApp() {
    const [deviceType, setDeviceType] = useState<'apple' | 'android' | 'other'>('other');

    useEffect(() => {
        // Detect user agent
        const ua = navigator.userAgent.toLowerCase();
        if (/ipad|iphone|ipod|macintosh/.test(ua) && !('MSStream' in window)) {
            setDeviceType('apple');
        } else if (/android/.test(ua)) {
            setDeviceType('android');
        } else {
            setDeviceType('other');
        }
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white flex flex-col justify-between pb-12">
            <Head>
                <title>Download Kontrol App - Gated Estate Operations</title>
                <meta name="description" content="Download the Kontrol mobile app for residents and security personnel to access gate codes, billing, and patrols." />
            </Head>

            <Header hideCta activePage={undefined} />

            <div className="max-w-4xl mx-auto px-6 w-full flex-1 flex flex-col justify-center items-center py-20 mt-12 z-20 relative">
                {/* Background glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4F46E5]/10 rounded-full filter blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-slate-900 rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center flex flex-col items-center gap-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/5">
                        <Smartphone className="w-8 h-8" />
                    </div>

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Access Kontrol on Mobile
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed max-w-sm mx-auto">
                            Residents and security personnel must access their dashboard via the official Kontrol mobile app.
                        </p>
                    </div>

                    {/* Detected Device Hint */}
                    {deviceType !== 'other' && (
                        <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></span>
                            Detected: <span className="text-slate-900 dark:text-white font-semibold capitalize">{deviceType} Device</span>
                        </div>
                    )}

                    {/* Primary Button based on detected device */}
                    <div className="w-full flex flex-col gap-4 mt-2">
                        {deviceType === 'apple' ? (
                            <a
                                href="#"
                                className="w-full py-4 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 border border-transparent"
                            >
                                <Apple className="w-5 h-5 fill-current text-white dark:text-slate-950" />
                                <div className="text-left leading-tight">
                                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Download on the</div>
                                    <div className="text-sm font-bold text-white dark:text-slate-950">App Store</div>
                                </div>
                            </a>
                        ) : deviceType === 'android' ? (
                            <a
                                href="#"
                                className="w-full py-4 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 border border-transparent"
                            >
                                <Play className="w-5 h-5 fill-white text-white" />
                                <div className="text-left leading-tight">
                                    <div className="text-[10px] font-semibold text-[#ffd6ce] uppercase tracking-wider">Get it on</div>
                                    <div className="text-sm font-bold text-white">Google Play</div>
                                </div>
                            </a>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <a
                                    href="#"
                                    className="w-full py-4 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 border border-transparent"
                                >
                                    <Apple className="w-5 h-5 fill-current text-white dark:text-slate-950" />
                                    <div className="text-left leading-tight">
                                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Download on the</div>
                                        <div className="text-sm font-bold text-white dark:text-slate-950">App Store</div>
                                    </div>
                                </a>
                                <a
                                    href="#"
                                    className="w-full py-4 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 border border-transparent"
                                >
                                    <Play className="w-5 h-5 fill-white text-white" />
                                    <div className="text-left leading-tight">
                                        <div className="text-[10px] font-semibold text-[#ffd6ce] uppercase tracking-wider">Get it on</div>
                                        <div className="text-sm font-bold text-white">Google Play</div>
                                    </div>
                                </a>
                            </div>
                        )}

                        {/* Secondary Options */}
                        {deviceType !== 'other' && (
                            <div className="grid grid-cols-1 gap-3 w-full mt-2">
                                {/* App Store button */}
                                {deviceType !== 'apple' && (
                                    <a
                                        href="#"
                                        className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Apple className="w-4 h-4 fill-current" />
                                        Download for iOS
                                    </a>
                                )}
                                {/* Play Store button */}
                                {deviceType !== 'android' && (
                                    <a
                                        href="#"
                                        className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Download for Android
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-full border-t border-slate-200 dark:border-slate-900 my-2 pt-4 flex flex-col gap-4 items-center">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span>Secured and verified by Kontrol Security</span>
                        </div>
                        
                        <Link
                            href="/"
                            className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 w-full text-slate-400 dark:text-slate-650 text-[10px] text-center z-20">
                © 2026 Kontrol. All rights reserved.
            </footer>
        </div>
    );
}
