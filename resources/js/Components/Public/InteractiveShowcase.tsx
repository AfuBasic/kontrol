import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Fingerprint,
    Lock,
    MessageSquare,
    Users,
    Bell,
    Shield,
    Terminal,
    ArrowRight,
    QrCode,
    CheckCircle,
    Send,
    Smartphone,
    CreditCard,
    AlertTriangle,
    Eye,
    TrendingUp,
    Play,
    Pause,
} from 'lucide-react';
import InteractiveTilt from './InteractiveTilt';

interface FeatureItem {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    glowColor: string;
}

const FEATURES: FeatureItem[] = [
    {
        id: 'access',
        title: 'Visitor Access',
        description: 'Residents generate secure access passes. Security scans at the gate. Logs update in real-time.',
        icon: Fingerprint,
        color: 'from-blue-500 to-cyan-500',
        glowColor: 'rgba(59,130,246,0.15)',
    },
    {
        id: 'collections',
        title: 'Estate Collections',
        description: 'Automated billing, instant checkout, direct bank settlements, and full transparency for community funds.',
        icon: Lock,
        color: 'from-emerald-500 to-teal-500',
        glowColor: 'rgba(16,185,129,0.15)',
    },
    {
        id: 'incidents',
        title: 'Incident Management',
        description: 'Residents file complaints with photos. Managers assign security officers. Watch status resolve live.',
        icon: AlertTriangle,
        glowColor: 'rgba(245,158,11,0.15)',
        color: 'from-amber-500 to-orange-500',
    },
    {
        id: 'household',
        title: 'Household Members',
        description: 'Manage family members, staff, and co-residents. Send invites and restrict gate access privileges.',
        icon: Users,
        glowColor: 'rgba(139,92,246,0.15)',
        color: 'from-violet-500 to-purple-500',
    },
    {
        id: 'announcements',
        title: 'Announcements',
        description: 'Send critical estate updates and alerts via push notifications directly to residents phones.',
        icon: Bell,
        glowColor: 'rgba(236,72,153,0.15)',
        color: 'from-pink-500 to-rose-500',
    },
    {
        id: 'security',
        title: 'Security Operations',
        description: 'Equip guards with digital logs, SOS dispatch alert systems, and instant patrol logs.',
        icon: Shield,
        glowColor: 'rgba(59,130,246,0.15)',
        color: 'from-blue-600 to-indigo-600',
    },
    {
        id: 'zeus',
        title: 'Founder Intelligence (Zeus)',
        description: 'Full analytics, financial ledger charts, member approval triggers, and billing insights.',
        icon: Terminal,
        glowColor: 'rgba(99,102,241,0.15)',
        color: 'from-indigo-500 to-blue-500',
    },
];

