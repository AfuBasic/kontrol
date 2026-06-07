import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ChevronRight, 
    QrCode, 
    Check, 
    Bell, 
    CreditCard, 
    ArrowRight, 
    Smartphone, 
    ShieldAlert, 
    Sparkles, 
    Home, 
    Send,
    MessageSquare
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface WelcomeSlideshowProps {
    estateName: string;
    userName: string;
    isPropertyOwner: boolean;
    onClose: () => void;
}

export default function WelcomeSlideshow({ estateName, userName, isPropertyOwner, onClose }: WelcomeSlideshowProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const firstName = userName.split(' ')[0];

    // Slide definitions with custom inline interactive animations
    const residentSlides = [
        {
            title: 'Community Living, Reimagined.',
            subtitle: 'Welcome to Kontrol',
            description: `Hi ${firstName}! Welcome to ${estateName}. Experience a smarter, safer, and fully connected way to manage your home.`,
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    {/* Ambient Glows */}
                    <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"></div>

                    {/* Floating Main Access Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30, rotateX: 15 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="relative z-10 w-64 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                                <h4 className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Resident Pass</h4>
                                <p className="text-xs font-bold text-white mt-0.5">{userName}</p>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                <Home className="h-4 w-4 text-indigo-400" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-slate-400">Status</p>
                                <p className="text-xs font-bold text-emerald-400">Active • {estateName}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Ambient Notification */}
                    <motion.div
                        initial={{ opacity: 0, x: -30, y: -20 }}
                        animate={{ opacity: 1, x: 0, y: -10 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="absolute top-8 left-4 z-20 flex w-48 items-center gap-2.5 rounded-xl border border-white/5 bg-slate-900/80 p-2.5 shadow-lg backdrop-blur-md"
                    >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20">
                            <Bell className="h-3 w-3 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-white truncate">Estate Notice</p>
                            <p className="text-[8px] text-slate-400 truncate">Meeting starts at 6 PM</p>
                        </div>
                    </motion.div>
                </div>
            )
        },
        {
            title: 'Let Guests In Without The Calls.',
            subtitle: 'Visitor Access',
            description: 'Generate secure visitor access codes instantly and receive real-time alerts the second your guest arrives at the gate.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    <div className="absolute top-1/3 right-1/4 h-28 w-28 rounded-full bg-orange-500/10 blur-2xl"></div>

                    {/* QR Code Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 flex flex-col items-center rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                    >
                        <div className="rounded-lg bg-white p-2.5">
                            <QrCode className="h-24 w-24 text-slate-950" />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Invite Code</p>
                            <p className="text-sm font-bold text-white tracking-widest mt-0.5">829 - 102</p>
                        </div>
                    </motion.div>

                    {/* Floating SMS alert */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="absolute bottom-6 left-6 right-6 z-20 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/25">
                            <Smartphone className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase">Gate Notification</p>
                            <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Guest "John Doe" has checked in.</p>
                        </div>
                    </motion.div>
                </div>
            )
        },
        {
            title: 'Pay Community Dues In Seconds.',
            subtitle: 'Levies & Payments',
            description: 'Track, view, and settle outstanding community dues, security levies, and contributions seamlessly via secured gateways.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-radial-at-c from-emerald-500/10 via-transparent to-transparent"></div>

                    {/* Floating Credit Card */}
                    <motion.div
                        initial={{ opacity: 0, rotateY: -15, y: -25 }}
                        animate={{ opacity: 1, rotateY: 0, y: -10 }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 w-56 rounded-xl border border-white/10 bg-gradient-to-tr from-emerald-600 to-indigo-600 p-4 shadow-xl shadow-slate-950/45"
                    >
                        <div className="flex justify-between items-start">
                            <CreditCard className="h-7 w-7 text-white" />
                            <span className="text-[8px] font-bold text-white/70 tracking-widest uppercase">Secured</span>
                        </div>
                        <div className="mt-8">
                            <p className="text-[8px] text-white/50 tracking-wider">OUTSTANDING BALANCE</p>
                            <p className="text-lg font-black text-white mt-0.5">₦25,000.00</p>
                        </div>
                    </motion.div>

                    {/* Check Overlay */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: 'spring' }}
                        className="absolute bottom-6 z-20 flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-950/80 px-4 py-1.5 shadow-lg shadow-emerald-950/40"
                    >
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                            <Check className="h-2.5 w-2.5 font-bold" />
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Transaction Settled</span>
                    </motion.div>
                </div>
            )
        },
        {
            title: 'Stay Connected When It Matters.',
            subtitle: 'Alerts & Communications',
            description: 'Get direct announcements, report security concerns, and stay informed with instant notifications.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-6">
                    <div className="absolute top-1/4 left-1/3 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl"></div>

                    <div className="w-full space-y-3 relative z-10">
                        {/* Feed Item 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/90 p-3 shadow-md"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
                                <ShieldAlert className="h-4 w-4 text-rose-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-white">Emergency Broadcast</p>
                                <p className="text-[9px] text-slate-400 truncate mt-0.5">Alert dispatched to main gate post.</p>
                            </div>
                        </motion.div>

                        {/* Feed Item 2 */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/90 p-3 shadow-md"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                                <MessageSquare className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-white">Admins & Notices</p>
                                <p className="text-[9px] text-slate-400 truncate mt-0.5">Estate dues reconciliation is complete.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )
        }
    ];

    // Property Owner Slideshow Flow
    const propertyOwnerSlides = [
        {
            title: 'Welcome to your Portfolio.',
            subtitle: 'Onboarding',
            description: `Hi ${firstName}! Monitor occupancy levels, manage units, and track real-time payments across all your properties.`,
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-64 rounded-xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl"
                    >
                        <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Property Owner</h4>
                        <h3 className="text-sm font-black text-white mt-1">{estateName} Portfolio</h3>
                        
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-slate-950 p-2.5 border border-white/5 text-center">
                                <span className="text-[9px] font-medium text-slate-400 block">Total Units</span>
                                <span className="text-base font-black text-indigo-400 mt-0.5 block">12</span>
                            </div>
                            <div className="rounded-lg bg-slate-950 p-2.5 border border-white/5 text-center">
                                <span className="text-[9px] font-medium text-slate-400 block">Occupied</span>
                                <span className="text-base font-black text-emerald-400 mt-0.5 block">9</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        },
        {
            title: 'Settle Levies & Charges Effortlessly.',
            subtitle: 'Dues & Management',
            description: 'Automate billing cycles, collect service charges, and check payment statuses instantly for all assigned tenants.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-radial-at-c from-indigo-500/10 via-transparent to-transparent"></div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="w-60 rounded-xl border border-white/10 bg-slate-900/90 p-4 shadow-xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="text-[10px] font-bold text-white">Recent Collections</span>
                            <CreditCard className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="mt-3 space-y-2.5">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-300">Unit 4B - Rent</span>
                                <span className="font-bold text-emerald-400">+ ₦450k</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-300">Unit 2A - Service</span>
                                <span className="font-bold text-emerald-400">+ ₦50k</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    ];

    const slides = isPropertyOwner ? propertyOwnerSlides : residentSlides;

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleComplete();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('seen_resident_welcome', 'true');
        onClose();
    };

    const slide = slides[currentSlide];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#090d16]/95 shadow-[0_24px_80px_rgba(0,0,0,0.85)] sm:max-w-lg"
            >
                {/* Skip Button */}
                <button
                    onClick={handleComplete}
                    className="absolute top-6 right-6 z-[110] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-white/15 hover:text-white active:scale-90"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Unified slide visual preview area */}
                <div className="relative h-64 w-full border-b border-white/5 bg-slate-950/50">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 h-full w-full"
                        >
                            {slide.visual}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Content description area */}
                <div className="px-8 pt-8 pb-4 sm:px-10 sm:pt-10">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="text-center"
                        >
                            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase sm:text-xs">
                                {slide.subtitle}
                            </span>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl leading-snug">
                                {slide.title}
                            </h2>
                            <p className="mt-3 text-xs leading-relaxed font-semibold text-slate-400 sm:text-sm">
                                {slide.description}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Controls and progress footer */}
                <div className="px-8 pb-8 sm:px-10 sm:pb-10">
                    {/* Premium Progress Bar Indicators */}
                    <div className="flex justify-center gap-2.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-1.5 cursor-pointer rounded-full transition-all duration-500 ${
                                    currentSlide === i ? 'w-8 bg-indigo-500' : 'w-2 bg-white/10 hover:bg-white/20'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Control Buttons */}
                    <div className="mt-8 flex items-center justify-between gap-4">
                        {currentSlide > 0 ? (
                            <button
                                onClick={prevSlide}
                                className="cursor-pointer rounded-xl bg-white/5 border border-white/5 px-5 py-3 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 sm:text-sm active:scale-95"
                            >
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                className="cursor-pointer rounded-xl px-5 py-3 text-xs font-bold text-slate-400 transition-all hover:text-white sm:text-sm"
                            >
                                Skip
                            </button>
                        )}

                        <button
                            onClick={nextSlide}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/35 transition-all hover:bg-indigo-500 active:scale-95 sm:text-sm"
                        >
                            {currentSlide === slides.length - 1 ? (
                                <>
                                    Get Started
                                    <Sparkles className="h-3.5 w-3.5" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
