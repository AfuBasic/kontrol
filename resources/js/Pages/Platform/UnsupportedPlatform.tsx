import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { MonitorX, Smartphone, Shield, LogOut } from 'lucide-react';
import React from 'react';

interface Props {
    userRole: string;
    deviceType: string;
    operatingSystem: string;
}

export default function UnsupportedPlatform({ userRole }: Props) {
    return (
        <div className="relative flex min-h-[100dvh] flex-col justify-between bg-[#020617] font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-white">
            <Head>
                <title>Mobile Platform Required - Kontrol</title>
            </Head>

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[140px]" />
            </div>

            <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-600/30">
                        K
                    </div>
                    <span className="text-lg font-extrabold tracking-tight text-white">Kontrol</span>
                </div>
            </header>

            <main className="relative z-10 mx-auto my-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center rounded-[32px] border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-2xl"
                >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-xl shadow-rose-500/10">
                        <MonitorX className="h-10 w-10" />
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Mobile Device Required</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        Operational roles (<span className="font-semibold text-slate-200 capitalize">{userRole.replace('_', ' ')}</span>) are optimized specifically for mobile devices and cannot access Kontrol from a desktop browser.
                    </p>

                    <div className="mt-6 flex w-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
                        <div className="flex items-center gap-2 font-semibold text-indigo-300">
                            <Smartphone className="h-4 w-4 shrink-0" />
                            <span>Supported Mobile Experiences:</span>
                        </div>
                        <ul className="ml-6 list-disc space-y-1 text-slate-400">
                            <li>iPhone: Official iOS App</li>
                            <li>Android: Installed Kontrol PWA</li>
                        </ul>
                    </div>

                    <div className="mt-8 flex w-full justify-center">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center gap-2 text-xs font-bold text-rose-400 transition-colors hover:text-rose-300"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out of Account
                        </Link>
                    </div>
                </motion.div>
            </main>

            <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
                <div className="flex items-center justify-center gap-1.5 mb-2 text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Role-Aware Access Security</span>
                </div>
                © 2026 Kontrol. All rights reserved.
            </footer>
        </div>
    );
}
