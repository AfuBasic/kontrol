import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Smartphone, Shield } from 'lucide-react';
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
                        <svg className="h-10 w-10 fill-current" viewBox="0 0 170 170" fill="currentColor">
                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.59-7.71-11.66-14-4.89-7.5-8.91-16.14-12.06-25.92-3.15-9.78-4.73-19.16-4.73-28.14 0-13.48 3.5-24.63 10.51-33.45 7.01-8.82 15.82-13.34 26.43-13.56 5.23 0 10.98 1.41 17.27 4.23 6.28 2.83 10.33 4.3 12.14 4.41 1.41 0 5.67-1.58 12.79-4.73 7.12-3.15 13.34-4.59 18.66-4.32 14.13.76 25.12 6.2 32.99 16.3-12.61 7.61-18.81 17.94-18.6 30.98.22 10.22 4.13 18.7 11.74 25.43 7.61 6.74 16.63 10.54 27.06 11.41-2.61 7.72-5.76 15.54-9.45 23.46zM119.22 31.84c0-7.72 2.72-14.9 8.15-21.52 5.43-6.63 12.17-10.32 20.21-11.09.22 1.09.33 2.07.33 2.94 0 7.61-2.83 14.9-8.48 21.85-5.65 6.96-12.5 10.76-20.54 11.41 0-1.2-.1-2.07.33-3.59z" />
                        </svg>
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
                            <img src="/assets/images/apple-store.svg" alt="App Store" className="h-5 w-5 brightness-0 invert" />
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
