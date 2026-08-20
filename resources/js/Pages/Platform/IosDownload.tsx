import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Smartphone, Apple, Shield } from 'lucide-react';
import React from 'react';

interface Props {
    appStoreUrl: string;
    isNativeApp: boolean;
}

export default function IosDownload({ appStoreUrl }: Props) {
    const handleOpenApp = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = 'kontrol://login';

        const start = Date.now();
        setTimeout(() => {
            if (Date.now() - start < 2200) {
                window.location.href = appStoreUrl;
            }
        }, 2000);
    };

    return (
        <div className="relative flex min-h-[100dvh] flex-col justify-between bg-[#020617] font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-white">
            <Head>
                <title>Kontrol for iOS - Download Official App</title>
                <meta
                    name="description"
                    content="Residents and security personnel on iOS must access Kontrol via the official Apple App Store application."
                />
            </Head>

            {/* Ambient Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[140px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-8 w-auto" />
                </Link>
            </header>

            {/* Main Content */}
            <main className="relative z-10 mx-auto my-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center rounded-[32px] border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-2xl"
                >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white shadow-xl">
                        <Apple className="h-10 w-10 fill-current" />
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Access Kontrol on iOS</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        For security and performance, resident and operational workflows on iOS require the official Apple App Store app.
                    </p>

                    <div className="mt-8 flex w-full flex-col gap-3">
                        <a
                            href="#"
                            onClick={handleOpenApp}
                            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-sm font-extrabold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95"
                        >
                            <Smartphone className="h-5 w-5" />
                            <span>Open Kontrol App</span>
                        </a>

                        <a
                            href={appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:bg-slate-750 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 py-4 text-sm font-extrabold text-white transition-all active:scale-95"
                        >
                            <Apple className="h-5 w-5 fill-current" />
                            <span>Download on App Store</span>
                        </a>
                    </div>
                </motion.div>
            </main>

            <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
                <div className="mb-2 flex items-center justify-center gap-1.5 text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Secured by Kontrol Platform Architecture</span>
                </div>
                © 2026 Kontrol. All rights reserved.
            </footer>
        </div>
    );
}
