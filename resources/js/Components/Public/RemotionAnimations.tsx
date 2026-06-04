import { motion } from 'framer-motion';
import { Check, Shield, Bell, Phone, CreditCard, QrCode, Sparkles } from 'lucide-react';
import React from 'react';

/**
 * Phone Shell wrapper for the animations
 */
export const PhoneShell: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
    return (
        <div className="relative mx-auto flex h-[560px] w-[280px] flex-col overflow-hidden rounded-[40px] border-4 border-slate-800 bg-[#0b0f19] font-sans shadow-2xl select-none">
            {/* Camera notch */}
            <div className="absolute top-0 left-1/2 z-50 flex h-6 w-32 -translate-x-1/2 items-center justify-center rounded-b-2xl bg-slate-900">
                <div className="mr-2 h-3 w-3 rounded-full bg-black"></div>
                <div className="h-1 w-12 rounded-full bg-slate-800"></div>
            </div>

            {/* Status bar */}
            <div className="z-40 flex h-10 items-center justify-between bg-[#0f172a]/50 px-6 pt-6 text-[10px] font-semibold text-slate-400 backdrop-blur-md">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                    <span className="h-2 w-2.5 rounded-xs bg-slate-400"></span>
                    <span className="h-2 w-3.5 rounded-xs bg-slate-400"></span>
                </div>
            </div>

            {/* App header */}
            <div className="z-30 flex h-12 items-center justify-between border-b border-slate-800/60 bg-[#0f172a]/80 px-4 backdrop-blur-md">
                <span className="text-sm font-bold tracking-wide text-white">{title}</span>
                <Shield className="h-4 w-4 text-[#FF7E67]" />
            </div>

            {/* Inside Content */}
            <div className="relative flex flex-1 flex-col overflow-hidden bg-[#020617] p-4">{children}</div>

            {/* Bottom Indicator */}
            <div className="flex h-5 items-center justify-center bg-[#020617]">
                <div className="h-1 w-24 rounded-full bg-slate-700"></div>
            </div>
        </div>
    );
};

/**
 * 1. Visitor Entry Animation
 */
