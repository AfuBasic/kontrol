import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, useMotionValue, animate as animateX } from 'framer-motion';
import {
    Eye,
    EyeOff,
    Sparkles,
    Key,
    Wallet,
    ChevronRight,
    AlertTriangle,
    Check,
    QrCode,
    Smartphone,
    Bell,
    CreditCard,
    ShieldAlert,
    MessageSquare,
    ArrowRight,
    Shield,
    Activity,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import * as SocialLoginController from '@/actions/App/Http/Controllers/Auth/SocialLoginController';
import AuthErrorSheet from '@/Components/AuthErrorSheet';
import Toast from '@/Components/Toast';

interface LoginFlash {
    success?: string;
    error?: string;
}

export default function Login() {
    const page = usePage<{ flash: LoginFlash }>();
    const { flash } = page.props;
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        email: '',
        remember: true, // Always remember the user by default
    });
    const [googleError, setGoogleError] = useState('');
    const [showGoogleError, setShowGoogleError] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.error) {
            setLoginError(flash.error);
        }
    }, [flash?.error]);

    // Onboarding welcome slides state
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    // Ref is the ground truth — avoids stale closure on rapid button taps
    const slideIndexRef = useRef(0);
    const carouselX = useMotionValue(0);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const onboardingSlides = [
        {
            title: 'Community Living, Reimagined.',
            subtitle: 'Welcome to Kontrol',
            description: 'One platform for access, communication, payments, and peace of mind.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    {/* Floating Main Access Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, rotateX: 15 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="relative z-10 w-64 rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                                <h4 className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Resident Pass</h4>
                                <p className="mt-0.5 text-xs font-bold text-white">Gateway Estate</p>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/20">
                                <Shield className="h-4 w-4 text-indigo-400" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                                <Check className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-slate-400">Status</p>
                                <p className="text-xs font-bold text-emerald-400">Active • Verified</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Live Notification */}
                    <motion.div
                        initial={{ opacity: 0, x: -30, y: -20 }}
                        animate={{ opacity: 1, x: 0, y: -10 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="absolute top-10 left-4 z-20 flex w-48 items-center gap-2.5 rounded-xl border border-white/5 bg-slate-900/90 p-2.5 shadow-lg backdrop-blur-md"
                    >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20">
                            <Bell className="h-3 w-3 text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[9px] font-bold text-white">Access Verified</p>
                            <p className="truncate text-[8px] text-slate-400">Gate 1 • 2 mins ago</p>
                        </div>
                    </motion.div>
                </div>
            ),
        },
        {
            title: 'Let Guests In Without The Calls.',
            subtitle: 'Visitor Access',
            description: 'Generate secure visitor passes and receive instant arrival alerts.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    {/* Phone Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 w-44 rounded-[28px] border-4 border-slate-800 bg-slate-950 p-3 shadow-2xl"
                    >
                        {/* Screen Area */}
                        <div className="flex flex-col items-center">
                            {/* Pass Header */}
                            <span className="mt-1 text-[8px] font-black tracking-wider text-indigo-400 uppercase">Visitor Pass</span>
                            {/* QR Code */}
                            <div className="relative mt-3 rounded-xl bg-white p-2.5">
                                <QrCode className="h-16 w-16 text-slate-950" />
                                {/* pulse ray effect */}
                                <motion.div
                                    animate={{ y: [0, 64, 0] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                    className="absolute inset-x-2.5 top-2.5 h-0.5 bg-indigo-500 shadow-md shadow-indigo-500"
                                />
                            </div>
                            <p className="mt-3 text-[10px] font-black tracking-widest text-white">829 - 102</p>
                            <p className="mt-0.5 text-[7px] text-slate-500">Expires in 2h 14m</p>
                        </div>
                    </motion.div>

                    {/* Floating gate checked-in notification */}
                    <motion.div
                        initial={{ opacity: 0, x: 30, y: 30 }}
                        animate={{ opacity: 1, x: 0, y: 15 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="absolute right-2 bottom-12 z-20 flex w-52 items-center gap-3 rounded-xl border border-emerald-500/20 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md"
                    >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                            <Smartphone className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="text-[9px] font-black text-white uppercase">Gate Notification</p>
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-emerald-400">Guest "John Doe" checked in.</p>
                        </div>
                    </motion.div>
                </div>
            ),
        },
        {
            title: 'Pay Community Dues In Seconds.',
            subtitle: 'Levies & Payments',
            description: 'Track and settle estate levies, dues, and contributions effortlessly.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                    {/* Collection Card */}
                    <motion.div
                        initial={{ opacity: 0, rotateY: -10, y: -15 }}
                        animate={{ opacity: 1, rotateY: 0, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 w-56 rounded-2xl border border-white/10 bg-linear-to-tr from-indigo-950 via-slate-900 to-indigo-900 p-5 shadow-2xl"
                    >
                        <div className="flex items-start justify-between">
                            <CreditCard className="h-6 w-6 text-indigo-400" />
                            <span className="text-[8px] font-bold tracking-widest text-white/50 uppercase">Secured</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[8px] font-semibold tracking-wider text-slate-400 uppercase">Security & Levy</p>
                            <p className="mt-1 text-xl font-black text-white">₦15,000.00</p>
                        </div>
                    </motion.div>

                    {/* Paid Stamp */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: -5 }}
                        transition={{ delay: 0.6, type: 'spring' }}
                        className="absolute right-4 bottom-10 z-20 flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-950/90 px-3.5 py-1.5 shadow-lg shadow-emerald-950/40"
                    >
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                            <Check className="h-2.5 w-2.5 font-bold" />
                        </div>
                        <span className="text-[9px] font-black tracking-widest text-white uppercase">Paid Successfully</span>
                    </motion.div>
                </div>
            ),
        },
        {
            title: 'Stay Connected When It Matters.',
            subtitle: 'Alerts & Communications',
            description: 'Receive updates, report incidents, and stay informed in real time.',
            visual: (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-6">
                    <div className="relative z-10 w-64 space-y-3">
                        {/* Feed Item 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: -25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/90 p-3 shadow-lg backdrop-blur-sm"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20">
                                <ShieldAlert className="h-4 w-4 text-rose-400" />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                                <p className="text-[9px] font-bold text-white">Emergency Dispatch</p>
                                <p className="mt-0.5 text-[8px] text-slate-400">SOS alert sent to main security gate.</p>
                            </div>
                        </motion.div>

                        {/* Feed Item 2 */}
                        <motion.div
                            initial={{ opacity: 0, x: 25 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/90 p-3 shadow-lg backdrop-blur-sm"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20">
                                <MessageSquare className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                                <p className="text-[9px] font-bold text-white">Estate Announcement</p>
                                <p className="mt-0.5 text-[8px] text-slate-400">Water supply maintenance scheduled.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            ),
        },
    ];

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);

        // Force body to be white to prevent Android Webview black bars
        const originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffffff';

        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.style.backgroundColor = originalBg;
        };
    }, []);

    // Keep carousel aligned on resize
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        carouselX.set(-currentSlide * windowWidth);
    }, [windowWidth]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const goToSlide = (index: number) => {
        slideIndexRef.current = index;
        setCurrentSlide(index);
        animateX(carouselX, -index * windowWidth, {
            type: 'spring',
            stiffness: 300,
            damping: 35,
        });
    };

    // Track active slide index during drag
    useEffect(() => {
        const unsubscribe = carouselX.onChange((latest) => {
            const raw = -latest / windowWidth;
            const snapped = Math.round(raw);
            const clamped = Math.max(0, Math.min(onboardingSlides.length - 1, snapped));

            if (clamped !== slideIndexRef.current) {
                slideIndexRef.current = clamped;
                setCurrentSlide(clamped);
            }
        });
        return unsubscribe;
    }, [carouselX, windowWidth, onboardingSlides.length]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const hasSeenOnboarding = localStorage.getItem('seen_public_onboarding');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    useEffect(() => {
        if (showOnboarding) {
            document.documentElement.style.overscrollBehavior = 'none';
            document.body.style.overscrollBehavior = 'none';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overscrollBehavior = '';
            document.body.style.overscrollBehavior = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.documentElement.style.overscrollBehavior = '';
            document.body.style.overscrollBehavior = '';
            document.body.style.overflow = '';
        };
    }, [showOnboarding]);

    const handleOnboardingComplete = () => {
        localStorage.setItem('seen_public_onboarding', 'true');
        setShowOnboarding(false);
    };

    const nextSlide = () => {
        if (slideIndexRef.current < onboardingSlides.length - 1) {
            goToSlide(slideIndexRef.current + 1);
        } else {
            handleOnboardingComplete();
        }
    };

    const prevSlide = () => {
        if (slideIndexRef.current > 0) {
            goToSlide(slideIndexRef.current - 1);
        }
    };

    // Sync external errors to local state on initial mount
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        const extError = page.props.flash?.error || page.props.errors?.email || null;
        if (extError) {
            setLoginError(extError as string);
        }
    }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoginError(null);
        clearErrors();
        post('/login', {
            onError: (errs) => {
                const extError = errs.email || null;
                if (extError) {
                    setLoginError(extError);
                }
            },
        });
    }

    async function handleGoogleSignIn() {
        if (!Capacitor.isNativePlatform()) {
            // Web flow: Use standard Laravel Socialite redirect
            window.location.href = '/auth/google';
            return;
        }

        setGoogleLoading(true);
        setGoogleError('');

        try {
            // Force sign out first to clear any ghost sessions/partially logged in states
            await FirebaseAuthentication.signOut().catch(() => {});

            const result = await FirebaseAuthentication.signInWithGoogle({
                useCredentialManager: false,
            });

            const idToken = result.credential?.idToken;

            if (idToken) {
                router.post(
                    SocialLoginController.handleGoogleMobileToken.url(),
                    { token: idToken },
                    {
                        onFinish: () => setGoogleLoading(false),
                        onError: (errs) => {
                            console.error('Google Backend Errors:', errs);
                            const msg = typeof errs === 'string' ? errs : (errs.email || errs.error || Object.values(errs)[0] || 'Google authentication failed.');
                            setLoginError(msg);
                            setGoogleLoading(false);
                        },
                    },
                );
            } else {
                setGoogleLoading(false);
                throw new Error('No ID token returned from Google sign-in');
            }
        } catch (err: unknown) {
            let errorMessage = 'Google sign-in failed. Please try again.';
            let errorStr = '';

            if (err instanceof Error) {
                errorMessage = err.message;
                errorStr = err.toString();
            } else if (typeof err === 'object' && err !== null) {
                if ('message' in err) {
                    errorMessage = String((err as Record<string, unknown>).message);
                }
                errorStr = JSON.stringify(err);
            } else if (typeof err === 'string') {
                errorMessage = err;
                errorStr = err;
            }

            if (
                errorStr.includes('cancelled') ||
                errorStr.includes('cancelled_by_user') ||
                errorStr.includes('user_cancelled') ||
                errorStr.includes('12501') // Google Sign-in cancelled code
            ) {
                setGoogleLoading(false);
                return;
            }

            if (errorStr.includes('10:') || errorStr.includes(': 10') || errorStr === '10' || errorStr.includes('DEVELOPER_ERROR')) {
                errorMessage = 'Google Sign-In is not configured for this app version. Please use your email to sign in.';
            } else if (errorStr.includes('network') || errorStr.includes('timeout') || errorStr.includes('7:')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            setGoogleError(errorMessage);
            setShowGoogleError(true);
            setGoogleLoading(false);
        }
    }

    if (showOnboarding) {
        return (
            <>
                <Head title="Welcome" />

                {/* Full-screen clipping viewport */}
                <div ref={carouselRef} className="fixed inset-0 z-50 overflow-hidden bg-[#0B0F19]">
                    {/* Track: all slides side by side, translated by carouselX */}
                    <motion.div
                        className="flex h-full cursor-grab select-none active:cursor-grabbing"
                        style={{
                            width: `${onboardingSlides.length * 100}%`,
                            x: carouselX,
                        }}
                        drag="x"
                        dragConstraints={{
                            left: -(onboardingSlides.length - 1) * windowWidth,
                            right: 0,
                        }}
                        dragElastic={0.15}
                        dragTransition={{
                            power: 0.2,
                            timeConstant: 200,
                            modifyTarget: (target) => {
                                const slide = Math.round(-target / windowWidth);
                                const clamped = Math.max(0, Math.min(onboardingSlides.length - 1, slide));
                                return -clamped * windowWidth;
                            },
                        }}
                    >
                        {onboardingSlides.map((slide, i) => {
                            return (
                                <div
                                    key={i}
                                    className="relative flex h-full flex-col items-center justify-between bg-[#0B0F19] px-6 py-20 text-center text-white select-none"
                                    style={{
                                        width: `${100 / onboardingSlides.length}%`,
                                    }}
                                >
                                    {/* Ambient Glows per slide to give depth */}
                                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                        <div className="absolute top-10 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />
                                        {i === 1 && (
                                            <div className="absolute right-10 bottom-40 h-[200px] w-[200px] rounded-full bg-emerald-500/5 blur-[60px]" />
                                        )}
                                        {i === 2 && (
                                            <div className="absolute bottom-40 left-10 h-[200px] w-[200px] rounded-full bg-amber-500/5 blur-[60px]" />
                                        )}
                                        {i === 3 && (
                                            <div className="absolute right-10 bottom-40 h-[200px] w-[200px] rounded-full bg-rose-500/5 blur-[60px]" />
                                        )}
                                    </div>

                                    {/* Visual preview area */}
                                    <div className="relative flex max-h-[45vh] w-full flex-1 items-center justify-center">{slide.visual}</div>

                                    {/* Content Area */}
                                    <div className="relative z-10 mt-6 flex max-w-sm flex-col items-center px-4">
                                        <span className="text-[10px] font-black tracking-[0.25em] text-indigo-400 uppercase">{slide.subtitle}</span>
                                        <h2 className="mt-3.5 text-3xl leading-tight font-black tracking-tight text-white">{slide.title}</h2>
                                        <p className="mt-4 text-sm leading-relaxed font-medium text-slate-400">{slide.description}</p>
                                    </div>

                                    {/* Spacer to keep space for bottom controls */}
                                    <div className="h-24" />
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* Skip */}
                    <button
                        onClick={handleOnboardingComplete}
                        className="absolute top-12 right-6 z-20 rounded-full px-3.5 py-1.5 text-xs font-bold text-white/50 transition-colors hover:text-white"
                    >
                        Skip
                    </button>

                    {/* Bottom controls */}
                    <div className="absolute right-0 bottom-14 left-0 z-20 flex flex-col items-center gap-7 px-8">
                        {/* Dots */}
                        <div className="flex gap-2.5">
                            {onboardingSlides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToSlide(i)}
                                    className={`h-1.5 cursor-pointer rounded-full transition-all duration-500 ${
                                        currentSlide === i ? 'w-8 bg-indigo-500' : 'w-1.5 bg-white/15 hover:bg-white/25'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Prev / Next */}
                        <div className="flex w-full max-w-sm items-center justify-between">
                            {currentSlide > 0 ? (
                                <button
                                    onClick={prevSlide}
                                    className="cursor-pointer rounded-xl border border-white/5 bg-white/5 px-5 py-3 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 active:scale-95 sm:text-sm"
                                >
                                    Back
                                </button>
                            ) : (
                                <button
                                    onClick={handleOnboardingComplete}
                                    className="cursor-pointer rounded-xl px-5 py-3 text-xs font-bold text-slate-400 transition-all hover:text-white sm:text-sm"
                                >
                                    Skip
                                </button>
                            )}

                            <button
                                onClick={nextSlide}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/35 transition-all hover:bg-indigo-500 active:scale-95 sm:text-sm"
                            >
                                {currentSlide === onboardingSlides.length - 1 ? (
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
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Login" />
            <div className="flex min-h-[100dvh] flex-col bg-white lg:flex-row">
                {/* Branded panel — hidden on mobile, left side on desktop */}
                <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-1/2 lg:flex-col">
                    <div className="absolute inset-0">
                        <div className="absolute -top-24 -right-16 h-[420px] w-[420px] rounded-full bg-linear-to-br from-primary-500/40 via-indigo-500/25 to-transparent blur-[100px] lg:-top-32 lg:-right-24 lg:h-[520px] lg:w-[520px] lg:blur-[120px]" />
                        <div className="absolute -bottom-28 -left-16 h-[360px] w-[360px] rounded-full bg-linear-to-tr from-indigo-500/30 via-primary-500/15 to-transparent blur-[90px] lg:-bottom-24 lg:-left-24 lg:h-[420px] lg:w-[420px] lg:blur-[100px]" />
                        <div
                            className="absolute inset-0 opacity-[0.15] lg:opacity-[0.08]"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                                backgroundSize: '28px 28px',
                            }}
                        />
                    </div>

                    <div className="relative z-10 flex flex-1 flex-col px-6 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-24 sm:px-8 lg:p-12">
                        {/* Logo */}
                        <Link href="/" className="inline-flex items-center gap-2.5">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-10 w-10 rounded-xl lg:h-9 lg:w-9" />
                            <span className="text-xl font-semibold tracking-tight text-white lg:text-lg">Kontrol</span>
                        </Link>

                        {/* Desktop: product mock */}
                        <div className="hidden flex-1 items-center justify-center py-12 lg:flex">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="w-full max-w-sm"
                            >
                                <AccessCodePreview />
                            </motion.div>
                        </div>

                        {/* Desktop: tagline */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                            className="hidden max-w-md lg:block"
                        >
                            <h2 className="text-2xl font-semibold tracking-tight text-white">Access control your residents actually use.</h2>
                            <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                Residents generate visitor codes in seconds. Security validates them at the gate. Admins see every entry as it
                                happens.
                            </p>
                        </motion.div>

                        <p className="mt-10 hidden text-xs text-slate-500 lg:block">
                            &copy; {new Date().getFullYear()} Kontrol. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* Form panel — simple full-screen centered login on mobile, side panel on desktop */}
                <div className="flex flex-1 flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16 lg:py-12 xl:px-24">
                    <div className="mx-auto w-full max-w-sm">
                        {/* Logo on mobile/native */}
                        <div className="mb-8 flex flex-col items-center lg:hidden">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-16 w-16 rounded-2xl" />
                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                            <p className="mt-1 text-sm text-slate-500">Sign in to your estate</p>
                        </div>

                        {/* Title on desktop */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="hidden lg:block"
                        >
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
                            <p className="mt-2 text-sm text-slate-500">Sign in to your estate.</p>
                        </motion.div>

                        {flash?.success && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 lg:mt-6"
                            >
                                {flash.success}
                            </motion.div>
                        )}

                        {loginError && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 lg:mt-6"
                            >
                                {loginError}
                            </motion.div>
                        )}

                        <AuthErrorSheet
                            error={loginError}
                            onClose={() => {
                                setLoginError(null);
                                clearErrors();
                            }}
                        />

                        <motion.form
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            onSubmit={submit}
                            className="space-y-5 lg:mt-8"
                        >
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </button>

                            <div className="relative py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-3 text-xs font-medium tracking-wide text-slate-400 uppercase">or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-900/5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {googleLoading ? (
                                    <Spinner />
                                ) : (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                )}
                                {googleLoading ? 'Signing in...' : 'Continue with Google'}
                            </button>
                        </motion.form>

                        <p className="mt-8 text-center text-xs text-slate-500">
                            By signing in, you agree to our{' '}
                            <Link href="/terms" className="font-medium text-slate-700 hover:text-slate-900">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="font-medium text-slate-700 hover:text-slate-900">
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>

            <Toast show={showGoogleError} message={googleError} type="error" onClose={() => setShowGoogleError(false)} />
        </>
    );
}

function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

function AccessCodePreview() {
    return (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-700 text-white">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[11px] font-medium text-slate-400">Visitor access code</p>
                        <p className="text-sm font-semibold text-white">For Chidi, driver</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30 ring-inset">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                </span>
            </div>

            <div className="mt-5 rounded-2xl bg-linear-to-br from-white to-slate-100 p-5 text-center">
                <p className="text-[11px] font-medium tracking-[0.2em] text-slate-500 uppercase">Show at gate</p>
                <p className="mt-1.5 font-mono text-3xl font-bold tracking-[0.35em] text-slate-900 blur-md select-none" aria-hidden="true">
                    K7M2XQ
                </p>
                <p className="mt-2 text-xs text-slate-500">Expires in 2h 14m · Single use</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/5 py-2.5 ring-1 ring-white/10 ring-inset">
                    <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Visitor</p>
                    <p className="text-xs font-semibold text-white">Musa</p>
                </div>
                <div className="rounded-xl bg-white/5 py-2.5 ring-1 ring-white/10 ring-inset">
                    <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Arrives</p>
                    <p className="text-xs font-semibold text-white">Today</p>
                </div>
                <div className="rounded-xl bg-white/5 py-2.5 ring-1 ring-white/10 ring-inset">
                    <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Vehicle</p>
                    <p className="text-xs font-semibold text-white">LAG-284</p>
                </div>
            </div>
        </div>
    );
}
