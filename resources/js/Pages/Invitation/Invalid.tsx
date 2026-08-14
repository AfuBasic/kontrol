import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import React from 'react';

interface Props {
    type?: 'admin_accepted' | 'admin_expired' | 'default';
    estateName?: string;
}

export default function Invalid({ type = 'default', estateName }: Props) {
    return (
        <>
            <Head title="Invalid Invitation - Kontrol" />

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
                                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 text-red-400"
                            >
                                <AlertCircle className="h-10 w-10" />
                            </motion.div>

                            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
                                {type === 'admin_accepted' 
                                    ? 'Administrator Account Active' 
                                    : type === 'admin_expired'
                                    ? 'Invitation Expired'
                                    : 'Invalid or Expired Link'}
                            </h1>
                            <p className="mb-8 text-sm leading-relaxed text-white/60">
                                {type === 'admin_accepted'
                                    ? `The administrator account for ${estateName} has already been set up. You can log in to your dashboard to manage the estate.`
                                    : type === 'admin_expired'
                                    ? `Your administrator invitation for ${estateName} has expired. Please contact Kontrol support or your partner representative to request a new invitation link.`
                                    : 'This invitation link is no longer valid. It may have expired, or you might have already used it to set up your account.'}
                            </p>

                            <div className="flex flex-col gap-4">
                                <Link
                                    href="/login"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F6FDB] px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-[#1F6FDB]/20 transition-all hover:bg-[#2579ed] hover:shadow-[#1F6FDB]/40 active:scale-95"
                                >
                                    Log in to your account
                                </Link>
                                <a
                                    href="mailto:support@usekontrol.com"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-white/10 active:scale-95"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/40 transition-colors hover:text-white">
                            <ArrowLeft className="h-3 w-3" />
                            Return to Homepage
                        </Link>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
