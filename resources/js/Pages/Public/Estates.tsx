import { Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Building2, QrCode, FileText, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import React, { useEffect } from 'react';
import Header from '@/Components/Public/Header';

export default function Estates() {
    // Set mount status
    useEffect(() => {
        // Mounted
    }, []);

    const rolloutSteps = [
        {
            number: '01',
            title: 'Register Your Estate',
            desc: 'Submit your community configuration, billing rules, and administrator contact details in minutes.',
        },
        {
            number: '02',
            title: 'Map Streets & Units',
            desc: 'Register streets, add housing unit addresses, and invite co-administrators to manage the portal.',
        },
        {
            number: '03',
            title: 'Deploy Gate Terminal',
            desc: 'Download our companion guard app on any low-cost Android device and place it at your checkpoints.',
        },
        {
            number: '04',
            title: 'Invite Residents',
            desc: 'Add residents directly or share a secure invite link to let them register and access passes.',
        },
    ];

    return (
        <div className="min-h-screen overflow-hidden bg-white pb-12 font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>For Estates & Gated Communities - Kontrol Operations</title>
                <meta
                    name="description"
                    content="Deploy digital checkpoint systems, manage gate security, track logs, and automate levy collections for your gated community."
                />
            </Head>

            {/* Persistent Header */}
            <Header activePage="estates" />

            {/* 1. HERO SECTION */}
            <section className="relative overflow-hidden border-b border-slate-200 pt-40 pb-20 dark:border-slate-900/50">
                {/* Background glow effects */}
                <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F46E5]/10 blur-[120px] filter"></div>
                <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-[#FF7E67]/5 blur-[120px] filter"></div>

                <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-indigo-650 inline-flex items-center gap-2 self-center rounded-full border border-[#4F46E5]/30 bg-[#4F46E5]/15 px-3 py-1.5 text-xs font-bold dark:text-[#818cf8]"
                    >
                        <Building2 className="h-3.5 w-3.5" />
                        Gated Community Operations
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="max-w-4xl text-4xl leading-tight font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white"
                    >
                        Modern operations for{' '}
                        <span className="via-indigo-350 bg-linear-to-r from-indigo-500 to-[#FF7E67] bg-clip-text text-transparent dark:from-indigo-400 dark:via-indigo-200">
                            estate managers.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-2xl text-base leading-relaxed font-medium text-slate-600 sm:text-lg dark:text-slate-400"
                    >
                        Control visitor access, track real-time security logs, broadcast community notices, and automate your levy collections. All
                        from a single unified management dashboard.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-2"
                    >
                        <Link
                            href="/apply"
                            className="group flex cursor-pointer items-center gap-2 rounded-xl bg-[#FF7E67] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange-500/10 transition-all hover:bg-[#ff8f7a]"
                        >
                            Onboard Your Estate
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </motion.div>

                    {/* Interactive 3D Perspective Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, rotateX: 12 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                        style={{ transformPerspective: 1200 }}
                        className="group relative mt-16 w-full rounded-2xl border border-slate-200 bg-slate-100/40 p-2 shadow-2xl shadow-[#4F46E5]/10 dark:border-slate-900 dark:bg-slate-950/40 dark:shadow-[#4F46E5]/5"
                    >
                        <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-linear-to-t from-white via-transparent to-transparent dark:from-[#020617]"></div>
                        <img
                            src="/assets/images/admin-dashboard-mockup.png"
                            alt="Kontrol Admin Dashboard Console"
                            className="h-auto w-full rounded-xl brightness-[0.95] filter transition-all duration-700 dark:brightness-[0.8] dark:group-hover:brightness-[0.95]"
                        />
                    </motion.div>
                </div>
            </section>

            {/* 2. CORE FEATURES ALTERNATING SECTION */}
            <section className="border-b border-slate-200 py-24 dark:border-slate-900/50">
                <div className="mx-auto flex max-w-6xl flex-col gap-28 px-6">
                    {/* Feature 1: Gate terminal */}
                    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col gap-6"
                        >
                            <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#FF7E67] uppercase">
                                <QrCode className="h-4 w-4 shrink-0" /> Checkpoint Control
                            </span>
                            <h2 className="text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Verify guest passes in 3 seconds flat.
                            </h2>
                            <p className="text-sm leading-relaxed font-medium text-slate-600 sm:text-base dark:text-slate-400">
                                Equip your gate checkpoints with our digital terminal app. Guards scan resident-generated guest codes to verify
                                visitor status and register check-ins instantly, eliminating vehicle backups.
                            </p>
                            <ul className="dark:text-slate-355 mt-2 flex flex-col gap-3 text-xs text-slate-700">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Fast offline-capable pass scanning</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Live activity telemetry logs</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Secure guard shifts and logs auditing</span>
                                </li>
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative flex items-center justify-center"
                        >
                            <div className="pointer-events-none absolute inset-0 rounded-full bg-[#FF7E67]/5 blur-[100px] filter"></div>
                            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100/30 p-2 shadow-2xl dark:border-slate-900 dark:bg-slate-950/20">
                                <img
                                    src="/assets/images/gate-checkpoint-scanner.png"
                                    alt="Guard scanning QR pass at estate gate"
                                    className="h-auto w-full max-w-md rounded-2xl object-cover brightness-[0.95] filter transition-transform duration-700 hover:scale-[1.03] dark:brightness-[0.8]"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Feature 2: Levy collections */}
                    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative order-2 flex items-center justify-center md:order-1"
                        >
                            <div className="pointer-events-none absolute inset-0 rounded-full bg-[#4F46E5]/5 blur-[100px] filter"></div>
                            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100/30 p-2 shadow-2xl dark:border-slate-900 dark:bg-slate-950/20">
                                <img
                                    src="/assets/images/admin-dashboard-mockup.png"
                                    alt="Kontrol Levy Collections ledger dashboard"
                                    className="h-auto w-full max-w-md rounded-2xl object-cover brightness-[0.95] filter transition-transform duration-700 hover:scale-[1.03] dark:brightness-[0.8]"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="order-1 flex flex-col gap-6 md:order-2"
                        >
                            <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#4F46E5] uppercase">
                                <FileText className="h-4 w-4 shrink-0" /> Financial Operations
                            </span>
                            <h2 className="text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Automated billing and levy collections.
                            </h2>
                            <p className="text-sm leading-relaxed font-medium text-slate-600 sm:text-base dark:text-slate-400">
                                Create, schedule, and track maintenance fees, security levies, or utility dues. Residents pay directly in the app, and
                                the system instantly reconciles ledger reports.
                            </p>
                            <ul className="dark:text-slate-355 mt-2 flex flex-col gap-3 text-xs text-slate-700">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Automated invoicing & payment reminders</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Direct Paystack secure integration</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Detailed exports & financial audit trails</span>
                                </li>
                            </ul>
                        </motion.div>
                    </div>

                    {/* Feature 3: SOS alarm */}
                    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col gap-6"
                        >
                            <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-red-500 uppercase">
                                <Bell className="h-4 w-4 shrink-0 animate-pulse" /> Emergency Broadcast
                            </span>
                            <h2 className="text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Immediate distress dispatch coordinates.
                            </h2>
                            <p className="text-sm leading-relaxed font-medium text-slate-600 sm:text-base dark:text-slate-400">
                                Keep your gatehouse alert. The second a resident triggers a panic alert, the gate scanner terminals emit a
                                high-pitched alarm, displaying the home address, resident names, and contact details instantly.
                            </p>
                            <ul className="dark:text-slate-355 mt-2 flex flex-col gap-3 text-xs text-slate-700">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Immediate sirens at gate terminals</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Failsafe visual layout displaying location coords</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>Instant co-admin SMS alert notifications</span>
                                </li>
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="group relative flex items-center justify-center overflow-hidden rounded-3xl border border-red-200 bg-red-50/50 p-8 shadow-2xl shadow-red-900/10 dark:border-red-950 dark:bg-red-950/10"
                        >
                            <div className="animate-pulse-slow absolute inset-0 bg-red-900/5"></div>
                            <div className="relative z-10 flex w-full max-w-sm flex-col gap-4 text-left font-mono">
                                <div className="border-red-250 flex items-center justify-between border-b pb-3 dark:border-red-900/40">
                                    <span className="flex animate-pulse items-center gap-1.5 text-[10px] font-bold tracking-widest text-red-500 uppercase">
                                        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-red-500"></span>
                                        Emergency SOS Active
                                    </span>
                                    <span className="text-[10px] text-slate-500">Terminal #01</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] text-slate-500 uppercase">Triggered Location</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">House 14B, Royal Crescent Street</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] text-slate-500 uppercase">Primary Owner</span>
                                    <span className="dark:text-slate-350 text-xs font-bold text-slate-700">Adeleke Cole (+234 803 123 4567)</span>
                                </div>
                                <div className="mt-3 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5">
                                    <Bell className="h-5 w-5 shrink-0 animate-bounce text-red-500" />
                                    <span className="text-red-650 text-[10px] font-bold tracking-wider uppercase dark:text-red-400">
                                        Siren broadcasting at checkpoint
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. STEP-BY-STEP ROLLOUT */}
            <section className="border-b border-slate-200 py-24 dark:border-slate-900/50">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto mb-16 flex max-w-2xl flex-col gap-4 text-center">
                        <span className="text-xs font-bold tracking-widest text-[#FF7E67] uppercase">Rollout Sequence</span>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                            Get started in four simple steps
                        </h2>
                        <p className="text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                            Setting up Kontrol for your estate takes less than a day with zero upfront hardware costs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        {rolloutSteps.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-slate-300 hover:bg-slate-100 dark:border-slate-950 dark:bg-[#0f172a]/10 dark:hover:border-slate-800/40 dark:hover:bg-[#0f172a]/20"
                            >
                                <div className="text-3xl font-black text-slate-300 transition-colors select-none group-hover:text-[#FF7E67]/30 dark:text-slate-800/40">
                                    {s.number}
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
                                <p className="text-slate-650 text-xs leading-relaxed font-medium dark:text-slate-400">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. CALLOUT / CTA BANNER */}
            <section className="py-24">
                <div className="mx-auto max-w-4xl px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[40px] border border-slate-200 bg-linear-to-br from-slate-50 to-white p-10 text-center shadow-2xl dark:border-[#FF7E67]/20 dark:from-[#0f172a]/80 dark:to-[#020617]"
                    >
                        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[#FF7E67]/5 blur-3xl filter"></div>

                        <div className="flex max-w-2xl flex-col gap-3">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                Ready to upgrade your estate security and operations?
                            </h3>
                            <p className="mx-auto max-w-lg text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                                Submit your application details, configure your billing settings, and instantly access your estate console dashboard.
                            </p>
                        </div>

                        <div className="mt-2 flex w-full flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                href="/apply"
                                className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FF7E67] px-8 py-4 text-center text-sm font-extrabold text-white shadow-lg transition-all hover:bg-[#ff8f7a]"
                            >
                                Onboard Your Estate
                                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>
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
