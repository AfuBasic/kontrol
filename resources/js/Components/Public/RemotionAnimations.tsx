import { motion } from 'framer-motion';
import { Check, Shield, Bell, Phone, CreditCard, QrCode, Sparkles } from 'lucide-react';
import React from 'react';

/**
 * Phone Shell wrapper for the animations
 */
export const PhoneShell: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
    return (
        <div className="relative mx-auto w-[280px] h-[560px] bg-[#0b0f19] rounded-[40px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans select-none">
            {/* Camera notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full mr-2"></div>
                <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            </div>
            
            {/* Status bar */}
            <div className="h-10 pt-6 px-6 flex justify-between items-center text-[10px] text-slate-400 font-semibold z-40 bg-[#0f172a]/50 backdrop-blur-md">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2 bg-slate-400 rounded-xs"></span>
                    <span className="w-3.5 h-2 bg-slate-400 rounded-xs"></span>
                </div>
            </div>

            {/* App header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-slate-800/60 bg-[#0f172a]/80 backdrop-blur-md z-30">
                <span className="text-sm font-bold text-white tracking-wide">{title}</span>
                <Shield className="w-4 h-4 text-[#FF7E67]" />
            </div>

            {/* Inside Content */}
            <div className="flex-1 bg-[#020617] relative p-4 flex flex-col overflow-hidden">
                {children}
            </div>

            {/* Bottom Indicator */}
            <div className="h-5 flex items-center justify-center bg-[#020617]">
                <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
            </div>
        </div>
    );
};

/**
 * 1. Visitor Entry Animation
 */
