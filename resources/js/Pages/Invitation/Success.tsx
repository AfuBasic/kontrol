import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Smartphone, ShieldCheck, Users, Zap } from 'lucide-react';
import React from 'react';

export default function Success() {
    return (
        <>
            <Head title="Invitation Accepted - Kontrol" />

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
                    className="relative z-10 w-full max-w-lg"
                >
                    {/* Branding */}
                    <div className="mb-10 flex justify-center">
                        <div className="h-10 w-auto">
                            <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-full w-auto object-contain" />
                        </div>
                    </div>

                    {/* Frosted Glass Panel */}
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl">
                        <div className="p-8 text-center lg:p-10">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                            >
                                <CheckCircle2 className="h-10 w-10" />
                            </motion.div>

                            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">Invitation Accepted!</h1>
                            <p className="mb-8 text-base leading-relaxed text-white/70">
                                Welcome to the community! Your account is now active and ready to use.
                            </p>

                            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-left transition-colors hover:bg-white/10">
                                    <ShieldCheck className="mb-3 h-6 w-6 text-[#1F6FDB]" />
                                    <h3 className="mb-1 font-medium text-white">Smart Security</h3>
                                    <p className="text-xs text-white/50">Manage access and keep your estate secure effortlessly.</p>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-left transition-colors hover:bg-white/10">
                                    <Users className="mb-3 h-6 w-6 text-[#1F6FDB]" />
                                    <h3 className="mb-1 font-medium text-white">Visitor Management</h3>
                                    <p className="text-xs text-white/50">Generate invites and track guests in real-time.</p>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-left transition-colors hover:bg-white/10 sm:col-span-2">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1F6FDB]/20 text-[#1F6FDB]">
                                            <Zap className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="mb-1 font-medium text-white">Instant Updates</h3>
                                            <p className="text-xs text-white/50">Get real-time notifications for everything that matters.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6">
                                <div className="absolute -top-4 -right-4 opacity-10">
                                    <Smartphone className="h-32 w-32" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="mb-2 text-lg font-medium text-white">Kontrol Mobile App</h2>
                                    <p className="mb-6 text-sm text-white/60">Download the Kontrol mobile app to start managing your access.</p>

                                    <a
                                        href="/#download"
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F6FDB] px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-[#1F6FDB]/20 transition-all hover:bg-[#2579ed] hover:shadow-[#1F6FDB]/40 active:scale-95"
                                    >
                                        <Smartphone className="h-5 w-5" />
                                        Get the App
                                    </a>
                                </div>
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
