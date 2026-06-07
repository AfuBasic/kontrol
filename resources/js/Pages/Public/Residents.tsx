import { Link, Head } from '@inertiajs/react';
import { Smartphone, Users, AlertTriangle, Key, Clock, MessageSquare, Download } from 'lucide-react';
import React, { useEffect } from 'react';
import Header from '@/Components/Public/Header';
import ScrollReveal from '@/Components/Public/ScrollReveal';

export default function Residents() {
    // Set mount status
    useEffect(() => {
        // Mounted
    }, []);

    const features = [
        {
            icon: <Key className="h-5 w-5 text-[#FF7E67]" />,
            title: 'Instant Guest Passes',
            desc: 'Create secure one-time or multi-day entry codes for visitors, contractors, or delivery agents, and share them directly via WhatsApp or text.',
        },
        {
            icon: <Users className="h-5 w-5 text-[#4F46E5]" />,
            title: 'Household Controls',
            desc: 'Invite family members, flatmates, or domestic staff to join your household profile. Assign custom permission levels for managing visitors.',
        },
        {
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
            title: 'Immediate Distress Alerts',
            desc: 'Trigger a real-time panic alarm from the app during emergencies. It sends your address and contact details directly to all gate guard terminals instantly.',
        },
        {
            icon: <Clock className="h-5 w-5 text-emerald-400" />,
            title: 'Arrival Notifications',
            desc: 'Receive real-time push notifications the exact second your guests are checked in or out by security guards at the estate gate.',
        },
        {
            icon: <MessageSquare className="h-5 w-5 text-[#FF7E67]" />,
            title: 'Community Noticeboard',
            desc: 'Read announcements, maintenance bulletins, and general estate notices sent directly by your property management team.',
        },
    ];

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>For Residents - Kontrol Gated Access</title>
                <meta
                    name="description"
                    content="Manage guest access, emergency alerts, household members, and announcements with the Kontrol resident app."
                />
            </Head>

            {/* Persistent Header - CTA hidden to keep Residents page clean of onboarding actions */}
            <Header hideCta={true} activePage="residents" />

            {/* Hero Stage */}
            <section className="relative overflow-hidden border-b border-slate-200 pt-40 pb-20 dark:border-slate-900">
                {/* Background glow effects */}
                <div className="pointer-events-none absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF7E67]/10 blur-[120px] filter"></div>

                <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6 text-center">
                    <ScrollReveal variant="fade" delay={0}>
                        <div className="inline-flex items-center gap-2 self-center rounded-full border border-[#FF7E67]/30 bg-[#FF7E67]/15 px-3 py-1.5 text-xs font-bold text-[#ff8f7a]">
                            <Smartphone className="h-3.5 w-3.5" />
                            Resident Companion App
                        </div>
                    </ScrollReveal>
                    <ScrollReveal variant="slide-up" delay={0.1}>
                        <h1 className="text-4xl leading-tight font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                            Your home gate in your{' '}
                            <span className="bg-linear-to-r from-[#FF7E67] to-indigo-500 bg-clip-text text-transparent dark:to-indigo-400">pocket.</span>
                        </h1>
                    </ScrollReveal>
                    <ScrollReveal variant="slide-up" delay={0.2}>
                        <p className="mx-auto max-w-2xl text-lg leading-relaxed font-medium text-slate-600 sm:text-xl dark:text-slate-400">
                            No more intercom delays or walking down to the gate. Generate guest access codes, invite household members, and trigger panic
                            alerts in seconds.
                        </p>
                    </ScrollReveal>
                </div>
            </section>

            {/* Resident Features Grid */}
            <section className="border-b border-slate-200 py-24 dark:border-slate-900">
                <div className="mx-auto max-w-6xl px-6">
                    <ScrollReveal variant="slide-up" className="mx-auto mb-16 flex max-w-2xl flex-col gap-4 text-center">
                        <span className="text-xs font-bold tracking-widest text-[#4F46E5] uppercase">App Features</span>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                            Streamlined tools for your household
                        </h2>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <ScrollReveal key={i} variant="scale-up" delay={i * 0.1}>
                                <div className="hover:border-slate-350 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm transition-all dark:border-slate-900 dark:bg-[#0f172a]/20 dark:hover:border-slate-800">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-900 dark:bg-slate-950">
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                                    <p className="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400">{f.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* How to Connect / Start */}
            <section className="py-24">
                <div className="mx-auto max-w-4xl px-6">
                    <ScrollReveal variant="scale">
                        <div className="border-slate-250 relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[40px] border bg-linear-to-br from-slate-50 to-white p-10 text-center shadow-2xl dark:border-[#4F46E5]/30 dark:from-[#0f172a]/80 dark:to-[#020617]">
                            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[#4F46E5]/5 blur-3xl filter"></div>

                            <div className="max-w-2xl">
                                <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                    How do I activate my account?
                                </h3>
                                <p className="mt-4 text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                                    Once your estate administrators onboard the community onto Kontrol, download the resident companion app on iOS or
                                    Android. Simply log in with your phone number to automatically sync with your unit address.
                                </p>
                            </div>

                            <div className="mt-2 flex flex-col justify-center gap-4 sm:flex-row">
                                <div className="border-slate-250 inline-flex items-center gap-2 rounded-xl border bg-slate-100 px-5 py-3 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                    <Download className="h-4 w-4 text-[#FF7E67]" />
                                    Companion app available on App Store & Google Play
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12 text-xs text-slate-500 dark:border-slate-900 dark:bg-[#020617]">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden h-6 w-auto dark:block" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block h-6 w-auto dark:hidden" />
                        <span className="text-slate-650 text-[10px] font-medium dark:text-slate-600">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Terms of Use
                        </Link>
                        <Link href="/contact" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
