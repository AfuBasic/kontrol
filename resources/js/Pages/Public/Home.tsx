import { Link, Head } from '@inertiajs/react';
import { Player } from '@remotion/player';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Shield, Check, Smartphone, Users, AlertOctagon, Download, ArrowUpRight, Coins, QrCode, Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Header from '@/Components/Public/Header';
import { VisitorEntryAnimation, LeviesCollectionsAnimation, EmergencySOSAnimation } from '@/Components/Public/RemotionAnimations';

interface PlanFeature {
    name: string;
    slug: string;
    group: string;
    limit: string | null;
}

interface DBPlanConfig {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    formatted_price: string;
    billing_interval: 'quarterly' | 'semi-annually' | 'annually';
    is_featured: boolean;
    badge: string | null;
    color: string;
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    features: PlanFeature[];
}

interface Props {
    plans: DBPlanConfig[];
}

export default function Home({ plans }: Props) {
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'entry' | 'collections' | 'sos'>('entry');

    // Scroll progress for cinematic camera perspective parallax
    const { scrollY } = useScroll();
    const backgroundY = useTransform(scrollY, [0, 500], [0, 60]);
    const backgroundScale = useTransform(scrollY, [0, 500], [1.02, 1.08]);

    // Active floating card rotation index
    // 0 = Levy Card, 2 = Visitor Card, 4 = Access Card
    // 1, 3, 5 = Transition/Empty states
    const [activeCardIndex, setActiveCardIndex] = useState(0);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const runRotation = (index: number) => {
            setActiveCardIndex(index);
            // Even indexes (0, 2, 4) show a card -> active for 4.5 seconds
            // Odd indexes (1, 3, 5) show nothing -> active for 1.5 seconds
            const delay = index % 2 === 1 ? 1500 : 4500;
            timeoutId = setTimeout(() => {
                runRotation((index + 1) % 6);
            }, delay);
        };

        runRotation(0);
        return () => clearTimeout(timeoutId);
    }, []);

    // Set mount status
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const quarterlyPlan = plans.find((p) => p.billing_interval === 'quarterly');
    const semiAnnualPlan = plans.find((p) => p.billing_interval === 'semi-annually');
    const annualPlan = plans.find((p) => p.billing_interval === 'annually');

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>Kontrol - Modern Estate Access & Gated Community Control</title>
                <meta
                    name="description"
                    content="Automate gate code generation, guest authorizations, estate billing levies, and guard checkpoints using Kontrol."
                />
            </Head>
            <Header activePage="home" />
            {/* 1. HERO SECTION */}
            <section id="hero" className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-white pt-28 dark:bg-[#020617]">
                {/* Background Image - Absolute Positioned on the Right, blended to black on the left */}
                <div className="absolute inset-y-0 right-0 z-10 w-full overflow-hidden lg:w-[65%]">
                    <motion.div
                        style={{ y: backgroundY, scale: backgroundScale }}
                        animate={{
                            x: [0, -6, 0],
                            y: [0, -4, 0],
                        }}
                        transition={{
                            duration: 25,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatType: 'mirror',
                        }}
                        className="animate-pulse-slow h-full w-full"
                    >
                        <img 
                            src="/assets/images/estate-entrance-day.png" 
                            alt="Premium Gated Estate Entrance" 
                            className="block dark:hidden w-full h-full object-cover filter brightness-[0.98] contrast-[1.02] transition-all duration-300"
                        />
                        <img 
                            src="/assets/images/estate-entrance-night.png" 
                            alt="Premium Gated Estate Entrance" 
                            className="hidden dark:block w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] transition-all duration-300"
                        />
                    </motion.div>

                    {/* Blending Gradients - Light Mode */}
                    <div className="absolute inset-0 block dark:hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/50 to-transparent" style={{width: '55%'}} />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
                    </div>

                    {/* Blending Gradients - Dark Mode */}
                    <div className="absolute inset-0 hidden dark:block pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#020617]/60 to-transparent" style={{width: '65%'}} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-transparent to-transparent" />
                    </div>
                </div>

                <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-12">
                    <div className="grid h-full grid-cols-1 items-center gap-12 lg:grid-cols-12">
                        {/* Left Column Content */}
                        <div className="flex flex-col gap-6 text-left lg:col-span-7">
                            <span className="font-mono text-xs font-bold tracking-widest text-indigo-500 uppercase dark:text-indigo-400">
                                Modern Estate Management
                            </span>
                            <h1 className="text-4xl leading-[1.1] font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                                The easiest way to
                                <br />
                                manage your{' '}
                                <span className="bg-gradient-to-r from-indigo-500 via-indigo-300 to-[#FF7E67] bg-clip-text text-transparent dark:from-indigo-400 dark:via-indigo-200">
                                    estate.
                                </span>
                            </h1>
                            <p className="max-w-xl text-base leading-relaxed font-medium text-slate-600 sm:text-lg dark:text-slate-400">
                                Connect residents, estate managers, and gate security. Ditch paper logbooks, send instant gate codes, and collect
                                levies easily online.
                            </p>

                            <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
                                <Link
                                    href="/apply"
                                    className="flex w-full items-center justify-center gap-1.5 rounded border border-transparent bg-[#4F46E5] px-7 py-3.5 text-center text-xs font-bold tracking-widest text-white uppercase shadow-xl shadow-indigo-500/20 transition-all hover:bg-[#5c54f2] sm:w-auto"
                                >
                                    Get Started &rarr;
                                </Link>
                                <button
                                    onClick={() => scrollToSection('features')}
                                    className="dark:border-slate-850 flex w-full items-center justify-center gap-1.5 rounded border border-slate-200 bg-transparent px-7 py-3.5 text-xs font-bold tracking-widest text-slate-700 uppercase transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 sm:w-auto dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
                                >
                                    Explore Features
                                </button>
                            </div>

                            {/* Live estate activity row */}
                            <div className="mt-8 max-w-xl border-t border-slate-200 pt-6 dark:border-slate-900/60">
                                <div className="mb-4 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500"></span>
                                    Live Estate Activity
                                </div>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <div className="flex items-center gap-2">
                                        <div className="dark:border-slate-850 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                                            <Shield className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-slate-850 text-[10px] font-bold dark:text-slate-300">Access verified</div>
                                            <div className="text-[8px] text-slate-400 dark:text-slate-500">2:14 PM</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="dark:border-slate-850 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                                            <Coins className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-slate-850 text-[10px] font-bold dark:text-slate-300">Payment received</div>
                                            <div className="text-[8px] text-slate-400 dark:text-slate-500">2:15 PM</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="dark:border-slate-850 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                                            <Users className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-slate-850 text-[10px] font-bold dark:text-slate-300">Visitor logged</div>
                                            <div className="text-[8px] text-slate-400 dark:text-slate-500">2:16 PM</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="dark:border-slate-850 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                                            <Bell className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-slate-850 text-[10px] font-bold dark:text-slate-300">SOS resolved</div>
                                            <div className="text-[8px] text-slate-400 dark:text-slate-500">2:17 PM</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column Overlay Cards */}
                        <div className="pointer-events-none relative flex h-[380px] w-full items-center justify-center lg:col-span-5 lg:h-[450px]">
                            <AnimatePresence>
                                {/* Levy Paid successfully overlay */}
                                {activeCardIndex === 0 && (
                                    <motion.div
                                        key="levy-card"
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="dark:border-slate-850 pointer-events-auto absolute top-2 right-0 z-20 w-60 rounded-xl border border-slate-200 bg-white/90 p-3.5 shadow-2xl backdrop-blur-md sm:right-6 dark:bg-slate-950/80"
                                    >
                                        <motion.div
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                                            className="flex w-full items-start gap-3"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                                <Check className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-white">Levy Paid successfully</div>
                                                <div className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                                                    Villa 24 paid ₦15,000 Security Levy
                                                </div>
                                                <span className="mt-1 inline-block text-[9px] font-semibold text-emerald-400">1 min ago</span>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Visitor Checked In overlay */}
                                {activeCardIndex === 2 && (
                                    <motion.div
                                        key="visitor-card"
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="dark:border-slate-850 pointer-events-auto absolute bottom-28 left-0 z-20 w-60 rounded-xl border border-slate-200 bg-white/90 p-3.5 shadow-2xl backdrop-blur-md sm:left-4 dark:bg-slate-950/80"
                                    >
                                        <motion.div
                                            animate={{ y: [0, 8, 0] }}
                                            transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
                                            className="flex w-full items-start gap-3"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-[#FF7E67]">
                                                <Smartphone className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-white">Visitor Checked In</div>
                                                <div className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                                                    John Doe checked in at Main Gate
                                                </div>
                                                <span className="mt-1 inline-block text-[9px] font-semibold text-[#FF7E67]">Just now</span>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Access Granted Card overlay */}
                                {activeCardIndex === 4 && (
                                    <motion.div
                                        key="access-card"
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="pointer-events-auto absolute right-0 bottom-0 z-20 w-72 rounded-xl border border-indigo-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md sm:right-2 dark:border-indigo-500/30 dark:bg-slate-950/90"
                                    >
                                        <motion.div
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ repeat: Infinity, duration: 6.5, ease: 'easeInOut' }}
                                            className="flex w-full items-center gap-4"
                                        >
                                            <div className="flex flex-1 flex-col gap-1 font-mono text-[9px]">
                                                <span className="tracking-widest text-slate-500 uppercase">Access Granted</span>
                                                <span className="font-sans text-sm font-bold text-slate-900 dark:text-white">John Doe</span>
                                                <span className="mt-1 flex items-center gap-1 font-sans text-[10px] font-bold text-emerald-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    One-time entry
                                                </span>
                                            </div>
                                            <div className="relative shrink-0 rounded-lg bg-white p-1.5">
                                                <QrCode className="h-16 w-16 text-slate-950" />
                                                {/* Scan light effect */}
                                                <div className="absolute inset-x-0 top-0 h-0.5 animate-bounce bg-indigo-500 shadow-md shadow-indigo-500" />
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Stats Container block at the bottom */}
                <div className="z-20 mx-auto mb-16 w-full max-w-7xl px-6">
                    <div className="grid grid-cols-1 items-stretch gap-6 rounded-2xl border border-slate-200 bg-slate-50/65 p-6 backdrop-blur-md md:grid-cols-3 dark:border-slate-900 dark:bg-slate-950/60">
                        <div className="border-slate-250 flex flex-col gap-1 pr-6 md:border-r dark:border-slate-900/60">
                            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">99.9%</span>
                            <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Uptime SLA</span>
                            <span className="mt-1 text-xs text-slate-600 dark:text-slate-400">Always reliable community infrastructure.</span>
                        </div>
                        <div className="border-slate-250 flex flex-col gap-1 md:border-r md:px-6 dark:border-slate-900/60">
                            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">&lt; 3s</span>
                            <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Validation Time</span>
                            <span className="mt-1 text-xs text-slate-600 dark:text-slate-400">Lightning fast gate scans and logs.</span>
                        </div>
                        <div className="flex flex-col gap-1 md:pl-6">
                            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">100%</span>
                            <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">Audit Trail</span>
                            <span className="mt-1 text-xs text-slate-600 dark:text-slate-400">Complete transparency and digital accountability.</span>
                        </div>
                    </div>
                </div>
            </section>{' '}
            <section id="features" className="relative border-b border-slate-200 py-24 dark:border-slate-900">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mx-auto mb-16 flex max-w-3xl flex-col gap-4 text-center">
                        <span className="text-xs font-bold tracking-widest text-[#FF7E67] uppercase">How it works</span>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                            Simple for security, residents, and managers.
                        </h2>
                        <p className="text-base text-slate-600 sm:text-lg dark:text-slate-400">
                            No complicated systems to learn. Residents create codes, security scans at the gate, and managers oversee everything on a
                            clean dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
                        {/* Interactive Tab switches */}
                        <div className="flex flex-col gap-4 lg:col-span-6">
                            {/* Tab 1 */}
                            <button
                                onClick={() => setActiveTab('entry')}
                                className={`flex cursor-pointer items-start gap-5 rounded-2xl border p-6 text-left transition-all ${
                                    activeTab === 'entry'
                                        ? 'border-slate-200 bg-slate-100/70 shadow-xl dark:border-slate-800 dark:bg-[#0f172a]/40'
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-950/40'
                                }`}
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                        activeTab === 'entry'
                                            ? 'bg-[#4F46E5] text-white'
                                            : 'bg-slate-150 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                    }`}
                                >
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">01. Gate Access</span>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant Gate Codes</h3>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        Residents create visitor codes directly in the app. Security guards scan or type the code at the gate to
                                        verify in seconds.
                                    </p>
                                    <div className="mt-2.5">
                                        <Link
                                            href="/product/residents"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF7E67] hover:text-[#ff8f7a]"
                                        >
                                            Read Resident Guide <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                            </button>

                            {/* Tab 2 */}
                            <button
                                onClick={() => setActiveTab('collections')}
                                className={`flex cursor-pointer items-start gap-5 rounded-2xl border p-6 text-left transition-all ${
                                    activeTab === 'collections'
                                        ? 'border-slate-200 bg-slate-100/70 shadow-xl dark:border-slate-800 dark:bg-[#0f172a]/40'
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-950/40'
                                }`}
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                        activeTab === 'collections'
                                            ? 'bg-[#4F46E5] text-white'
                                            : 'bg-slate-150 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                    }`}
                                >
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">02. Payments</span>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Easy Levy Collections</h3>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        Collect estate levies, security dues, or electricity fees online. Residents pay securely inside the app and
                                        balances update instantly.
                                    </p>
                                    <div className="mt-2.5">
                                        <Link
                                            href="/product/estates"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF7E67] hover:text-[#ff8f7a]"
                                        >
                                            Read Estate Guide <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                            </button>

                            {/* Tab 3 */}
                            <button
                                onClick={() => setActiveTab('sos')}
                                className={`flex cursor-pointer items-start gap-5 rounded-2xl border p-6 text-left transition-all ${
                                    activeTab === 'sos'
                                        ? 'border-slate-200 bg-slate-100/70 shadow-xl dark:border-slate-800 dark:bg-[#0f172a]/40'
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-950/40'
                                }`}
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                        activeTab === 'sos'
                                            ? 'bg-[#4F46E5] text-white'
                                            : 'bg-slate-150 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                    }`}
                                >
                                    <AlertOctagon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">03. Emergency</span>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant Emergency Alerts</h3>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        Residents can trigger an emergency alert. The gate security is notified immediately with the resident's home
                                        address to send help fast.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Remotion Player loops */}
                        <div className="flex items-center justify-center lg:col-span-6">
                            {isMounted ? (
                                <div className="relative mx-auto flex h-[608px] w-[328px] items-center justify-center overflow-hidden rounded-[40px] border border-slate-200 bg-slate-50 p-6 shadow-2xl dark:border-slate-800/80 dark:bg-[#070b15]/60">
                                    <div className="absolute inset-0 rounded-[40px] bg-[#4F46E5]/5 blur-xl filter"></div>

                                    {activeTab === 'entry' && (
                                        <Player
                                            component={VisitorEntryAnimation}
                                            durationInFrames={120}
                                            fps={30}
                                            compositionWidth={280}
                                            compositionHeight={560}
                                            style={{
                                                width: '280px',
                                                height: '560px',
                                            }}
                                            loop
                                            autoPlay
                                            controls={false}
                                        />
                                    )}

                                    {activeTab === 'collections' && (
                                        <Player
                                            component={LeviesCollectionsAnimation}
                                            durationInFrames={120}
                                            fps={30}
                                            compositionWidth={280}
                                            compositionHeight={560}
                                            style={{
                                                width: '280px',
                                                height: '560px',
                                            }}
                                            loop
                                            autoPlay
                                            controls={false}
                                        />
                                    )}

                                    {activeTab === 'sos' && (
                                        <Player
                                            component={EmergencySOSAnimation}
                                            durationInFrames={120}
                                            fps={30}
                                            compositionWidth={280}
                                            compositionHeight={560}
                                            style={{
                                                width: '280px',
                                                height: '560px',
                                            }}
                                            loop
                                            autoPlay
                                            controls={false}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="h-[608px] w-[328px] animate-pulse rounded-[40px] bg-slate-200 dark:bg-slate-900"></div>
                            )}
                        </div>
                    </div>
                </div>
            </section>{' '}
            {/* 3. PLANS & PRICING */}
            <section id="pricing" className="relative border-b border-slate-200 py-24 dark:border-slate-900">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mx-auto mb-16 flex max-w-3xl flex-col gap-4 text-center">
                        <span className="text-xs font-bold tracking-widest text-[#4F46E5] uppercase">Plans & Pricing</span>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                            Simple, transparent pricing.
                        </h2>
                        <p className="text-base text-slate-600 sm:text-lg dark:text-slate-400">
                            Choose the plan that fits your community size and operations.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3">
                        {/* Pro - Quarterly Column */}
                        {quarterlyPlan && (
                            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/50 p-8 transition-all hover:border-slate-300 dark:border-slate-900 dark:bg-[#0f172a]/20 dark:hover:border-slate-800">
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{quarterlyPlan.name}</h3>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Complete access control and premium features, billed quarterly.
                                        </p>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-1.5">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-slate-900 dark:text-white">
                                                ₦{(quarterlyPlan.price / 100).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">/ quarter</span>
                                        </div>
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">₦5,000 / month equivalent</div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Billed quarterly</span>
                                    <hr className="my-2 border-slate-200 dark:border-slate-900" />
                                    <ul className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Unlimited active resident units</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Unlimited security guards & admins</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Instant visitor gate codes</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Security guard scanner app</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Easy levy collections & payments</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Telegram bot access codes</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link
                                    href={`/apply?plan_id=${quarterlyPlan.id}`}
                                    className="mt-8 w-full rounded-xl border border-transparent bg-slate-900 py-3.5 text-center text-xs font-bold text-white transition-colors hover:bg-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Pro - Semi-Annually Column */}
                        {semiAnnualPlan && (
                            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-indigo-200 bg-slate-50 p-8 shadow-2xl dark:border-[#4F46E5]/40 dark:bg-[#0f172a]/30">
                                {semiAnnualPlan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4F46E5] px-3 py-1 text-[9px] font-extrabold tracking-widest text-white uppercase">
                                        {semiAnnualPlan.badge}
                                    </div>
                                )}
                                <div className="absolute top-0 right-6 rounded-b-lg bg-[#FF7E67] px-3 py-2 text-[10px] font-black tracking-wider text-white uppercase shadow-lg">
                                    Save 10%
                                </div>
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{semiAnnualPlan.name}</h3>
                                        <p className="text-slate-650 mt-1 text-xs dark:text-slate-400">
                                            Complete access control and premium features, billed semi-annually.
                                        </p>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-1.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-slate-900 dark:text-white">
                                                ₦{(semiAnnualPlan.price / 100).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">/ 6 months</span>
                                            <span className="text-xs text-slate-400 line-through dark:text-slate-500">₦30,000</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            <span>₦4,500 / month equivalent</span>
                                            <span className="rounded bg-[#4F46E5]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#4F46E5]">
                                                Save 10%
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-extrabold tracking-wider text-[#4F46E5] uppercase">Billed semi-annually</span>
                                    <hr className="my-2 border-slate-200 dark:border-slate-900" />
                                    <ul className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7E67]" />
                                            <span className="text-slate-800 dark:text-slate-200">Unlimited active resident units</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7E67]" />
                                            <span className="text-slate-800 dark:text-slate-200">Unlimited security guards & admins</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7E67]" />
                                            <span className="text-slate-800 dark:text-slate-200">Instant visitor gate codes & scanner app</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Easy levy collections & payments</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Security roster management</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Telegram bot access codes</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link
                                    href={`/apply?plan_id=${semiAnnualPlan.id}`}
                                    className="mt-8 w-full rounded-xl bg-[#FF7E67] py-3.5 text-center text-xs font-extrabold text-white shadow-lg transition-colors hover:bg-[#ff8f7a]"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Pro - Annually Column */}
                        {annualPlan && (
                            <div className="relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/50 p-8 transition-all hover:border-slate-300 dark:border-slate-900 dark:bg-[#0f172a]/20 dark:hover:border-slate-800">
                                {annualPlan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-[9px] font-extrabold tracking-widest text-white uppercase">
                                        {annualPlan.badge}
                                    </div>
                                )}
                                <div className="absolute top-0 right-6 rounded-b-lg bg-emerald-500 px-3 py-2 text-[10px] font-black tracking-wider text-white uppercase shadow-lg">
                                    Save 20%
                                </div>
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{annualPlan.name}</h3>
                                        <p className="text-slate-650 mt-1 text-xs dark:text-slate-400">
                                            Complete access control and premium features, billed annually.
                                        </p>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-1.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-slate-900 dark:text-white">
                                                ₦{(annualPlan.price / 100).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">/ year</span>
                                            <span className="text-xs text-slate-400 line-through dark:text-slate-500">₦60,000</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            <span>₦4,000 / month equivalent</span>
                                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                Save 20%
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-extrabold tracking-wider text-emerald-600 uppercase dark:text-emerald-500">
                                        Billed annually
                                    </span>
                                    <hr className="my-2 border-slate-200 dark:border-slate-900" />
                                    <ul className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Unlimited active resident units</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Unlimited security guards & admins</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Everything in Semi-Annually</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Priority onboarding & support</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Dedicated account manager</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>Telegram bot access codes</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link
                                    href={`/apply?plan_id=${annualPlan.id}`}
                                    className="mt-8 w-full rounded-xl border border-transparent bg-slate-900 py-3.5 text-center text-xs font-bold text-white transition-colors hover:bg-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            {/* 4. DEPLOYMENT & DOWNLOAD NODE */}
            <section
                id="download"
                className="relative overflow-hidden bg-gradient-to-t from-slate-100 to-slate-50 py-24 dark:from-[#01030a] dark:to-[#020617]"
            >
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F46E5]/5 blur-[120px] filter"></div>

                <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 px-6 text-center">
                    <span className="text-xs font-bold tracking-widest text-[#FF7E67] uppercase">Download the app</span>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">Get started in minutes.</h2>
                    <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-400">
                        Download the resident app for iOS or Android, or download the checkpoint app for your gate security guards.
                    </p>

                    <div className="mx-auto mt-6 grid w-full max-w-2xl grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Apple Store */}
                        <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md transition-all hover:border-slate-300 dark:border-slate-900 dark:bg-[#0f172a]/20 dark:hover:border-slate-800">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white">
                                <svg className="h-8 w-8 fill-current text-slate-950 dark:text-white" viewBox="0 0 24 24">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.92.99-3.03-.96.04-2.13.64-2.82 1.45-.59.69-1.11 1.83-1.01 2.91.95.07 2.05-.56 2.84-1.33z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Apple iOS</h4>
                                <span className="mt-0.5 block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                    Compatible with iOS 15+
                                </span>
                                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Generate access codes, settle levies, and get emergency alerts directly on your Apple device.
                                </p>
                            </div>
                            <button className="mt-auto flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-3.5 text-xs font-bold text-slate-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                App Store Coming Soon
                            </button>
                        </div>

                        {/* Google Play */}
                        <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md transition-all hover:border-slate-300 dark:border-slate-900 dark:bg-[#0f172a]/20 dark:hover:border-slate-800">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white">
                                <svg className="h-7 w-7 fill-current text-slate-950 dark:text-white" viewBox="0 0 24 24">
                                    <path d="M3.609 1.814L13.792 12 3.61 22.186c-.18.18-.32.14-.32-.1V1.916c0-.24.14-.28.32-.1zm11.296 9.17l2.566-2.566-13.06-7.462 10.494 10.028zm2.94 1.016c.496-.283.496-.745 0-1.028L15.348 9.42l-2.484 2.58 2.484 2.58 2.497-1.428zm-2.94 1.016L4.405 23.044l13.06-7.462-10.494-10.028z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Google Android</h4>
                                <span className="mt-0.5 block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                    Compatible with Android 10+
                                </span>
                                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Run guard patrols, register visitor passes, and view logs cleanly on your Android phone.
                                </p>
                            </div>
                            <button className="mt-auto flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-3.5 text-xs font-bold text-slate-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                Play Store Coming Soon
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12 text-xs text-slate-500 dark:border-slate-950 dark:bg-[#010308]">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden h-6 w-auto dark:block" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block h-6 w-auto dark:hidden" />
                        <span className="text-slate-650 text-[10px] font-medium dark:text-slate-600">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <a href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Privacy Policy
                        </a>
                        <a href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Terms of Use
                        </a>
                        <a href="/contact" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Contact Support
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
