import { Head, Link } from '@inertiajs/react';
import { ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { apply } from '@/routes/public';

import InteractiveTilt from '@/Components/Public/InteractiveTilt';
import MagneticButton from '@/Components/Public/MagneticButton';
import InteractiveShowcase from '@/Components/Public/InteractiveShowcase';
import CinematicHero from '@/Components/Public/CinematicHero';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReducedMotion, setIsReducedMotion] = useState(false);
    const [isHeroSequenceStarted, setIsHeroSequenceStarted] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const startHeroSequence = () => setIsHeroSequenceStarted(true);

        if (document.documentElement.dataset.kontrolPublicReady === 'true') {
            startHeroSequence();
            return;
        }

        window.addEventListener('kontrol:public-ready', startHeroSequence, { once: true });

        return () => window.removeEventListener('kontrol:public-ready', startHeroSequence);
    }, []);

    useGSAP(
        () => {
            if (isReducedMotion) {
                // Instant visibility for accessibility
                gsap.set('.gsap-hero-title-line, .gsap-hero-stagger-item, .gsap-fade-up, .gsap-stagger-section > *', {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    scale: 1,
                });
                return;
            }

            if (isHeroSequenceStarted) {
                // --- HERO TEXT ENTRANCE (Line by Line Mask Reveal) ---
                const heroTimeline = gsap.timeline({ delay: 0.5 });

                heroTimeline.from('.gsap-hero-title-line', {
                    y: '100%',
                    opacity: 0,
                    duration: 1.2,
                    stagger: 0.2,
                    ease: 'power4.out',
                });

                heroTimeline.from(
                    '.gsap-hero-stagger-item',
                    {
                        y: 30,
                        opacity: 0,
                        duration: 0.8,
                        stagger: 0.15,
                        ease: 'power3.out',
                    },
                    '-=0.8',
                );

                // --- SCROLL CHOREOGRAPHY (FADE UP ELEMENTS) ---
                const fadeUpElements = gsap.utils.toArray<HTMLElement>('.gsap-fade-up');
                fadeUpElements.forEach((el) => {
                    gsap.from(el, {
                        y: 60,
                        opacity: 0,
                        duration: 1.0,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    });
                });

                // --- SCROLL CHOREOGRAPHY (STAGGER SECTIONS) ---
                const staggerSections = gsap.utils.toArray<HTMLElement>('.gsap-stagger-section');
                staggerSections.forEach((section) => {
                    gsap.from(section.children, {
                        y: 50,
                        opacity: 0,
                        duration: 0.8,
                        stagger: 0.18,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: section,
                            start: 'top 80%',
                            toggleActions: 'play none none none',
                        },
                    });
                });

                // --- SLIDE IN FROM SIDE (FEATURES) ---
                const slideLeftElements = gsap.utils.toArray<HTMLElement>('.gsap-slide-left');
                slideLeftElements.forEach((el) => {
                    gsap.from(el, {
                        x: 80,
                        opacity: 0,
                        duration: 1.2,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    });
                });

                const slideRightElements = gsap.utils.toArray<HTMLElement>('.gsap-slide-right');
                slideRightElements.forEach((el) => {
                    gsap.from(el, {
                        x: -80,
                        opacity: 0,
                        duration: 1.2,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                    });
                });

                // Refresh trigger metrics now that loading wrapper is gone
                setTimeout(() => {
                    ScrollTrigger.refresh();
                }, 200);
            }
        },
        { scope: containerRef, dependencies: [isReducedMotion, isHeroSequenceStarted] },
    );

    return (
        <PublicLayout>
            <Head>
                <title>Modern Estate Access Control - Kontrol</title>
                <meta
                    name="description"
                    content="Kontrol is the operating system for your estate, managing access control, automated collections, incident reports and announcements with seamless design."
                />
            </Head>

            <div ref={containerRef} className="overflow-hidden">
                <section
                    className={`relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#07101d] pt-20 ${
                        isHeroSequenceStarted ? 'kontrol-hero-sequence-started' : ''
                    }`}
                >
                    <div className="absolute inset-0 z-0 h-full w-full">
                        <CinematicHero />
                    </div>

                    <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-6xl items-center justify-center px-6 text-center text-white sm:px-8">
                        <div className="flex max-w-5xl flex-col items-center">
                            <h1 className="kontrol-hero-reveal kontrol-hero-reveal-headline flex flex-col items-center text-5xl leading-[0.96] font-semibold tracking-normal text-white drop-shadow-[0_16px_40px_rgba(0,0,0,0.42)] sm:text-7xl lg:text-8xl">
                                <span className="block overflow-hidden py-1.5">
                                    <span className="gsap-hero-title-line block">The Operating System</span>
                                </span>
                                <span className="block overflow-hidden py-1.5">
                                    <span className="gsap-hero-title-line block text-white">For Modern Estates</span>
                                </span>
                            </h1>

                            <p className="kontrol-hero-reveal gsap-hero-stagger-item mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
                                Manage gate access, service charges, and resident communication — from one platform your whole community uses.
                            </p>

                            <div className="kontrol-hero-reveal kontrol-hero-reveal-cta gsap-hero-stagger-item mt-10 flex flex-col items-center">
                                <MagneticButton>
                                    <Link
                                        href={apply.url()}
                                        prefetch="click"
                                        className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-[#07101d] shadow-[0_18px_50px_rgba(2,8,23,0.28),0_0_34px_rgba(31,111,219,0.24)] transition duration-300 hover:bg-white/92 hover:shadow-[0_22px_64px_rgba(2,8,23,0.34),0_0_44px_rgba(31,111,219,0.34)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101d] focus-visible:outline-none motion-reduce:transition-none"
                                    >
                                        Get Started Free
                                    </Link>
                                </MagneticButton>
                                <span className="mt-3 text-xs text-slate-400">
                                    First 30 days free · No credit card required
                                </span>
                                <span className="mt-1 text-xs text-slate-500">
                                    For estate managers and HOAs. Residents download the app separately.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE PROBLEM SECTION - HIGH CONTRAST */}
                <section className="bg-white pt-24 pb-20 sm:pt-32 sm:pb-28 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="gsap-fade-up text-4xl leading-tight font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                                Stop running your estate on spreadsheets and phone calls.
                            </h2>
                        </div>

                        <div className="gsap-stagger-section mx-auto mt-24 grid max-w-lg grid-cols-1 gap-12 sm:max-w-none sm:grid-cols-3">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: 'No more gate bottlenecks.',
                                    desc: 'Residents generate secure passes. Security simply scans them. Fast, secure, and fully logged.',
                                },
                                {
                                    icon: Zap,
                                    title: 'Instant Due Collections.',
                                    desc: 'Automated billing, instant receipts, and complete transparency for all estate finances.',
                                },
                                {
                                    icon: MessageSquare,
                                    title: 'Organized Communication.',
                                    desc: 'Move away from chaotic WhatsApp groups. Send targeted announcements and track complaints directly.',
                                },
                            ].map((item, index) => (
                                <InteractiveTilt key={index} maxRotation={5} className="h-full">
                                    <div className="group flex h-full flex-col items-center rounded-3xl border border-slate-100 bg-slate-50/30 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:border-blue-500/20 dark:border-slate-800/40 dark:bg-slate-900/10 dark:hover:border-blue-500/30">
                                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 ring-1 ring-blue-500/0 ring-slate-200/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-50 group-hover:ring-blue-500/20 dark:bg-slate-900 dark:group-hover:bg-blue-950/30">
                                            <item.icon className="h-10 w-10 text-slate-600 transition-colors duration-300 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />
                                        </div>
                                        <h3 className="mb-4 text-2xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                            {item.title}
                                        </h3>
                                        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                </InteractiveTilt>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PREMIUM FEATURE SHOWCASE (INTERACTIVE PRODUCT EXPERIENCE) */}
                <section id="features" className="border-t border-slate-100 bg-slate-50 dark:border-slate-900/60 dark:bg-slate-950">
                    <InteractiveShowcase />
                </section>

                {/* BIG CTA FOOTER */}
                <section id="download" className="relative overflow-hidden bg-slate-900 py-40 sm:py-56">
                    {/* Simple Dotted Pattern Background */}
                    <div
                        className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '32px 32px' }}
                    />
                    {/* Glow Effect */}
                    <div className="absolute inset-0 z-0 translate-y-1/2 scale-150 rounded-full bg-blue-600/20 blur-[100px]" />

                    <div className="gsap-fade-up relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8">
                        <h2 className="text-5xl leading-tight font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Every estate deserves better than WhatsApp and spreadsheets.
                        </h2>
                        <p className="mx-auto mt-8 max-w-2xl text-xl text-slate-300 sm:text-2xl">
                            We're currently onboarding a select cohort of forward-thinking estates. Apply today to secure a 30-day free trial with hands-on setup support.
                        </p>
                        <div className="mt-14 flex justify-center">
                            <MagneticButton>
                                <Link
                                    href={apply.url()}
                                    className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-10 py-5 text-xl font-bold text-slate-900 shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all hover:bg-slate-50"
                                >
                                    Apply for Early Access
                                </Link>
                            </MagneticButton>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