export const VisitorEntryAnimation: React.FC = () => {
    return (
        <div className="flex flex-col w-full h-full justify-between py-2 text-slate-200">
            {/* Step indicators */}
            <div className="flex justify-between gap-1 mb-2">
                <div className="h-1 flex-1 bg-[#4F46E5] rounded-full"></div>
                <div className="h-1 flex-1 bg-[#4F46E5] rounded-full"></div>
                <div className="h-1 flex-1 bg-slate-800 rounded-full"></div>
            </div>

            <div className="w-full flex-1 flex flex-col justify-center gap-4">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-[#0f172a] p-3 rounded-xl border border-slate-800/80"
                >
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Visitor Name</label>
                    <div className="text-sm font-medium text-white">John Doe</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-[#0f172a] p-3 rounded-xl border border-slate-800/80"
                >
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Access Type</label>
                    <div className="text-sm font-medium text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        One-time entry
                    </div>
                </motion.div>

                {/* Simulated Click */}
                <div className="relative mt-2">
                    <motion.button
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 0.95, 1] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 2 }}
                        className="w-full py-3 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-semibold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"
                    >
                        <QrCode className="w-3.5 h-3.5" />
                        Generate Code
                    </motion.button>

                    {/* Floating click cursor indicator */}
                    <motion.div
                        animate={{ 
                            x: [60, 110, 110, 60], 
                            y: [40, 10, 10, 40],
                            scale: [1, 0.8, 1, 1],
                            opacity: [0, 1, 1, 0] 
                        }}
                        transition={{ repeat: Infinity, duration: 4, repeatDelay: 0.5 }}
                        className="absolute w-5 h-5 bg-white/30 border border-white rounded-full pointer-events-none z-50 flex items-center justify-center"
                    >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </motion.div>
                </div>

                {/* Animated Result: QR Code slides in */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 40 }}
                    animate={{ opacity: [0, 0, 1, 1], scale: [0.8, 0.8, 1, 1], y: [40, 40, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 4, repeatDelay: 0.5 }}
                    className="bg-slate-900 border border-[#4F46E5]/40 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                >
                    <div className="bg-white p-2 rounded-lg">
                        <QrCode className="w-24 h-24 text-[#020617]" />
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-white tracking-widest uppercase">Pass: 829 - 102</div>
                        <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-1">
                            <Check className="w-3 h-3" /> Valid for next 24h
                        </div>
                    </div>
                    
                    {/* Send notification banner */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: [0, 0, 0, 1], y: [-20, -20, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 4, repeatDelay: 0.5 }}
                        className="absolute top-0 left-0 right-0 bg-[#4F46E5] text-white py-1.5 px-2 text-[9px] flex items-center justify-between font-semibold"
                    >
                        <span>SMS sent to visitor!</span>
                        <Sparkles className="w-3 h-3 animate-bounce" />
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
        <div className="flex flex-col w-full h-full justify-between py-2 text-slate-200">
            <div className="flex justify-between gap-1 mb-2">
                <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            </div>

            <div className="w-full flex-1 flex flex-col justify-center gap-4">
                <motion.div 
                    initial={{ opacity: 1 }}
                    className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-1"
                >
                    <span className="text-[9px] text-[#FF7E67] font-semibold uppercase tracking-wider">Outstanding Balance</span>
                    <h4 className="text-lg font-extrabold text-white">₦25,000.00</h4>
                    <p className="text-[10px] text-slate-400">Security & Maintenance Levy • Q3</p>
                </motion.div>

                {/* Tap to Pay Simulation */}
                <div className="relative">
                    <motion.button
                        animate={{ scale: [1, 0.96, 1] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 1.5 }}
                        className="w-full py-3 bg-[#4F46E5] hover:bg-[#5c54f2] text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Balance Securely
                    </motion.button>
                </div>

                {/* Processing Overlay State */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, 30] }}
                    transition={{ repeat: Infinity, duration: 5, repeatDelay: 1 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-4 min-h-[140px]"
                >
                    {/* Fake Loading Spinner */}
                    <div className="relative w-10 h-10">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-10 h-10 border-4 border-slate-800 border-t-[#FF7E67] rounded-full"
                        />
                    </div>
                    <div className="text-center">
                        <span className="text-xs text-slate-300 block font-medium">Securing transaction...</span>
                        <span className="text-[9px] text-slate-500">Redirecting to Paystack gateway</span>
                    </div>
                </motion.div>

                {/* Successful State */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0, 0, 1, 1], scale: [0.9, 0.9, 1, 1] }}
                    transition={{ repeat: Infinity, duration: 5, repeatDelay: 1 }}
                    className="absolute inset-x-4 bottom-8 bg-[#020617] border border-emerald-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-2xl"
                >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                        <Check className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-xs font-bold text-white">Payment Confirmed</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Receipt #KTL-892740 sent to mail</p>
                    </div>
                    <div className="w-full border-t border-slate-800/80 pt-2 mt-1 flex justify-between text-[9px] text-slate-400">
                        <span>Paid amount</span>
                        <span className="text-white font-semibold">₦25,000.00</span>
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
        <div className="flex flex-col w-full h-full justify-between py-2 text-slate-200">
            <div className="flex justify-between gap-1 mb-2">
                <div className="h-1 flex-1 bg-red-600 rounded-full"></div>
                <div className="h-1 flex-1 bg-red-600 rounded-full"></div>
                <div className="h-1 flex-1 bg-red-600 rounded-full"></div>
            </div>

            <div className="w-full flex-1 flex flex-col justify-center items-center gap-6">
                {/* Glowing Pulsing SOS button */}
                <div className="relative">
                    <motion.div 
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-red-500/30 rounded-full filter blur-md"
                    />
                    <motion.button
                        animate={{ scale: [1, 0.93, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="relative w-28 h-28 bg-red-600 border-4 border-red-500/40 rounded-full shadow-2xl shadow-red-600/50 flex flex-col items-center justify-center gap-1.5 focus:outline-none"
                    >
                        <Shield className="w-6 h-6 text-white animate-pulse" />
                        <span className="text-sm font-black text-white tracking-widest">SOS</span>
                    </motion.button>
                </div>

                <div className="text-center max-w-[180px]">
                    <p className="text-xs text-slate-300 font-medium">Tap & hold to broadcast crisis alert to all gates.</p>
                </div>

                {/* Alarm triggering and mapping state */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: [0, 1, 1, 1] }}
                    transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
                    className="w-full bg-red-950/40 border border-red-500/30 rounded-xl p-3 flex flex-col gap-2"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Broadcasting Alarm...</span>
                    </div>

                    <div className="flex flex-col gap-1 text-[9px] text-slate-300">
                        <div className="flex justify-between">
                            <span>Resident Unit:</span>
                            <span className="font-semibold text-white">Villa 4B</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Main Gate Station:</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                <Phone className="w-2 h-2" /> Dispatching Guards
                            </span>
                        </div>
                    </div>

                    {/* Top sliding alert banner */}
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: [0, 1, 1, 1], y: [-50, 0, 0, 0] }}
                        className="absolute top-12 inset-x-2 bg-[#FF7E67] text-white p-2 rounded-lg flex items-center gap-2 shadow-lg z-50"
                    >
                        <Bell className="w-3.5 h-3.5 text-white animate-bounce" />
                        <div className="flex-1 text-[9px] font-bold leading-tight">
                            SOS Alert at Villa 4B! Security notified.
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