export const VisitorEntryAnimation: React.FC = () => {
    return (
        <div className="flex h-full w-full flex-col justify-between py-2 text-slate-200">
            {/* Step indicators */}
            <div className="mb-2 flex justify-between gap-1">
                <div className="h-1 flex-1 rounded-full bg-[#4F46E5]"></div>
                <div className="h-1 flex-1 rounded-full bg-[#4F46E5]"></div>
                <div className="h-1 flex-1 rounded-full bg-slate-800"></div>
            </div>

            <div className="flex w-full flex-1 flex-col justify-center gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl border border-slate-800/80 bg-[#0f172a] p-3"
                >
                    <label className="mb-1 block text-[10px] tracking-wider text-slate-400 uppercase">Visitor Name</label>
                    <div className="text-sm font-medium text-white">John Doe</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-xl border border-slate-800/80 bg-[#0f172a] p-3"
                >
                    <label className="mb-1 block text-[10px] tracking-wider text-slate-400 uppercase">Access Type</label>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        One-time entry
                    </div>
                </motion.div>

                {/* Simulated Click */}
                <div className="relative mt-2">
                    <motion.button
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 0.95, 1] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 2 }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FF7E67] py-3 text-xs font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-[#ff8f7a]"
                    >
                        <QrCode className="h-3.5 w-3.5" />
                        Generate Code
                    </motion.button>

                    {/* Floating click cursor indicator */}
                    <motion.div
                        animate={{
                            x: [60, 110, 110, 60],
                            y: [40, 10, 10, 40],
                            scale: [1, 0.8, 1, 1],
                            opacity: [0, 1, 1, 0],
                        }}
                        transition={{ repeat: Infinity, duration: 4, repeatDelay: 0.5 }}
                        className="pointer-events-none absolute z-50 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white/30"
                    >
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                    </motion.div>
                </div>

                {/* Animated Result: QR Code slides in */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 40 }}
                    animate={{ opacity: [0, 0, 1, 1], scale: [0.8, 0.8, 1, 1], y: [40, 40, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 4, repeatDelay: 0.5 }}
                    className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-[#4F46E5]/40 bg-slate-900 p-4"
                >
                    <div className="rounded-lg bg-white p-2">
                        <QrCode className="h-24 w-24 text-[#020617]" />
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold tracking-widest text-white uppercase">Pass: 829 - 102</div>
                        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-emerald-400">
                            <Check className="h-3 w-3" /> Valid for next 24h
                        </div>
                    </div>

                    {/* Send notification banner */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: [0, 0, 0, 1], y: [-20, -20, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 4, repeatDelay: 0.5 }}
                        className="absolute top-0 right-0 left-0 flex items-center justify-between bg-[#4F46E5] px-2 py-1.5 text-[9px] font-semibold text-white"
                    >
                        <span>SMS sent to visitor!</span>
                        <Sparkles className="h-3 w-3 animate-bounce" />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

/**
 * 2. Levies & Collections Animation
 */
export const LeviesCollectionsAnimation: React.FC = () => {
    return (
        <div className="flex h-full w-full flex-col justify-between py-2 text-slate-200">
            <div className="mb-2 flex justify-between gap-1">
                <div className="h-1 flex-1 rounded-full bg-emerald-500"></div>
                <div className="h-1 flex-1 rounded-full bg-emerald-500"></div>
                <div className="h-1 flex-1 rounded-full bg-emerald-500"></div>
            </div>

            <div className="flex w-full flex-1 flex-col justify-center gap-4">
                <motion.div initial={{ opacity: 1 }} className="flex flex-col gap-1 rounded-xl border border-slate-800/80 bg-[#0f172a] p-3.5">
                    <span className="text-[9px] font-semibold tracking-wider text-[#FF7E67] uppercase">Outstanding Balance</span>
                    <h4 className="text-lg font-extrabold text-white">₦25,000.00</h4>
                    <p className="text-[10px] text-slate-400">Security & Maintenance Levy • Q3</p>
                </motion.div>

                {/* Tap to Pay Simulation */}
                <div className="relative">
                    <motion.button
                        animate={{ scale: [1, 0.96, 1] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 1.5 }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3 text-xs font-semibold text-white shadow-lg hover:bg-[#5c54f2]"
                    >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay Balance Securely
                    </motion.button>
                </div>

                {/* Processing Overlay State */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, 30] }}
                    transition={{ repeat: Infinity, duration: 5, repeatDelay: 1 }}
                    className="flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
                >
                    {/* Fake Loading Spinner */}
                    <div className="relative h-10 w-10">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="h-10 w-10 rounded-full border-4 border-slate-800 border-t-[#FF7E67]"
                        />
                    </div>
                    <div className="text-center">
                        <span className="block text-xs font-medium text-slate-300">Securing transaction...</span>
                        <span className="text-[9px] text-slate-500">Redirecting to Paystack gateway</span>
                    </div>
                </motion.div>

                {/* Successful State */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0, 0, 1, 1], scale: [0.9, 0.9, 1, 1] }}
                    transition={{ repeat: Infinity, duration: 5, repeatDelay: 1 }}
                    className="absolute inset-x-4 bottom-8 flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-[#020617] p-4 shadow-2xl"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500/20">
                        <Check className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-xs font-bold text-white">Payment Confirmed</h4>
                        <p className="mt-1 text-[10px] text-slate-400">Receipt #KTL-892740 sent to mail</p>
                    </div>
                    <div className="mt-1 flex w-full justify-between border-t border-slate-800/80 pt-2 text-[9px] text-slate-400">
                        <span>Paid amount</span>
                        <span className="font-semibold text-white">₦25,000.00</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

/**
 * 3. Emergency SOS Animation
 */
export const EmergencySOSAnimation: React.FC = () => {
    return (
        <div className="flex h-full w-full flex-col justify-between py-2 text-slate-200">
            <div className="mb-2 flex justify-between gap-1">
                <div className="h-1 flex-1 rounded-full bg-red-600"></div>
                <div className="h-1 flex-1 rounded-full bg-red-600"></div>
                <div className="h-1 flex-1 rounded-full bg-red-600"></div>
            </div>

            <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
                {/* Glowing Pulsing SOS button */}
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 rounded-full bg-red-500/30 blur-md filter"
                    />
                    <motion.button
                        animate={{ scale: [1, 0.93, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="relative flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-full border-4 border-red-500/40 bg-red-600 shadow-2xl shadow-red-600/50 focus:outline-none"
                    >
                        <Shield className="h-6 w-6 animate-pulse text-white" />
                        <span className="text-sm font-black tracking-widest text-white">SOS</span>
                    </motion.button>
                </div>

                <div className="max-w-[180px] text-center">
                    <p className="text-xs font-medium text-slate-300">Tap & hold to broadcast crisis alert to all gates.</p>
                </div>

                {/* Alarm triggering and mapping state */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: [0, 1, 1, 1] }}
                    transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
                    className="flex w-full flex-col gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3"
                >
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 animate-ping rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">Broadcasting Alarm...</span>
                    </div>

                    <div className="flex flex-col gap-1 text-[9px] text-slate-300">
                        <div className="flex justify-between">
                            <span>Resident Unit:</span>
                            <span className="font-semibold text-white">Villa 4B</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Main Gate Station:</span>
                            <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                                <Phone className="h-2 w-2" /> Dispatching Guards
                            </span>
                        </div>
                    </div>

                    {/* Top sliding alert banner */}
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: [0, 1, 1, 1], y: [-50, 0, 0, 0] }}
                        className="absolute inset-x-2 top-12 z-50 flex items-center gap-2 rounded-lg bg-[#FF7E67] p-2 text-white shadow-lg"
                    >
                        <Bell className="h-3.5 w-3.5 animate-bounce text-white" />
                        <div className="flex-1 text-[9px] leading-tight font-bold">SOS Alert at Villa 4B! Security notified.</div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
