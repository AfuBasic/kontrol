import { Link, Head } from '@inertiajs/react';
import { Player } from '@remotion/player';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
    Shield, 
    Check, 
    Smartphone, 
    Users, 
    AlertOctagon, 
    Download, 
    ArrowUpRight, 
    Coins, 
    QrCode,
    Bell
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Header from '@/Components/Public/Header';
import { 
    VisitorEntryAnimation, 
    LeviesCollectionsAnimation, 
    EmergencySOSAnimation 
} from '@/Components/Public/RemotionAnimations';

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



    // Force dark mode background on public pages and clean up on unmount
    useEffect(() => {
        setIsMounted(true);
        document.documentElement.style.setProperty('background-color', '#020617', 'important');
        document.body.style.setProperty('background-color', '#020617', 'important');
        document.body.style.setProperty('color', '#f8fafc', 'important');
        
        return () => {
            document.documentElement.style.removeProperty('background-color');
            document.body.style.removeProperty('background-color');
            document.body.style.removeProperty('color');
        };
    }, []);

    const quarterlyPlan = plans.find(p => p.billing_interval === 'quarterly');
    const semiAnnualPlan = plans.find(p => p.billing_interval === 'semi-annually');
    const annualPlan = plans.find(p => p.billing_interval === 'annually');

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-[#FF7E67]/30 selection:text-white">
            <Head>
                <title>Kontrol - Modern Estate Access & Gated Community Control</title>
                <meta name="description" content="Automate gate code generation, guest authorizations, estate billing levies, and guard checkpoints using Kontrol." />
            </Head>

            <Header activePage="home" />

            {/* 1. HERO SECTION */}
            <section id="hero" className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#020617] pt-28">
                {/* Background Image - Absolute Positioned on the Right, blended to black on the left */}
                <div className="absolute inset-y-0 right-0 w-full lg:w-[65%] z-10 overflow-hidden">
                    <motion.div 
                        style={{ y: backgroundY, scale: backgroundScale }}
                        animate={{
                            x: [0, -6, 0],
                            y: [0, -4, 0],
                        }}
                        transition={{
                            duration: 25,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatType: "mirror"
                        }}
                        className="w-full h-full animate-pulse-slow"
                    >
                        <img 
                            src="/assets/images/estate-entrance-night.png" 
                            alt="Premium Gated Estate Entrance" 
                            className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05]"
                        />
                    </motion.div>
                    
                    {/* Blending Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/95 via-[#020617]/50 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/40 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="max-w-7xl mx-auto px-6 w-full flex-1 flex flex-col justify-center py-12 z-20 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center h-full">
                        {/* Left Column Content */}
                        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase font-mono">
                                Modern Estate Management
                            </span>
                            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
                                The easiest way to<br />
                                manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-[#FF7E67]">estate.</span>
                            </h1>
                            <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed max-w-xl">
                                Connect residents, estate managers, and gate security. Ditch paper logbooks, send instant gate codes, and collect levies easily online.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                                <Link 
                                    href="/apply"
                                    className="w-full sm:w-auto px-7 py-3.5 bg-[#4F46E5] hover:bg-[#5c54f2] text-white font-bold text-xs rounded border border-transparent tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-indigo-500/20 text-center"
                                >
                                    Get Started &rarr;
                                </Link>
                                <button
                                    onClick={() => scrollToSection('features')}
                                    className="w-full sm:w-auto px-7 py-3.5 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white font-bold text-xs rounded border border-slate-850 hover:border-slate-700 tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                                >
                                    Explore Features
                                </button>
                            </div>

                            {/* Live estate activity row */}
                            <div className="mt-8 border-t border-slate-900/60 pt-6 max-w-xl">
                                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-4 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Live Estate Activity
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-850 flex items-center justify-center text-slate-400">
                                            <Shield className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-300">Access verified</div>
                                            <div className="text-[8px] text-slate-500">2:14 PM</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-850 flex items-center justify-center text-slate-400">
                                            <Coins className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-300">Payment received</div>
                                            <div className="text-[8px] text-slate-500">2:15 PM</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-850 flex items-center justify-center text-slate-400">
                                            <Users className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-300">Visitor logged</div>
                                            <div className="text-[8px] text-slate-500">2:16 PM</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-850 flex items-center justify-center text-slate-400">
                                            <Bell className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-300">SOS resolved</div>
                                            <div className="text-[8px] text-slate-500">2:17 PM</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column Overlay Cards */}
                        <div className="lg:col-span-5 relative h-[380px] lg:h-[450px] w-full flex items-center justify-center pointer-events-none">
                            <AnimatePresence>
                                {/* Levy Paid successfully overlay */}
                                {activeCardIndex === 0 && (
                                    <motion.div 
                                        key="levy-card"
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="absolute top-2 right-0 sm:right-6 z-20 bg-slate-950/80 backdrop-blur-md border border-slate-850 rounded-xl p-3.5 shadow-2xl w-60 pointer-events-auto"
                                    >
                                        <motion.div
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                            className="flex gap-3 items-start w-full"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white">Levy Paid successfully</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">Villa 24 paid ₦15,000 Security Levy</div>
                                                <span className="text-[9px] text-emerald-400 font-semibold mt-1 inline-block">1 min ago</span>
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
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="absolute bottom-28 left-0 sm:left-4 z-20 bg-slate-950/80 backdrop-blur-md border border-slate-850 rounded-xl p-3.5 shadow-2xl w-60 pointer-events-auto"
                                    >
                                        <motion.div
                                            animate={{ y: [0, 8, 0] }}
                                            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                                            className="flex gap-3 items-start w-full"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF7E67] shrink-0">
                                                <Smartphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white">Visitor Checked In</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">John Doe checked in at Main Gate</div>
                                                <span className="text-[9px] text-[#FF7E67] font-semibold mt-1 inline-block">Just now</span>
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
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="absolute bottom-0 right-0 sm:right-2 z-20 bg-slate-950/90 backdrop-blur-md border border-indigo-500/30 rounded-xl p-4 shadow-2xl w-72 pointer-events-auto"
                                    >
                                        <motion.div
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
                                            className="w-full flex gap-4 items-center"
                                        >
                                            <div className="flex-1 flex flex-col gap-1 font-mono text-[9px]">
                                                <span className="text-slate-500 uppercase tracking-widest">Access Granted</span>
                                                <span className="text-sm font-bold text-white font-sans">John Doe</span>
                                                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-1 font-sans text-[10px]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    One-time entry
                                                </span>
                                            </div>
                                            <div className="relative bg-white p-1.5 rounded-lg shrink-0">
                                                <QrCode className="w-16 h-16 text-slate-950" />
                                                {/* Scan light effect */}
                                                <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500 shadow-md shadow-indigo-500 animate-bounce" />
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Stats Container block at the bottom */}
                <div className="max-w-7xl mx-auto px-6 w-full z-20 mb-16">
                    <div className="bg-slate-950/60 backdrop-blur-md border border-slate-900 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        <div className="flex flex-col gap-1 md:border-r border-slate-900/60 pr-6">
                            <span className="text-2xl font-black text-white font-mono">99.9%</span>
                            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Uptime SLA</span>
                            <span className="text-xs text-slate-400 mt-1">Always reliable community infrastructure.</span>
                        </div>
                        <div className="flex flex-col gap-1 md:border-r border-slate-900/60 md:px-6">
                            <span className="text-2xl font-black text-white font-mono">&lt; 3s</span>
                            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Validation Time</span>
                            <span className="text-xs text-slate-400 mt-1">Lightning fast gate scans and logs.</span>
                        </div>
                        <div className="flex flex-col gap-1 md:pl-6">
                            <span className="text-2xl font-black text-white font-mono">100%</span>
                            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Audit Trail</span>
                            <span className="text-xs text-slate-400 mt-1">Complete transparency and digital accountability.</span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="py-24 border-b border-slate-900 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
                        <span className="text-xs font-bold text-[#FF7E67] tracking-widest uppercase">How it works</span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            Simple for security, residents, and managers.
                        </h2>
                        <p className="text-base sm:text-lg text-slate-400">
                            No complicated systems to learn. Residents create codes, security scans at the gate, and managers oversee everything on a clean dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        {/* Interactive Tab switches */}
                        <div className="lg:col-span-6 flex flex-col gap-4">
                            {/* Tab 1 */}
                            <button 
                                onClick={() => setActiveTab('entry')}
                                className={`text-left p-6 rounded-2xl border transition-all flex gap-5 items-start ${
                                    activeTab === 'entry' 
                                        ? 'bg-[#0f172a]/40 border-slate-800 shadow-xl' 
                                        : 'border-transparent hover:bg-slate-950/40'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    activeTab === 'entry' ? 'bg-[#4F46E5] text-white' : 'bg-slate-900 text-slate-400'
                                }`}>
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">01. Gate Access</span>
                                    <h3 className="text-lg font-bold text-white">Instant Gate Codes</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Residents create visitor codes directly in the app. Security guards scan or type the code at the gate to verify in seconds.
                                    </p>
                                    <div className="mt-2.5">
                                        <Link href="/product/residents" className="text-xs font-bold text-[#FF7E67] hover:text-[#ff8f7a] inline-flex items-center gap-1">
                                            Read Resident Guide <ArrowUpRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            </button>

                            {/* Tab 2 */}
                            <button 
                                onClick={() => setActiveTab('collections')}
                                className={`text-left p-6 rounded-2xl border transition-all flex gap-5 items-start ${
                                    activeTab === 'collections' 
                                        ? 'bg-[#0f172a]/40 border-slate-800 shadow-xl' 
                                        : 'border-transparent hover:bg-slate-950/40'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    activeTab === 'collections' ? 'bg-[#4F46E5] text-white' : 'bg-slate-900 text-slate-400'
                                }`}>
                                    <Coins className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">02. Payments</span>
                                    <h3 className="text-lg font-bold text-white">Easy Levy Collections</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Collect estate levies, security dues, or electricity fees online. Residents pay securely inside the app and balances update instantly.
                                    </p>
                                    <div className="mt-2.5">
                                        <Link href="/product/estates" className="text-xs font-bold text-[#FF7E67] hover:text-[#ff8f7a] inline-flex items-center gap-1">
                                            Read Estate Guide <ArrowUpRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            </button>

                            {/* Tab 3 */}
                            <button 
                                onClick={() => setActiveTab('sos')}
                                className={`text-left p-6 rounded-2xl border transition-all flex gap-5 items-start ${
                                    activeTab === 'sos' 
                                        ? 'bg-[#0f172a]/40 border-slate-800 shadow-xl' 
                                        : 'border-transparent hover:bg-slate-950/40'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    activeTab === 'sos' ? 'bg-[#4F46E5] text-white' : 'bg-slate-900 text-slate-400'
                                }`}>
                                    <AlertOctagon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">03. Emergency</span>
                                    <h3 className="text-lg font-bold text-white">Instant Emergency Alerts</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Residents can trigger an emergency alert. The gate security is notified immediately with the resident's home address to send help fast.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Remotion Player loops */}
                        <div className="lg:col-span-6 flex justify-center items-center">
                            {isMounted ? (
                                <div className="relative border border-slate-800/80 bg-[#070b15]/60 rounded-[40px] p-6 shadow-2xl w-[328px] h-[608px] mx-auto overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-[#4F46E5]/5 rounded-[40px] filter blur-xl"></div>
                                    
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
                                <div className="w-[328px] h-[608px] bg-slate-900 animate-pulse rounded-[40px]"></div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. PLANS & PRICING */}
            <section id="pricing" className="py-24 border-b border-slate-900 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
                        <span className="text-xs font-bold text-[#4F46E5] tracking-widest uppercase">Plans & Pricing</span>
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            Simple, transparent pricing.
                        </h2>
                        <p className="text-base sm:text-lg text-slate-400">
                            Choose the plan that fits your community size and operations.
                        </p>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {/* Pro - Quarterly Column */}
                        {quarterlyPlan && (
                            <div className="bg-[#0f172a]/20 border border-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-800 transition-all">
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{quarterlyPlan.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Complete access control and premium features, billed quarterly.</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-4xl font-black text-white">₦{(quarterlyPlan.price / 100).toLocaleString()}</span>
                                        <span className="text-xs text-slate-400">/ quarter</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                        Billed {quarterlyPlan.billing_interval}
                                    </span>
                                    <hr className="border-slate-900 my-2" />
                                    <ul className="flex flex-col gap-3 text-xs text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Unlimited active resident units</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Unlimited security guards & admins</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Instant visitor gate codes</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Security guard scanner app</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Easy levy collections & payments</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Telegram bot access codes</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link 
                                    href={`/apply?plan_id=${quarterlyPlan.id}`}
                                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 text-center transition-colors mt-8"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Pro - Semi-Annually Column */}
                        {semiAnnualPlan && (
                            <div className="bg-[#0f172a]/30 border-2 border-[#4F46E5]/40 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl">
                                {semiAnnualPlan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#4F46E5] text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full">
                                        {semiAnnualPlan.badge}
                                    </div>
                                )}
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{semiAnnualPlan.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Complete access control and premium features, billed semi-annually.</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-4xl font-black text-white">₦{(semiAnnualPlan.price / 100).toLocaleString()}</span>
                                        <span className="text-xs text-slate-400">/ 6 months</span>
                                    </div>
                                    <span className="text-[10px] text-[#4F46E5] font-extrabold uppercase tracking-wider">
                                        Billed semi-annually (Save 10%)
                                    </span>
                                    <hr className="border-slate-900 my-2" />
                                    <ul className="flex flex-col gap-3 text-xs text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-[#FF7E67] shrink-0 mt-0.5" />
                                            <span className="text-slate-200">Unlimited active resident units</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-[#FF7E67] shrink-0 mt-0.5" />
                                            <span className="text-slate-200">Unlimited security guards & admins</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-[#FF7E67] shrink-0 mt-0.5" />
                                            <span className="text-slate-200">Instant visitor gate codes & scanner app</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Easy levy collections & payments</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Security roster management</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Telegram bot access codes</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link 
                                    href={`/apply?plan_id=${semiAnnualPlan.id}`}
                                    className="w-full py-3.5 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-xs rounded-xl text-center shadow-lg transition-colors mt-8"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Pro - Annually Column */}
                        {annualPlan && (
                            <div className="bg-[#0f172a]/20 border border-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-800 transition-all">
                                {annualPlan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full">
                                        {annualPlan.badge}
                                    </div>
                                )}
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{annualPlan.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Complete access control and premium features, billed annually.</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-4xl font-black text-white">₦{(annualPlan.price / 100).toLocaleString()}</span>
                                        <span className="text-xs text-slate-400">/ year</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider">
                                        Billed annually (Save 20%)
                                    </span>
                                    <hr className="border-slate-900 my-2" />
                                    <ul className="flex flex-col gap-3 text-xs text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Unlimited active resident units</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Unlimited security guards & admins</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Everything in Semi-Annually</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Priority onboarding & support</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Dedicated account manager</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>Telegram bot access codes</span>
                                        </li>
                                    </ul>
                                </div>
                                <Link 
                                    href={`/apply?plan_id=${annualPlan.id}`}
                                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 text-center transition-colors mt-8"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 4. DEPLOYMENT & DOWNLOAD NODE */}
            <section id="download" className="py-24 relative overflow-hidden bg-gradient-to-t from-[#01030a] to-[#020617]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4F46E5]/5 rounded-full filter blur-[120px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto px-6 text-center flex flex-col gap-8 relative z-10">
                    <span className="text-xs font-bold text-[#FF7E67] tracking-widest uppercase">Download the app</span>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        Get started in minutes.
                    </h2>
                    <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
                        Download the resident app for iOS or Android, or download the checkpoint app for your gate security guards.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto w-full mt-6">
                        {/* Apple Store */}
                        <div className="bg-[#0f172a]/30 border border-slate-900 rounded-2xl p-6 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Apple iOS App</h4>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mt-0.5">Compatible with iOS 15+</span>
                            </div>
                            <button className="w-full py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed">
                                <Download className="w-3.5 h-3.5" /> App Store Coming
                            </button>
                        </div>

                        {/* Google Play */}
                        <div className="bg-[#0f172a]/30 border border-slate-900 rounded-2xl p-6 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Google Android</h4>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mt-0.5">Compatible with Android 10+</span>
                            </div>
                            <button className="w-full py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed">
                                <Download className="w-3.5 h-3.5" /> Play Store Coming
                            </button>
                        </div>

                        {/* Direct APK */}
                        <div className="bg-[#0f172a]/40 border border-[#FF7E67]/30 rounded-2xl p-6 flex flex-col items-center gap-4 relative">
                            <div className="absolute -top-2.5 px-2 py-0.5 bg-[#FF7E67] text-[8px] font-extrabold uppercase tracking-widest text-white rounded-full">
                                Download APK
                            </div>
                            <div className="w-12 h-12 bg-[#FF7E67]/10 rounded-xl flex items-center justify-center border border-[#FF7E67]/20 text-[#FF7E67]">
                                <Download className="w-6 h-6 animate-bounce" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Security Checkpoint</h4>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mt-0.5">Direct APK Download</span>
                            </div>
                            <a 
                                href="/download/kontrol-checkpoint.apk" 
                                download
                                className="w-full py-2 bg-[#FF7E67] hover:bg-[#ff8f7a] text-xs font-bold text-white rounded-lg flex items-center justify-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" /> Download APK
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#010308] border-t border-slate-950 py-12 text-slate-500 text-xs">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-6 w-auto" />
                        <span className="text-[10px] text-slate-600 font-medium">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
                        <a href="/terms" className="hover:text-slate-300">Terms of Use</a>
                        <a href="/contact" className="hover:text-slate-300">Contact Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
