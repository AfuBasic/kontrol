import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
    isExiting: boolean;
}

export default function AppLoader({ isExiting }: Props) {
    const [currentTip, setCurrentTip] = useState(0);
    const tips = [
        'Generate visitor codes in seconds',
        'Emergency SOS at your fingertips',
        'Pay community dues effortlessly',
        'Stay connected with your neighbors',
        'Your safety, our priority',
        'Manage your household with ease',
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % tips.length);
        }, 4000); // Slightly slower for readability
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-white px-6 py-20"
        >
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-40" 
                    style={{ background: 'radial-gradient(circle, rgba(241,245,249,1) 0%, rgba(255,255,255,0) 70%)' }}
                />
            </div>

            {/* Center: Logo Area */}
            <div className="relative z-10 flex flex-1 items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                        scale: [1, 1.02, 1],
                        opacity: 1 
                    }}
                    transition={{
                        scale: {
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        },
                        opacity: {
                            duration: 1.2,
                            ease: [0.16, 1, 0.3, 1]
                        }
                    }}
                    className="relative"
                >
                    <img src="/assets/images/kontrol.png" alt="Kontrol Logo" className="h-48 w-auto object-contain drop-shadow-2xl" />
                </motion.div>
            </div>

            {/* Bottom: Subtle Loader */}
            <div className="relative z-10 pb-safe flex flex-col items-center gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center"
                >
                    {/* Reverted to Spinner as requested */}
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" strokeWidth={1.5} />
                    
                    <div className="h-12 mt-6 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentTip}
                                initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                                transition={{ 
                                    duration: 0.9,
                                    ease: [0.22, 1, 0.36, 1] // Quintic ease for ultra-smoothness
                                }}
                                className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase text-center max-w-[280px] leading-relaxed"
                            >
                                {tips[currentTip]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
