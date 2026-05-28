import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Smartphone, Apple, Play, ArrowLeft, Shield, LogOut } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Header from '@/Components/Public/Header';

interface Props {
    autologinToken?: string | null;
}

export default function DownloadApp({ autologinToken }: Props) {
    const [deviceType, setDeviceType] = useState<'apple' | 'android' | 'other'>('other');
    const { auth } = usePage<any>().props;

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
        <div className="flex min-h-[100dvh] flex-col justify-between bg-white pb-12 font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>Download Kontrol App - Gated Estate Operations</title>
                <meta
                    name="description"
                    content="Download the Kontrol mobile app for residents and security personnel to access gate codes, billing, and patrols."
                />
            </Head>

            <Header hideCta activePage={undefined} />

            <div className="relative z-20 mx-auto mt-12 flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-20">
                {/* Background glow effects */}
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F46E5]/10 blur-[120px] filter"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative flex w-full max-w-lg flex-col items-center gap-6 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/80 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10 dark:border-slate-900 dark:bg-slate-950/80"
                >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 shadow-lg shadow-indigo-500/5 dark:text-indigo-400">
                        <Smartphone className="h-8 w-8" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">Access Kontrol on Mobile</h1>
                        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Residents and security personnel must access their dashboard via the official Kontrol mobile app.
                        </p>
                    </div>

                    {/* Detected Device Hint */}
                    {deviceType !== 'other' && (
                        <div className="dark:border-slate-850 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
                            Detected: <span className="font-semibold text-slate-900 capitalize dark:text-white">{deviceType} Device</span>
                        </div>
                    )}

                    {/* Primary Button: Deep Link to Open App */}
                    <div className="mt-2 flex w-full flex-col gap-6">
                        <a
                            href="kontrol://login"
                            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-sm font-extrabold text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95"
                        >
                            <Smartphone className="h-5 w-5" />
                            <div className="text-left leading-tight">
                                <div className="text-sm font-bold text-white">Open Kontrol App</div>
                            </div>
                        </a>

                        {/* Divider */}
                        <div className="my-1 flex items-center">
                            <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                            <span className="px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-600">
                                Or Download App
                            </span>
                            <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                        </div>

                        {/* Download Options Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <a
                                href="#"
                                className="hover:bg-slate-850 flex items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-900 py-4 text-sm font-extrabold text-white shadow-lg transition-all dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                            >
                                <Apple className="h-5 w-5 fill-current text-white dark:text-slate-950" />
                                <div className="text-left leading-tight">
                                    <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Download for
                                    </div>
                                    <div className="text-xs font-bold text-white dark:text-slate-950">App Store (iOS)</div>
                                </div>
                            </a>

                            <a
                                href="#"
                                className="hover:bg-slate-850 flex items-center justify-center gap-3 rounded-2xl border border-transparent bg-slate-900 py-4 text-sm font-extrabold text-white shadow-lg transition-all dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                            >
                                <Play className="h-5 w-5 fill-current text-white dark:text-slate-950" />
                                <div className="text-left leading-tight">
                                    <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">Get it on</div>
                                    <div className="text-xs font-bold text-white dark:text-slate-950">Google Play (Android)</div>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="my-2 flex w-full flex-col items-center gap-4 border-t border-slate-200 pt-4 dark:border-slate-900">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Shield className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span>Secured and verified by Kontrol Security</span>
                        </div>

                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            <Link
                                href="/"
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" /> Back to home
                            </Link>

                            {auth?.user && (
                                <>
                                    <span className="hidden text-slate-300 sm:inline dark:text-slate-800">|</span>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-1.5 text-xs font-bold text-rose-500 transition-colors hover:text-rose-600"
                                    >
                                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="dark:text-slate-650 z-20 mx-auto w-full max-w-7xl px-6 text-center text-[10px] text-slate-400">
                © 2026 Kontrol. All rights reserved.
            </footer>
        </div>
    );
}
