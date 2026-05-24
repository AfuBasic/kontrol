import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Zap,
    Cpu,
    Lock,
    CreditCard,
    ArrowRight,
    Activity,
    Sparkles,
    Check,
    Users,
    Smartphone,
    TrendingUp,
    ShieldAlert,
    RefreshCw,
    ScanLine,
    Coins,
    BarChart3
} from 'lucide-react';
import SEO from '@/Components/Landing/SEO';
import LandingLayout from '@/Layouts/LandingLayout';
import { login } from '@/routes';
import ProductShowcaseVideo from '@/Components/Landing/ProductShowcaseVideo';

interface PlanFeature {
    name: string;
    slug: string;
}

interface Plan {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number; // In kobo
    billingInterval: 'quarterly' | 'semi-annually' | 'annually';
    discountMultiplier: number;
    monthsPerInterval: number;
    basePricePerResident: number; // In kobo
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    is_featured: boolean;
    badge: string | null;
    color: string;
    features: PlanFeature[];
}

interface Props {
    plans: Plan[];
}

// -------------------------------------------------------------
// 2. DYNAMIC DATABASE-DRIVEN PRICING CALCULATOR
// -------------------------------------------------------------
function PricingCalculator({ plans }: Props) {
    // Dynamically extract distinct plan tiers (Basic, Growth, Pro) from DB config
    const uniquePlanNames = Array.from(new Set(plans.map(p => p.name)));
    const [selectedPlanName, setSelectedPlanName] = useState(uniquePlanNames[0] || 'Basic Plan');
    
    // Programmatically read available frequencies for the selected plan
    const selectedPlanVariations = plans.filter(p => p.name === selectedPlanName);
    const uniqueFrequencies = Array.from(new Set(selectedPlanVariations.map(p => p.billingInterval)));
    
    const [selectedFrequency, setSelectedFrequency] = useState<'quarterly' | 'semi-annually' | 'annually'>(
        (uniqueFrequencies.includes('annually') ? 'annually' : uniqueFrequencies[0]) as any
    );

    // Active plan instance based on tier + interval
    const activePlan = selectedPlanVariations.find(p => p.billingInterval === selectedFrequency) || selectedPlanVariations[0];

    // Read constraints dynamically
    const maxResidents = activePlan?.max_residents ?? 1000;
    const isUnlimited = activePlan?.max_residents === null;

    const [residents, setResidents] = useState(25);

    // Ensure state stays within the boundary when changing plans
    useEffect(() => {
        if (!isUnlimited && residents > maxResidents) {
            setResidents(maxResidents);
        }
    }, [selectedPlanName, selectedFrequency]);

    // Math engine: activePlan.price is the per-resident interval price in kobo
    const intervalPricePerResidentKobo = activePlan?.price ?? 0;
    const months = activePlan?.monthsPerInterval ?? 12;

    const totalCostKobo = intervalPricePerResidentKobo * residents;
    
    const monthlyAverage = totalCostKobo / months / 100;
    const intervalTotal = totalCostKobo / 100;

    return (
        <div className="w-full bg-slate-950 border border-slate-900 rounded-3xl p-6 lg:p-10 shadow-2xl relative overflow-hidden">
            {/* Background Accent Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.15),transparent)] pointer-events-none" />

            <div className="grid gap-10 lg:grid-cols-5 relative z-10">
                {/* Left Section: Controls */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Plan Selector */}
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block mb-3 font-mono">Select Core Infrastructure Tier</span>
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60">
                            {uniquePlanNames.map((name) => {
                                const isSelected = selectedPlanName === name;
                                return (
                                    <button
                                        key={name}
                                        onClick={() => setSelectedPlanName(name)}
                                        className={`py-3 text-xs font-bold rounded-xl transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {name.replace(' Plan', '')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Billing Interval Toggle (Programmatic) */}
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block mb-3 font-mono">Billing Frequency</span>
                        <div className="flex gap-2">
                            {uniqueFrequencies.map((freq) => {
                                const isSelected = selectedFrequency === freq;
                                let label = 'Annual';
                                let discountText = '20% Off';
                                if (freq === 'quarterly') {
                                    label = 'Quarterly';
                                    discountText = 'Base';
                                } else if (freq === 'semi-annually') {
                                    label = 'Semi-Annual';
                                    discountText = '10% Off';
                                }
                                return (
                                    <button
                                        key={freq}
                                        onClick={() => setSelectedFrequency(freq as any)}
                                        className={`flex-1 flex flex-col items-center py-2 px-4 rounded-xl border transition-all ${
                                            isSelected
                                                ? 'bg-slate-900 border-indigo-500/50 text-white'
                                                : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">{label}</span>
                                        <span className="text-[8px] font-mono font-extrabold text-indigo-400 uppercase mt-0.5">{discountText}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Residents Quantity Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-mono">Occupied Residents Capacity</span>
                            <span className="bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1 text-sm font-black rounded-lg font-mono">
                                {residents} {isUnlimited && residents >= 1000 ? '999+' : 'Residents'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max={isUnlimited ? "1000" : maxResidents}
                            step="5"
                            value={residents}
                            onChange={(e) => setResidents(parseInt(e.target.value))}
                            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                            <span>Min: 5</span>
                            {isUnlimited ? (
                                <span>Scale Unlimited</span>
                            ) : (
                                <span>Capped at {maxResidents} (Tier Max)</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section: Price Preview Output */}
                <div className="lg:col-span-2 bg-slate-900/60 rounded-3xl p-6 lg:p-8 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                                {activePlan?.badge || 'OPERATIONAL GRID'}
                            </span>
                            {activePlan?.is_featured && (
                                <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                                    Featured
                                </span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <span className="text-sm font-semibold text-slate-400">Average billing cost</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl lg:text-5xl font-black text-white tracking-tight font-mono">
                                    ₦{Math.floor(monthlyAverage).toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-slate-500">/mo</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-800/80 my-6 pt-6 space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">License Cost Per Resident</span>
                                <span className="font-bold text-slate-300 font-mono">
                                    ₦{Math.floor((intervalPricePerResidentKobo / 100) / months).toLocaleString()}/mo
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Billing Interval Base Price</span>
                                <span className="font-bold text-slate-300 font-mono">
                                    ₦{Math.floor(intervalPricePerResidentKobo / 100).toLocaleString()} per resident
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-800/50 pt-3">
                                <span className="text-slate-400 font-bold">Total Interval Payment ({months} months)</span>
                                <span className="font-black text-indigo-400 font-mono text-sm">
                                    ₦{Math.floor(intervalTotal).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={login().url}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20 mt-6"
                    >
                        Deploy Estate Node
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// 3. MAIN HOMEPAGE COMPONENT
// -------------------------------------------------------------
export default function Home({ plans }: Props) {
    const stats = [
        { label: 'Platform Transactions Audited', value: '₦1.2B+' },
        { label: 'Active Access Clearance Code Uptime', value: '99.99%' },
        { label: 'Access Code Approvals Handled', value: '500K+' },
        { label: 'Average Verification Pipeline Latency', value: '1.2s' },
    ];

    const corePillars = [
        {
            title: 'Estate Security Integrity',
            description: 'Implement zero-trust perimeter access control with cryptographic visitor codes, instant guard validations, and push notification confirmation loops.',
            icon: Shield,
            color: 'from-indigo-600/35 to-indigo-900/5',
        },
        {
            title: 'Asset Management Automation',
            description: 'Seamless household operations: from utility distribution workflows and staff permit scheduling to instant digital collections verification.',
            icon: Cpu,
            color: 'from-orange-500/20 to-orange-950/5',
        },
        {
            title: 'Absolute Financial Transparency',
            description: 'Mitigate manual accounting errors with transparent ledger records, auto-generated invoices, and single-source financial reconciliation.',
            icon: Coins,
            color: 'from-teal-500/25 to-teal-950/5',
        },
    ];

    const pipelineSteps = [
        {
            step: '01',
            title: 'Deploy Digital Infrastructure',
            description: 'Configure and provision your estate portal, define rules, and map security checkpoints within minutes.'
        },
        {
            step: '02',
            title: 'Hydrate Resident Registers',
            description: 'Invite members through cryptographic authorization tokens to securely verify their profiles.'
        },
        {
            step: '03',
            title: 'Activate Live Operations',
            description: 'Enforce real-time visitor authorization, automated invoicing, and digital dues ledger audits.'
        }
    ];

    return (
        <LandingLayout isDark={true}>
            <SEO
                title="Premium Estate Operations & Cryptographic Security Integrity"
                description="Kontrol is the definitive operating-system-grade platform for modern gate control, auditable financial ledgers, and resident safety operations."
            />

            {/* Grid & Ambient Blur Glows Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                
                {/* Radial Glow Balls */}
                <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[150px]" />
                <div className="absolute top-[40%] right-[5%] w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[180px]" />
            </div>

            {/* --- HERO SECTION --- */}
            <section className="relative z-10 pt-32 pb-24 lg:pt-48 lg:pb-36 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center max-w-4xl mx-auto space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/40 rounded-full px-4 py-1.5"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase font-mono">
                            V2 SECURE ACCESS ENGINE OPERATIONAL
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.8 }}
                        className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]"
                    >
                        The Operating System for <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">Estate Integrity</span>.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-base sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed"
                    >
                        Zero-trust gate access credentials, automated dues collections, and real-time community dispatch infrastructure. Custom engineered for premium residential estates.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="pt-6 flex flex-wrap justify-center gap-4"
                    >
                        <Link
                            href={login().url}
                            className="bg-white hover:bg-slate-100 text-slate-950 font-black py-4 px-10 text-sm rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                        >
                            Provision Estate Node
                        </Link>
                        <a
                            href="#showcase"
                            className="bg-slate-900 border border-slate-800 text-slate-200 font-bold py-4 px-8 text-sm rounded-2xl hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
                        >
                            Review Operations Video
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </motion.div>
                </div>

                {/* Hero Showcase Video Wrapper */}
                <motion.div
                    id="showcase"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="mt-20 lg:mt-28 relative rounded-[2.5rem] p-2 bg-slate-950/60 border border-slate-900/80 backdrop-blur-md shadow-2xl max-w-5xl mx-auto"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-orange-500/10 rounded-[2.5rem] pointer-events-none" />
                    <ProductShowcaseVideo />
                </motion.div>
            </section>

            {/* --- LIVE PLATFORM METRICS --- */}
            <section className="relative z-10 border-y border-slate-900/60 bg-slate-950/30 backdrop-blur-md py-12">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="space-y-1 text-center md:text-left">
                                <span className="text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">{stat.value}</span>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CORE PILLARS --- */}
            <section className="relative z-10 py-24 lg:py-36 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="max-w-3xl mb-20 space-y-4">
                    <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase font-mono">Infrastructure Stack</span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
                        Built for ultimate platform performance.
                    </h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed">
                        Rather than stitching disparate access lists and paper logs together, Kontrol binds security patrols, billing reconciliation, and residence databases into a single, unified kernel.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {corePillars.map((pillar, idx) => {
                        const IconComp = pillar.icon;
                        return (
                            <div
                                key={idx}
                                className="group relative rounded-3xl p-8 bg-slate-900/40 border border-slate-900/80 hover:border-slate-800/80 transition-all hover:-translate-y-1.5 flex flex-col justify-between"
                            >
                                {/* Glow element */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${pillar.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                                <div className="relative z-10 space-y-6">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                        <IconComp className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">{pillar.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">{pillar.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* --- PIPELINE WORKFLOW --- */}
            <section className="relative z-10 py-24 lg:py-36 border-t border-slate-900/60 bg-slate-950/20">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 grid gap-16 lg:grid-cols-2 lg:items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-orange-400 tracking-[0.2em] uppercase font-mono">Provisioning Protocol</span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                                Zero friction deployment pipeline.
                            </h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed">
                                Deploying Kontrol is extremely straightforward. We configure secure gate checkpoints, provision payment endpoints, and sync resident registers automatically.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {pipelineSteps.map((step, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-mono">
                                        {step.step}
                                    </span>
                                    <div className="space-y-1">
                                        <h4 className="text-base font-bold text-white">{step.title}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed font-medium">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Security Console Mock */}
                    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden aspect-[4/3] flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-slate-300 font-mono">SYSTEM MONITOR</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500">HOST: NODE-04.KONTROL.NET</span>
                        </div>

                        <div className="my-6 space-y-3 font-mono text-[11px] text-slate-400 flex-1 overflow-y-auto">
                            <p className="text-indigo-400">[info] Initializing Gate 01 scanner pipeline...</p>
                            <p className="text-slate-500">[auth] Handshake token validation: OK</p>
                            <p className="text-emerald-400">[success] Resident clearance code verified for Unit 12B</p>
                            <p className="text-slate-500">[dispatch] Guard console terminal notification pushed</p>
                            <p className="text-orange-400">[warning] Peak visitor capacity threshold approaching (82%)</p>
                        </div>

                        <div className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Access Codes</span>
                            <span className="text-xs font-black text-indigo-400 font-mono">142 Active</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PRICING MATRIX CALCULATOR SECTION --- */}
            <section className="relative z-10 py-24 lg:py-36 max-w-7xl mx-auto px-6 lg:px-8 border-t border-slate-900/60">
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                    <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase font-mono">Cost Transparency</span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                        Programmatic Pricing Models
                    </h2>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                        Scale platform parameters dynamically based on total residents count, using verified database config values and interval multiplier discounts.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <PricingCalculator plans={plans} />
                </div>
            </section>

            {/* --- CTA BOTTOM --- */}
            <section className="relative z-10 py-24 lg:py-36 max-w-7xl mx-auto px-6 lg:px-8 border-t border-slate-900/60">
                <div className="relative overflow-hidden rounded-[3rem] bg-indigo-950/20 border border-indigo-900/30 p-8 lg:p-20 text-center shadow-2xl">
                    <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />
                    <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-orange-500/10 blur-[80px]" />

                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                            Ready to secure your estate?
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium">
                            Join dozens of modern estate nodes operational on the Kontrol mesh. Activate visitor logs and access compliance code verification within days.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href={login().url}
                                className="bg-white hover:bg-slate-100 text-slate-950 font-black py-4 px-8 text-sm rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                            >
                                Deploy Node
                            </Link>
                            <Link
                                href={login().url}
                                className="bg-slate-900 border border-slate-800 text-slate-200 font-bold py-4 px-8 text-sm rounded-2xl hover:bg-slate-800 hover:text-white transition-all"
                            >
                                Request Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
