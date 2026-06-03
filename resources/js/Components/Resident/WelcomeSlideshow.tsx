import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Key, Wallet, ChevronRight, X, Users, Home } from 'lucide-react';

interface WelcomeSlideshowProps {
    estateName: string;
    userName: string;
    isPropertyOwner: boolean;
    onClose: () => void;
}

export default function WelcomeSlideshow({ estateName, userName, isPropertyOwner, onClose }: WelcomeSlideshowProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const residentSlides = [
        {
            title: "Welcome to Kontrol",
            subtitle: `Your hub for ${estateName}`,
            description: `Hi ${userName.split(' ')[0]}! Welcome to your digital estate dashboard. Access notice boards, manage visitor entry, and handle dues in a secure app.`,
            icon: Sparkles,
            iconColor: "text-indigo-400",
        },
        {
            title: "Guest Access Codes",
            subtitle: "Seamless visitor entry",
            description: "Generate temporary access codes for your guests, delivery agents, or household workers, and receive real-time check-in alerts.",
            icon: Key,
            iconColor: "text-blue-400",
        },
        {
            title: "Notice Board & Bills",
            subtitle: "Stay updated, settle dues",
            description: "Read announcements from both the estate admin and your landlord. Review and securely pay outstanding bills in a tap.",
            icon: Wallet,
            iconColor: "text-purple-400",
        }
    ];

    const propertyOwnerSlides = [
        {
            title: "Welcome to Kontrol",
            subtitle: `Portfolio Hub for ${estateName}`,
            description: `Hi ${userName.split(' ')[0]}! Welcome to your property owner dashboard. Manage your property holdings and occupant activities from one central hub.`,
            icon: Sparkles,
            iconColor: "text-indigo-400",
        },
        {
            title: "Tenant Management",
            subtitle: "Delegate & Invite occupants",
            description: "Easily invite residents to your properties manually or share a secure invite link. Monitor resident status and outstanding dues effortlessly.",
            icon: Users,
            iconColor: "text-emerald-400",
        },
        {
            title: "Custom Billing & Notices",
            subtitle: "Collect rent, broadcast updates",
            description: "Create custom collections to track rent or utility dues, and broadcast announcements specifically to your tenants.",
            icon: Wallet,
            iconColor: "text-purple-400",
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
    const IconComponent = slide.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-indigo-950/25"
            >
                {/* Header Dark Gradient Panel */}
                <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white">
                    <button
                        onClick={handleComplete}
                        className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 active:scale-90"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="mt-8 flex flex-col items-center text-center">
                        <motion.div
                            key={currentSlide}
                            initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-xl shadow-slate-950/10 ring-1 ring-white/20"
                        >
                            <IconComponent className={`h-8 w-8 ${slide.iconColor}`} />
                        </motion.div>

                        <motion.span
                            key={`subtitle-${currentSlide}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-[10px] font-black tracking-widest uppercase text-white/60"
                        >
                            {slide.subtitle}
                        </motion.span>
                        <motion.h2
                            key={`title-${currentSlide}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="mt-2 text-2xl font-black tracking-tight"
                        >
                            {slide.title}
                        </motion.h2>
                    </div>

                    {/* Wave visual background decoration */}
                    <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5 blur-xl" />
                    <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/5 blur-xl" />
                </div>

                {/* Content Panel */}
                <div className="p-8">
                    <div className="min-h-[96px] text-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentSlide}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm leading-relaxed text-slate-500 font-medium"
                            >
                                {slide.description}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {/* Progress Dots Indicator */}
                    <div className="mt-8 flex justify-center gap-2">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    currentSlide === i ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Controls Footer */}
                    <div className="mt-8 flex items-center justify-between gap-4">
                        {currentSlide > 0 ? (
                            <button
                                onClick={prevSlide}
                                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Skip
                            </button>
                        )}

                        <button
                            onClick={nextSlide}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition-all"
                        >
                            {currentSlide === slides.length - 1 ? (
                                <>Get Started</>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
