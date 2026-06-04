import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Key, Wallet, ChevronRight, X, Users, Home, Megaphone, AlertTriangle } from 'lucide-react';

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
            title: 'Welcome to Kontrol',
            subtitle: 'Your Digital Estate Hub',
            description: `Hi ${userName.split(' ')[0]}! Experience a smarter way of living. Manage guest access, read notices, and settle bills in one unified app.`,
            icon: Sparkles,
            themeBg: 'bg-indigo-600',
        },
        {
            title: 'Guest Access Codes',
            subtitle: 'Secure Access Control',
            description: 'Generate temporary gate codes for your family, friends, or delivery agents. Get notified in real-time when they arrive.',
            icon: Key,
            themeBg: 'bg-blue-600',
        },
        {
            title: 'Announcements Feed',
            subtitle: 'Estate & Landlord Board',
            description: 'Stay informed with notice boards. Read updates from the Estate Admin and notices broadcasted directly from your Landlord.',
            icon: Megaphone,
            themeBg: 'bg-amber-500',
        },
        {
            title: 'Report Incidents',
            subtitle: 'Quick Safety Updates',
            description:
                'Report security concerns, maintenance issues, or emergencies immediately. Keep the estate security and admins updated in real-time.',
            icon: AlertTriangle,
            themeBg: 'bg-rose-500',
        },
        {
            title: 'Settle Dues Easily',
            subtitle: 'Hassle-Free Payments',
            description: 'View and pay outstanding bills. Track your payments for estate levies, recurring bills, and more all in one place.',
            icon: Wallet,
            themeBg: 'bg-purple-600',
        },
    ];

    const propertyOwnerSlides = [
        {
            title: 'Welcome to Kontrol',
            subtitle: 'Landlord & Portfolio Hub',
            description: `Hi ${userName.split(' ')[0]}! Welcome to your property owner dashboard. Manage units, invite residents, and oversee bills across your estate holdings.`,
            icon: Sparkles,
            themeBg: 'bg-indigo-600',
        },
        {
            title: 'Manage Your Portfolio',
            subtitle: 'Unit & Occupancy Tracking',
            description: 'Track your property holdings inside the estate. Monitor occupied units, vacant properties, and resident lists at a glance.',
            icon: Home,
            themeBg: 'bg-blue-600',
        },
        {
            title: 'Seamless Resident Onboarding',
            subtitle: 'Invite & Oversee Residents',
            description:
                'Invite new occupants by sharing a secure registration link or manually adding them. Manage resident profiles and unit assignments with ease.',
            icon: Users,
            themeBg: 'bg-emerald-600',
        },
        {
            title: 'Bills & Announcements',
            subtitle: 'Direct Collections & Updates',
            description:
                'Set up custom payment collections for rent or service charges. Broadcast important announcements directly to all your occupants.',
            icon: Wallet,
            themeBg: 'bg-purple-600',
        },
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
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-indigo-950/25 sm:max-w-lg"
            >
                {/* Close Button (fixed at top-right, always accessible) */}
                <button
                    onClick={handleComplete}
                    className="absolute top-6 right-6 z-[110] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 active:scale-90"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Slide Content Wrapper */}
                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="w-full"
                        >
                            {/* Header Dark Gradient Panel */}
                            <div className="flex flex-col items-center bg-slate-950 px-8 py-10 text-center text-white sm:px-10 sm:py-12">
                                <div
                                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl sm:h-20 sm:w-20 ${slide.themeBg} text-white shadow-lg shadow-indigo-950/40`}
                                >
                                    <IconComponent className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                                </div>

                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase sm:text-xs">{slide.subtitle}</span>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{slide.title}</h2>
                            </div>

                            {/* Content Panel */}
                            <div className="px-8 py-8 sm:px-10 sm:py-10">
                                <div className="flex min-h-[88px] items-center justify-center text-center sm:min-h-[104px]">
                                    <p className="text-sm leading-relaxed font-medium text-slate-700 sm:text-base">{slide.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Fixed controls and indicators footer */}
                <div className="px-8 pb-8 sm:px-10 sm:pb-10">
                    {/* Progress Dots Indicator */}
                    <div className="flex justify-center gap-2">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                                    currentSlide === i ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Controls Footer */}
                    <div className="mt-8 flex items-center justify-between gap-4">
                        {currentSlide > 0 ? (
                            <button
                                onClick={prevSlide}
                                className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 sm:px-5 sm:py-3 sm:text-sm"
                            >
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 sm:px-5 sm:py-3 sm:text-sm"
                            >
                                Skip
                            </button>
                        )}

                        <button
                            onClick={nextSlide}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 sm:px-6 sm:py-3 sm:text-sm ${
                                currentSlide === slides.length - 1 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                            }`}
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
