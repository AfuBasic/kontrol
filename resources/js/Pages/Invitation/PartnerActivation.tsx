import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Briefcase, Bell } from 'lucide-react';
import React from 'react';

interface Props {
    acceptUrl?: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    partner_name: string;
    flash?: {
        success?: string;
        error?: string;
        info?: string;
    };
    errors?: Record<string, string>;
}

export default function PartnerActivation({ acceptUrl, user, partner_name, flash, errors }: Props) {
    const { post, processing } = useForm();

    const name = user?.name || 'there';

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const targetUrl = acceptUrl || window.location.pathname;
        post(`${targetUrl}${window.location.search}`);
    }

    return (
        <>
            <Head title="Activate Partner Account - Kontrol" />

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A3D91] to-[#041E4A] px-4 py-12">
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
                            <img
                                src="/assets/images/kontrol-white-logo-new.png"
                                alt="Kontrol"
                                className="h-full w-auto object-contain transition-transform duration-700 hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Frosted Glass Panel */}
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl">
                        <div className="p-8 text-center lg:p-10">
                            <div className="mb-6 flex justify-center">
                                <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/20 ring-inset">
                                    PARTNER PORTAL
                                </span>
                            </div>

                            <div className="mb-8">
                                <h1 className="text-2xl font-semibold tracking-tight text-white">Your partner account is ready.</h1>
                                <p className="mt-2 text-sm text-white/60">
                                    Hello, {name}. You've been invited to join <span className="font-semibold text-white">{partner_name}</span> as a
                                    Partner Member. Activate your account to begin managing estates and earning commissions.
                                </p>
                            </div>

                            {(flash?.error || (errors && Object.keys(errors).length > 0)) && (
                                <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                                    {flash?.error || Object.values(errors || {})[0]}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#1F6FDB] px-4 py-4 text-base font-semibold tracking-wide text-white shadow-lg shadow-[#1F6FDB]/20 transition-all hover:bg-[#2579ed] hover:shadow-[#1F6FDB]/40 active:scale-98 disabled:opacity-50"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {processing ? (
                                            <>
                                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Activating...
                                            </>
                                        ) : (
                                            <>
                                                Activate my partner account
                                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>

                            <div className="mt-8 border-t border-white/10 pt-8">
                                <h3 className="mb-6 text-xs font-semibold tracking-widest text-white/40 uppercase">Powered by Kontrol</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#1F6FDB]">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-medium tracking-wider text-white/50 uppercase">Partner Hub</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#1F6FDB]">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-medium tracking-wider text-white/50 uppercase">Secure Access</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#1F6FDB]">
                                            <Bell className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-medium tracking-wider text-white/50 uppercase">Instant Alerts</span>
                                    </div>
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
