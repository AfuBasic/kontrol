import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Smartphone } from 'lucide-react';
import React from 'react';

export default function Success() {
    return (
        <>
            <Head title="Account Setup Complete - Kontrol" />

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#0A3D91] to-[#041E4A] px-4 py-12">
                {/* Ambient logic background */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-0 left-0 h-96 w-96 bg-[#1F6FDB] opacity-10 blur-[100px]" />
                    <div className="absolute right-0 bottom-0 h-96 w-96 bg-[#1F6FDB] opacity-5 blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 w-full max-w-md"
                >
                    {/* Branding */}
                    <div className="mb-10 flex justify-center">
                        <div className="h-10 w-auto">
                            <img
                                src="/assets/images/kontrol-white-logo-new.png"
                                alt="Kontrol"
                                className="h-full w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Frosted Glass Panel */}
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl">
                        <div className="p-8 lg:p-10 text-center">
                            <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                            >
                                <CheckCircle2 className="h-10 w-10" />
                            </motion.div>

                            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Account Setup Complete!</h1>
                            <p className="mb-8 text-sm leading-relaxed text-white/60">
                                Your secure access credentials have been successfully created. You can now use your email and new password to log in.
                            </p>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                <div className="mb-4 flex justify-center text-[#1F6FDB]">
                                    <Smartphone className="h-8 w-8" />
                                </div>
                                <h2 className="mb-2 text-lg font-medium text-white">Kontrol Mobile App</h2>
                                <p className="mb-6 text-xs text-white/50">
                                    Residents and Security personnel must use the mobile app to access their dashboard.
                                </p>
                                
                                <a
                                    href="/#download"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F6FDB] px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-[#1F6FDB]/20 transition-all hover:bg-[#2579ed] hover:shadow-[#1F6FDB]/40 active:scale-95"
                                >
                                    Download or Open App
                                </a>
                            </div>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-xs text-white/30">
                        Secure connection via Kontrol Access Gateway.
                        <br />
                        &copy; {new Date().getFullYear()} Kontrol.
                    </p>
                </motion.div>
            </div>
        </>
    );
}