export default function InteractiveShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [subStep, setSubStep] = useState(0);
    const progressInterval = useRef<any>(null);
    const autoCycleTimeout = useRef<any>(null);
    const activeFeature = FEATURES[activeIndex];

    // Sub-step timer to animate details inside the mockup screen
    useEffect(() => {
        setSubStep(0);
        const subTimer = setInterval(() => {
            setSubStep((prev) => (prev + 1) % 5);
        }, 1800);
        return () => clearInterval(subTimer);
    }, [activeIndex]);

    // Handle auto-playing tabs
    useEffect(() => {
        if (progressInterval.current) clearInterval(progressInterval.current);

        if (isPlaying) {
            const stepTime = 90; // total duration ~9 seconds (90 * 100ms)
            setProgress(0);
            progressInterval.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        setActiveIndex((current) => (current + 1) % FEATURES.length);
                        return 0;
                    }
                    return prev + 100 / stepTime;
                });
            }, 100);
        }

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [isPlaying, activeIndex]);

    const handleFeatureClick = (index: number) => {
        setActiveIndex(index);
        setIsPlaying(false); // Pause auto-play when clicked
        setProgress(0);

        // Resume auto-play after 12 seconds of inactivity
        if (autoCycleTimeout.current) clearTimeout(autoCycleTimeout.current);
        autoCycleTimeout.current = setTimeout(() => {
            setIsPlaying(true);
        }, 12000);
    };

    return (
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto mb-16 max-w-3xl text-center sm:mb-24">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">Experience Kontrol.</h2>
                <p className="mt-6 text-xl text-slate-600 dark:text-slate-400">
                    Interact with the capabilities below to see how Kontrol coordinates operations on the ground.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50"
                    >
                        {isPlaying ? (
                            <>
                                <Pause className="h-4 w-4" /> Pause Auto Play
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4" /> Resume Auto Play
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
                {/* Left Capability List */}
                <div className="space-y-4 lg:col-span-5">
                    {FEATURES.map((feature, idx) => {
                        const isActive = idx === activeIndex;
                        const Icon = feature.icon;
                        return (
                            <button
                                key={feature.id}
                                onClick={() => handleFeatureClick(idx)}
                                className={`relative flex w-full gap-6 overflow-hidden rounded-3xl border p-6 text-left transition-all duration-500 ${
                                    isActive
                                        ? 'border-blue-500/30 bg-blue-500/[0.02] shadow-xl shadow-blue-500/[0.01]'
                                        : 'border-slate-100 bg-white/20 hover:border-slate-200 dark:border-slate-900 dark:bg-slate-900/10 dark:hover:border-slate-800'
                                }`}
                            >
                                {/* Active progress bar indicator */}
                                {isActive && isPlaying && (
                                    <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-slate-100 dark:bg-slate-800">
                                        <motion.div
                                            className={`w-full bg-gradient-to-b ${feature.color}`}
                                            style={{ height: `${progress}%` }}
                                            layoutId="activeProgress"
                                        />
                                    </div>
                                )}

                                {isActive && !isPlaying && (
                                    <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-gradient-to-b from-blue-500 to-indigo-500" />
                                )}

                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 transition-all duration-500 dark:bg-slate-900 ${
                                        isActive ? 'scale-110 bg-blue-500/10 text-blue-500' : 'text-slate-500'
                                    }`}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3
                                        className={`text-xl font-bold transition-colors duration-300 ${
                                            isActive ? 'font-extrabold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feature.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Interactive Phone Mockup */}
                <div className="sticky top-24 flex justify-center lg:col-span-7">
                    <InteractiveTilt maxRotation={6} className="w-full max-w-[340px]">
                        {/* iPhone Frame wrapper */}
                        <div className="relative z-10 aspect-[1170/2532] w-full overflow-hidden rounded-[3rem] border-[10px] border-slate-900 bg-slate-950 shadow-2xl ring-1 ring-slate-900/5">
                            {/* Dynamic Island Status Bar */}
                            <div className="pointer-events-none absolute inset-x-0 top-4 z-30 h-auto w-full">
                                <div className="absolute top-2 left-1/2 h-[20px] w-[84px] -translate-x-1/2 rounded-full bg-black"></div>
                                <div className="flex h-[24px] w-full items-center justify-between px-7 pt-1">
                                    <span className="text-[12px] font-semibold text-white/90">09:41</span>
                                    <div className="flex items-center gap-1.5 text-white/90">
                                        <div className="flex gap-[2px]">
                                            <div className="h-1.5 w-[3px] rounded-full bg-white"></div>
                                            <div className="h-2 w-[3px] rounded-full bg-white"></div>
                                            <div className="h-2.5 w-[3px] rounded-full bg-white"></div>
                                            <div className="h-3 w-[3px] rounded-full bg-white"></div>
                                        </div>
                                        <span className="text-[10px] font-bold">5G</span>
                                        <div className="flex h-3 w-6 rounded-sm border border-white/40 p-[1px]">
                                            <div className="rounded-2xs h-full w-4 bg-white"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live iPhone UI Demo Render */}
                            <div className="relative h-full w-full overflow-hidden bg-slate-900 px-6 pt-16 pb-8 text-white">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeFeature.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                        className="flex h-full w-full flex-col justify-between"
                                    >
                                        <PhoneDemoContent featureId={activeFeature.id} subStep={subStep} />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </InteractiveTilt>
                </div>
            </div>
        </div>
    );
}

// Sub-component rendering interactive screen stories
function PhoneDemoContent({ featureId, subStep }: { featureId: string; subStep: number }) {
    switch (featureId) {
        case 'access':
            return (
                <div className="flex h-full flex-col justify-between">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold text-slate-400">Visitor Control</span>
                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">Home</span>
                    </div>

                    {/* Simulation Flow */}
                    <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
                        {/* Step 1: Resident Click button */}
                        {subStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col items-center gap-4 text-center"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                                    <QrCode className="h-8 w-8" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold">Generate Guest Pass</h4>
                                    <p className="mt-1 text-xs text-slate-400">Tap to issue instant entry code</p>
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="rounded-full bg-blue-600 px-6 py-2.5 text-xs font-bold shadow-lg shadow-blue-600/30"
                                >
                                    Generate Pass
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Step 2: Input & QR Generation */}
                        {subStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col items-center gap-4 rounded-3xl border border-white/5 bg-slate-950/40 p-5 text-center"
                            >
                                <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase">Generating...</span>
                                <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-white p-2">
                                    <QrCode className="h-24 w-24 text-slate-900" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-white">John Doe</p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">Valid: Today, 14:00 - 22:00</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: SMS Preview notification */}
                        {subStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col items-center gap-4 text-center"
                            >
                                <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                                        <Send className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-white">SMS Sent</p>
                                        <p className="truncate text-[10px] text-slate-400">Pass link sent to +234 812...</p>
                                    </div>
                                </div>
                                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                                    <Smartphone className="h-8 w-8" />
                                </div>
                                <p className="text-xs text-slate-400">Visitor receives link instantly</p>
                            </motion.div>
                        )}

                        {/* Step 4: Scan and Approve */}
                        {subStep >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col items-center gap-4 text-center"
                            >
                                <div className="relative">
                                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-3">
                                        <QrCode className="h-16 w-16 text-white" />
                                    </div>
                                    {subStep === 3 && (
                                        <motion.div
                                            animate={{ y: [0, 80, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                            className="absolute right-0 left-0 h-[2px] bg-green-400 shadow-[0_0_8px_#4ade80]"
                                        />
                                    )}
                                </div>
                                {subStep === 3 ? (
                                    <div>
                                        <p className="text-xs font-semibold text-white">Scanning QR Code</p>
                                        <p className="mt-1 text-[10px] text-slate-400">Gate checking registry...</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <CheckCircle className="h-10 w-10 text-green-400" />
                                        <p className="text-xs font-bold text-white">Visitor Arrived</p>
                                        <p className="text-[10px] text-slate-400">Resident notification triggered</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Log tracker */}
                    <div className="border-t border-white/5 pt-3">
                        <span className="mb-1 block text-[9px] font-bold tracking-wider text-slate-500 uppercase">Live Access Log</span>
                        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/20 p-2">
                            <span className="text-[10px] text-slate-300">John Doe (Guest)</span>
                            <span className="text-[9px] font-medium text-green-400">Checked In 09:41</span>
                        </div>
                    </div>
                </div>
            );
        case 'collections':
            return (
                <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold text-slate-400">Finance & Levies</span>
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Admin</span>
                    </div>

                    <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
                        {subStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <span className="text-[9px] font-bold tracking-wider text-emerald-400 uppercase">Create New Bill</span>
                                <div className="space-y-2">
                                    <div className="text-[10px] text-slate-400">Billing Name</div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900 p-2 text-xs font-semibold">Security Levy Q3</div>
                                    <div className="text-[10px] text-slate-400">Amount</div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900 p-2 text-xs font-bold text-emerald-400">
                                        ₦15,000.00
                                    </div>
                                </div>
                                <div className="mt-2 rounded-xl bg-emerald-600 py-2 text-center text-xs font-bold shadow-lg shadow-emerald-600/20">
                                    Generate Due
                                </div>
                            </motion.div>
                        )}

                        {subStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col gap-4"
                            >
                                <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                        <Bell className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-white">Payment Outstanding</p>
                                        <p className="truncate text-[10px] text-slate-400">Security Levy Q3: ₦15,000.00</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-col items-center text-center">
                                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs text-slate-400">Residents notified via Push & Email</p>
                                </div>
                            </motion.div>
                        )}

                        {subStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col gap-4 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <span className="text-[9px] font-bold tracking-wider text-emerald-400 uppercase">Fast Checkout</span>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">Due:</span>
                                        <span className="font-bold text-white">₦15,000.00</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-900 p-2.5">
                                        <CreditCard className="h-4 w-4 text-slate-400" />
                                        <span className="text-[10px] text-slate-300">PayStack Checkout</span>
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.03, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-bold"
                                >
                                    Pay Now
                                </motion.div>
                            </motion.div>
                        )}

                        {subStep >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-3 text-center"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                                    <CheckCircle className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Payment Confirmed</p>
                                    <p className="mt-1 text-xs text-emerald-400">Receipt #KTR-9204 issued</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="border-t border-white/5 pt-3">
                        <span className="mb-1 block text-[9px] font-bold tracking-wider text-slate-500 uppercase">Settlement Status</span>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">Payout Status</span>
                            <span className="text-[10px] font-bold text-emerald-400">Settled instantly</span>
                        </div>
                    </div>
                </div>
            );
        case 'incidents':
            return (
                <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold text-slate-400">Incident Desk</span>
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">Resident</span>
                    </div>

                    <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
                        {subStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <span className="text-[9px] font-bold tracking-wider text-amber-400 uppercase">Report Issue</span>
                                <div className="space-y-1">
                                    <div className="text-[10px] text-slate-400">Location</div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900 p-2 text-xs">Block 5 Water Line</div>
                                    <div className="text-[10px] text-slate-400">Description</div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900 p-2 text-xs">Heavy pipe leak near the gate</div>
                                </div>
                                <div className="mt-2 rounded-xl bg-amber-600 py-2 text-center text-xs font-bold">File Complaint</div>
                            </motion.div>
                        )}

                        {subStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col items-center gap-3 text-center"
                            >
                                <div className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-400">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                    Incident Filed: Status OPEN
                                </div>
                                <p className="mt-2 text-xs text-slate-400">Added to Admin monitoring console</p>
                            </motion.div>
                        )}

                        {subStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <span className="text-[9px] font-bold tracking-wider text-amber-400 uppercase">Assign Personnel</span>
                                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900 p-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Officer Collins</p>
                                        <p className="text-[9px] text-slate-400">Assigned Dispatcher</p>
                                    </div>
                                </div>
                                <div className="text-center text-[10px] font-semibold text-amber-400">Status: ASSIGNED</div>
                            </motion.div>
                        )}

                        {subStep >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-3 text-center"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-400">
                                    <CheckCircle className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Incident Resolved</p>
                                    <p className="mt-1 text-xs text-slate-400">Resident notified, closed successfully</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Response SLA</span>
                            <span className="font-bold text-green-400">&lt; 15 mins average</span>
                        </div>
                    </div>
                </div>
            );
        case 'household':
            return (
                <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold text-slate-400">Household Roster</span>
                        <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">Home</span>
                    </div>

                    <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
                        {subStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col items-center gap-4 text-center"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold">Invite Co-Resident</h4>
                                    <p className="mt-1 text-xs text-slate-400">Register family members or staff</p>
                                </div>
                                <div className="rounded-full bg-violet-600 px-5 py-2 text-xs font-bold">+ Add Member</div>
                            </motion.div>
                        )}

                        {subStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <span className="text-[9px] font-bold tracking-wider text-violet-400 uppercase">Member Details</span>
                                <div className="space-y-2">
                                    <div className="text-[10px] text-slate-400">Email Address</div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900 p-2 text-xs font-semibold">jane@kontrol.com</div>
                                    <div className="text-[10px] text-slate-400">Privileges</div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900 p-2 text-[10px] text-slate-400">
                                        Can generate visitor codes
                                    </div>
                                </div>
                                <div className="rounded-xl bg-violet-600 py-2 text-center text-xs font-bold">Send Invite</div>
                            </motion.div>
                        )}

                        {subStep >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col gap-3"
                            >
                                <span className="text-center text-[9px] font-bold tracking-wider text-violet-400 uppercase">Household Members</span>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                                                JD
                                            </div>
                                            <span className="text-xs font-semibold">John Doe</span>
                                        </div>
                                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-slate-400">Owner</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                                                J2
                                            </div>
                                            <span className="text-xs font-semibold">Jane Doe</span>
                                        </div>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[9px] ${
                                                subStep === 2 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
                                            }`}
                                        >
                                            {subStep === 2 ? 'Pending' : 'Verified'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="border-t border-white/5 pt-3">
                        <span className="text-[10px] text-slate-400">Total household limits: Unlimited</span>
                    </div>
                </div>
            );
        case 'announcements':
            return (
                <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold text-slate-400">Broadcast Board</span>
                        <span className="rounded bg-pink-500/10 px-2 py-0.5 text-[10px] font-medium text-pink-400">Estate</span>
                    </div>

                    <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
                        {subStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <span className="text-[9px] font-bold tracking-wider text-pink-400 uppercase">Compose Notice</span>
                                <div className="space-y-1">
                                    <div className="text-[10px] text-slate-400">Title</div>
                                    <div className="rounded-lg border border-white/5 bg-slate-900 p-2 text-xs font-semibold">
                                        Water Maintenance Scheduled
                                    </div>
                                </div>
                                <div className="rounded-xl bg-pink-600 py-2 text-center text-xs font-bold">Broadcast Update</div>
                            </motion.div>
                        )}

                        {subStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col items-center gap-4 text-center"
                            >
                                <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white">
                                        <Bell className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-white">Broadcast sent</p>
                                        <p className="truncate text-[10px] text-slate-400">Water Maintenance Scheduled</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">Triggered push notifications for 1,200+ units</p>
                            </motion.div>
                        )}

                        {subStep >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-5"
                            >
                                <div className="mb-3 flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-pink-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Public Notice</span>
                                </div>
                                <h5 className="text-xs font-bold text-white">Water Maintenance Q3</h5>
                                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                                    Please note that the main water lines will undergo maintenance on Thursday from 08:00 to 12:00.
                                </p>
                            </motion.div>
                        )}
                    </div>

                    <div className="border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Read Receipts</span>
                            <span className="font-bold text-pink-400">Tracked by Admin console</span>
                        </div>
                    </div>
                </div>
            );
        case 'security':
            return (
                <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold text-slate-400">Guard Station</span>
                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">Gatehouse</span>
                    </div>

                    <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
                        {subStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-4 text-center"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/15 text-blue-400">
                                    <Shield className="h-10 w-10 animate-pulse" />
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-white">Gate Scanner Active</h5>
                                    <p className="mt-1 text-xs text-slate-400">Ready to scan visitor QR pass</p>
                                </div>
                            </motion.div>
                        )}

                        {subStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative flex w-full flex-col items-center gap-4 text-center"
                            >
                                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-2">
                                    <QrCode className="h-20 w-20 text-white" />
                                    <motion.div
                                        animate={{ y: [0, 90, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                        className="absolute right-0 left-0 h-[2px] bg-blue-400 shadow-[0_0_8px_#3b82f6]"
                                    />
                                </div>
                                <p className="text-xs text-slate-400">Reading credentials...</p>
                            </motion.div>
                        )}

                        {subStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold tracking-wider text-blue-400 uppercase">Access Clearance</span>
                                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[8px] font-bold text-green-400">APPROVED</span>
                                </div>
                                <div className="space-y-1 text-left">
                                    <p className="text-xs font-bold">Emeka Obi (Visitor)</p>
                                    <p className="text-[10px] text-slate-400">Host: Block B3 unit 12</p>
                                </div>
                            </motion.div>
                        )}

                        {subStep >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-3 text-center"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Log Registered</p>
                                    <p className="mt-1 text-[9px] text-slate-400">SLA gate opening timestamped</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Active Patrol Guards</span>
                            <span className="font-bold text-blue-400">4 Duty Officers</span>
                        </div>
                    </div>
                </div>
            );
        case 'zeus':
            return (
                <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold text-slate-400">Zeus Command Center</span>
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">Zeus</span>
                    </div>

                    <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
                        {subStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex w-full flex-col gap-2 rounded-3xl border border-white/5 bg-slate-950/40 p-5"
                            >
                                <span className="text-[9px] font-bold tracking-wider text-indigo-400 uppercase">Analytics</span>
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] text-slate-400">Total Revenue</span>
                                    <span className="text-xs font-bold text-white">₦4.2M</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400">Active Estates</span>
                                    <span className="text-xs font-bold text-white">24</span>
                                </div>
                            </motion.div>
                        )}

                        {subStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col items-center gap-3 text-center"
                            >
                                <TrendingUp className="h-10 w-10 text-indigo-400" />
                                <div>
                                    <p className="text-xs font-bold text-white">Processing Rate: 100%</p>
                                    <p className="mt-1 text-[9px] text-slate-400">Automatic webhook callbacks active</p>
                                </div>
                            </motion.div>
                        )}

                        {subStep >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex w-full flex-col gap-3"
                            >
                                <span className="text-center text-[9px] font-bold tracking-wider text-indigo-400 uppercase">Zeus Pulse</span>
                                <div className="relative flex h-24 w-full flex-col justify-end gap-1 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                                    {/* Simulated dynamic charts */}
                                    <div className="absolute inset-0 flex items-end justify-between px-4 pt-6 pb-2">
                                        <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} className="w-4 rounded-t bg-indigo-500/20" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: '50%' }} className="w-4 rounded-t bg-indigo-500/40" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: '80%' }} className="w-4 rounded-t bg-indigo-500/80" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: '60%' }} className="w-4 rounded-t bg-indigo-500/60" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: '95%' }} className="w-4 rounded-t bg-indigo-500" />
                                    </div>
                                    <span className="relative z-10 text-[8px] font-bold text-slate-500">Monthly Transaction Volume</span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">System Uptime</span>
                            <span className="font-bold text-indigo-400">99.98%</span>
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
}
