import { Plus, Users, Clock, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';

interface Props {
    expectedToday: number;
    activeNow: number;
    lastActivity?: string;
    onAction?: () => void;
}

export default function CommandCenter({ expectedToday, activeNow, lastActivity, onAction }: Props) {
    const hasData = expectedToday > 0 || activeNow > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-[38px] bg-slate-950 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]"
        >
            {/* Advanced Layering & Texture */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Mesh Gradients */}
                <div className="absolute -top-[20%] -right-[10%] h-[80%] w-[80%] rounded-full bg-indigo-600/30 blur-[100px] animate-pulse" />
                <div className="absolute -bottom-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-blue-500/20 blur-[80px]" />
                
                {/* Grain Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
                
                {/* Subtle Grid / Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.05]" 
                    style={{ 
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }} 
                />
                
                {/* Glass Glow */}
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
            </div>

            <div className="relative z-10">
                <div className="mb-10 flex items-start justify-between">
                    <div className="max-w-[70%]">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Command Center</span>
                        </div>
                        
                        <h2 className="text-3xl font-extrabold tracking-tight text-white leading-[1.1]">
                            {!hasData ? (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    You're <span className="text-white/40 italic">all clear</span> for now
                                </motion.span>
                            ) : activeNow > 0 ? (
                                <>{activeNow} {activeNow === 1 ? 'visitor' : 'visitors'} <span className="text-white/40">at the gate</span></>
                            ) : (
                                <>{expectedToday} {expectedToday === 1 ? 'visitor' : 'visitors'} <span className="text-white/40">scheduled</span></>
                            )}
                        </h2>
                        
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white/30">
                            <Activity className="h-3 w-3" />
                            {lastActivity ? `Last activity: ${lastActivity}` : 'Gate is currently quiet'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md shadow-inner">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="mb-10 grid grid-cols-2 gap-4">
                    <div className="rounded-[24px] bg-white/[0.03] p-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.06]">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Expected</p>
                        <p className="text-2xl font-black text-white">{expectedToday}</p>
                    </div>
                    <div className="rounded-[24px] bg-white/[0.03] p-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.06]">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Inside</p>
                        <p className="text-2xl font-black text-white">{activeNow}</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onAction}
                    className="relative flex w-full items-center justify-center gap-3 rounded-[24px] bg-white py-5 text-lg font-black text-slate-950 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.3)] transition-all active:shadow-none"
                >
                    <Plus className="h-6 w-6" strokeWidth={3} />
                    Generate Access Code
                    
                    {/* Subtle button glow */}
                    <div className="absolute inset-0 rounded-[24px] bg-white/20 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
            </div>
        </motion.div>
    );
}
