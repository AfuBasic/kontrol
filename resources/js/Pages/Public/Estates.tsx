import { Link, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Building2, 
    QrCode, 
    FileText, 
    Bell, 
    ArrowRight, 
    CheckCircle2
} from 'lucide-react';
import React, { useEffect } from 'react';
import Header from '@/Components/Public/Header';

export default function Estates() {
    // Set mount status
    useEffect(() => {
        // Mounted
    }, []);

    const rolloutSteps = [
        {
            number: "01",
            title: "Register Your Estate",
            desc: "Submit your community configuration, billing rules, and administrator contact details in minutes."
        },
        {
            number: "02",
            title: "Map Streets & Units",
            desc: "Register streets, add housing unit addresses, and invite co-administrators to manage the portal."
        },
        {
            number: "03",
            title: "Deploy Gate Terminal",
            desc: "Download our companion guard app on any low-cost Android device and place it at your checkpoints."
        },
        {
            number: "04",
            title: "Invite Residents",
            desc: "Add residents directly or share a secure invite link to let them register and access passes."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#FF7E67]/30 selection:text-white overflow-hidden pb-12 transition-colors duration-300">
            <Head>
                <title>For Estates & Gated Communities - Kontrol Operations</title>
                <meta name="description" content="Deploy digital checkpoint systems, manage gate security, track logs, and automate levy collections for your gated community." />
            </Head>

            {/* Persistent Header */}
            <Header activePage="estates" />

            {/* 1. HERO SECTION */}
            <section className="relative pt-40 pb-20 overflow-hidden border-b border-slate-200 dark:border-slate-900/50">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4F46E5]/10 rounded-full filter blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-[#FF7E67]/5 rounded-full filter blur-[120px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center gap-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4F46E5]/15 border border-[#4F46E5]/30 text-indigo-650 dark:text-[#818cf8] text-xs font-bold self-center"
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        Gated Community Operations
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight max-w-4xl"
                    >
                        Modern operations for <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 via-indigo-350 to-[#FF7E67] dark:from-indigo-400 dark:via-indigo-200">estate managers.</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl font-medium leading-relaxed"
                    >
                        Control visitor access, track real-time security logs, broadcast community notices, and automate your levy collections. All from a single unified management dashboard.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-2"
                    >
                        <Link 
                            href="/apply" 
                            className="px-8 py-4 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10 group cursor-pointer"
                        >
                            Onboard Your Estate
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Interactive 3D Perspective Hero Image */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40, rotateX: 12 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        style={{ transformPerspective: 1200 }}
                        className="mt-16 w-full rounded-2xl border border-slate-200 dark:border-slate-900 bg-slate-100/40 dark:bg-slate-950/40 p-2 shadow-2xl shadow-[#4F46E5]/10 dark:shadow-[#4F46E5]/5 relative group"
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent dark:from-[#020617] z-10 pointer-events-none rounded-xl"></div>
                        <img 
                            src="/assets/images/admin-dashboard-mockup.png" 
                            alt="Kontrol Admin Dashboard Console" 
                            className="w-full h-auto rounded-xl filter brightness-[0.95] dark:brightness-[0.8] dark:group-hover:brightness-[0.95] transition-all duration-700"
                        />
                    </motion.div>
                </div>
            </section>

            {/* 2. CORE FEATURES ALTERNATING SECTION */}
            <section className="py-24 border-b border-slate-200 dark:border-slate-900/50">
                <div className="max-w-6xl mx-auto px-6 flex flex-col gap-28">
                    
                    {/* Feature 1: Gate terminal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col gap-6"
                        >
                            <span className="text-xs font-bold text-[#FF7E67] tracking-widest uppercase flex items-center gap-1.5">
                                <QrCode className="w-4 h-4 shrink-0" /> Checkpoint Control
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                Verify guest passes in 3 seconds flat.
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                                Equip your gate checkpoints with our digital terminal app. Guards scan resident-generated guest codes to verify visitor status and register check-ins instantly, eliminating vehicle backups.
                            </p>
                            <ul className="flex flex-col gap-3 text-xs text-slate-700 dark:text-slate-355 mt-2">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Fast offline-capable pass scanning</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Live activity telemetry logs</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
                            <div className="absolute inset-0 bg-[#FF7E67]/5 rounded-full filter blur-[100px] pointer-events-none"></div>
                            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-900 bg-slate-100/30 dark:bg-slate-950/20 p-2 overflow-hidden shadow-2xl">
                                <img 
                                    src="/assets/images/gate-checkpoint-scanner.png" 
                                    alt="Guard scanning QR pass at estate gate" 
                                    className="w-full max-w-md h-auto rounded-2xl object-cover filter brightness-[0.95] dark:brightness-[0.8] hover:scale-[1.03] transition-transform duration-700"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Feature 2: Levy collections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative flex items-center justify-center md:order-1 order-2"
                        >
                            <div className="absolute inset-0 bg-[#4F46E5]/5 rounded-full filter blur-[100px] pointer-events-none"></div>
                            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-900 bg-slate-100/30 dark:bg-slate-950/20 p-2 overflow-hidden shadow-2xl">
                                <img 
                                    src="/assets/images/admin-dashboard-mockup.png" 
                                    alt="Kontrol Levy Collections ledger dashboard" 
                                    className="w-full max-w-md h-auto rounded-2xl object-cover filter brightness-[0.95] dark:brightness-[0.8] hover:scale-[1.03] transition-transform duration-700"
                                />
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col gap-6 md:order-2 order-1"
                        >
                            <span className="text-xs font-bold text-[#4F46E5] tracking-widest uppercase flex items-center gap-1.5">
                                <FileText className="w-4 h-4 shrink-0" /> Financial Operations
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                Automated billing and levy collections.
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                                Create, schedule, and track maintenance fees, security levies, or utility dues. Residents pay directly in the app, and the system instantly reconciles ledger reports.
                            </p>
                            <ul className="flex flex-col gap-3 text-xs text-slate-700 dark:text-slate-355 mt-2">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Automated invoicing & payment reminders</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Direct Paystack secure integration</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Detailed exports & financial audit trails</span>
                                </li>
                            </ul>
                        </motion.div>
                    </div>

                    {/* Feature 3: SOS alarm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col gap-6"
                        >
                            <span className="text-xs font-bold text-red-500 tracking-widest uppercase flex items-center gap-1.5">
                                <Bell className="w-4 h-4 shrink-0 animate-pulse" /> Emergency Broadcast
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                Immediate distress dispatch coordinates.
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                                Keep your gatehouse alert. The second a resident triggers a panic alert, the gate scanner terminals emit a high-pitched alarm, displaying the home address, resident names, and contact details instantly.
                            </p>
                            <ul className="flex flex-col gap-3 text-xs text-slate-700 dark:text-slate-355 mt-2">
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Immediate sirens at gate terminals</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Failsafe visual layout displaying location coords</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Instant co-admin SMS alert notifications</span>
                                </li>
                            </ul>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="relative flex items-center justify-center p-8 border border-red-200 dark:border-red-950 bg-red-50/50 dark:bg-red-950/10 rounded-3xl overflow-hidden group shadow-2xl shadow-red-900/10"
                        >
                            <div className="absolute inset-0 bg-red-900/5 animate-pulse-slow"></div>
                            <div className="w-full max-w-sm flex flex-col gap-4 text-left font-mono relative z-10">
                                <div className="flex items-center justify-between border-b border-red-250 dark:border-red-900/40 pb-3">
                                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
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
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Adeleke Cole (+234 803 123 4567)</span>
                                </div>
                                <div className="mt-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-red-500 animate-bounce shrink-0" />
                                    <span className="text-[10px] text-red-650 dark:text-red-400 font-bold uppercase tracking-wider">
                                        Siren broadcasting at checkpoint
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </section>

            {/* 3. STEP-BY-STEP ROLLOUT */}
            <section className="py-24 border-b border-slate-200 dark:border-slate-900/50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
                        <span className="text-xs font-bold text-[#FF7E67] tracking-widest uppercase">Rollout Sequence</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Get started in four simple steps
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                            Setting up Kontrol for your estate takes less than a day with zero upfront hardware costs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {rolloutSteps.map((s, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="p-6 bg-slate-50 dark:bg-[#0f172a]/10 border border-slate-200 dark:border-slate-950 rounded-2xl flex flex-col gap-4 relative group hover:border-slate-300 dark:hover:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-[#0f172a]/20 transition-all"
                            >
                                <div className="text-3xl font-black text-slate-300 dark:text-slate-800/40 group-hover:text-[#FF7E67]/30 transition-colors select-none">{s.number}</div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
                                <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. CALLOUT / CTA BANNER */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="p-10 bg-linear-to-br from-slate-50 to-white dark:from-[#0f172a]/80 dark:to-[#020617] border border-slate-200 dark:border-[#FF7E67]/20 rounded-[40px] flex flex-col items-center text-center justify-between gap-6 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF7E67]/5 rounded-full filter blur-3xl"></div>
                        
                        <div className="max-w-2xl flex flex-col gap-3">
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Ready to upgrade your estate security and operations?
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-lg mx-auto">
                                Submit your application details, configure your billing settings, and instantly access your estate console dashboard.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full justify-center">
                            <Link 
                                href="/apply" 
                                className="px-8 py-4 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-sm rounded-xl text-center shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                            >
                                Onboard Your Estate
                                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-[#020617] border-t border-slate-200 dark:border-slate-900 py-12 text-slate-500 text-xs">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/assets/images/kontrol-white-logo-new.png" 
                            alt="Kontrol" 
                            className="hidden dark:block h-6 w-auto" 
                        />
                        <img 
                            src="/assets/images/kontrol.png" 
                            alt="Kontrol" 
                            className="block dark:hidden h-6 w-auto" 
                        />
                        <span className="text-[10px] text-slate-650 dark:text-slate-600 font-medium">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300">Terms of Use</Link>
                        <Link href="/contact" className="hover:text-slate-900 dark:hover:text-slate-300">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
