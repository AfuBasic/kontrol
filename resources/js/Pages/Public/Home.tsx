import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { apply } from '@/routes/public';

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
                <title>Kontrol — Your Estate, Fully Coordinated</title>
                <meta
                    name="description"
                    content="Kontrol coordinates everything that keeps your estate running — visitor access, dues, announcements, and security — from one platform your whole community uses."
                />
                <meta property="og:title" content="Kontrol — Your Estate, Fully Coordinated" />
                <meta
                    property="og:description"
                    content="Kontrol coordinates everything that keeps your estate running — visitor access, dues, announcements, and security — from one platform your whole community uses."
                />
                <meta property="og:url" content="https://usekontrol.com" />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="https://usekontrol.com/assets/images/app-icon.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Kontrol — Your Estate, Fully Coordinated" />
                <meta
                    name="twitter:description"
                    content="Kontrol coordinates everything that keeps your estate running — visitor access, dues, announcements, and security — from one platform your whole community uses."
                />
                <meta name="twitter:image" content="https://usekontrol.com/assets/images/app-icon.png" />
                <link rel="canonical" href="https://usekontrol.com" />
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

                    {/* Hero Text Readability Scrim Overlay */}
                    <div
                        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#07101d]/60 via-[#07101d]/40 to-[#07101d]/85"
                        aria-hidden="true"
                    />

                    <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-6xl items-center justify-center px-6 text-center text-white sm:px-8">
                        <div className="flex max-w-5xl flex-col items-center">
                            <h1 className="kontrol-hero-reveal kontrol-hero-reveal-headline flex flex-col items-center text-5xl leading-[0.96] font-semibold tracking-normal text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.85)] sm:text-7xl lg:text-8xl">
                                <span className="block overflow-hidden py-1.5">
                                    <span className="gsap-hero-title-line block">Your Estate,</span>
                                </span>
                                <span className="block overflow-hidden py-1.5">
                                    <span className="gsap-hero-title-line block text-white">Fully Coordinated.</span>
                                </span>
                            </h1>

                            <p className="kontrol-hero-reveal gsap-hero-stagger-item mt-6 max-w-2xl text-lg font-medium text-white sm:text-xl drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                                From visitors at the gate to dues in the bank — Kontrol keeps your estate running without the chaos.
                            </p>

                            <div className="kontrol-hero-reveal kontrol-hero-reveal-cta gsap-hero-stagger-item mt-10 flex flex-col items-center">
                                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                    <MagneticButton>
                                        <Link
                                            href={apply.url()}
                                            prefetch="click"
                                            className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-[#07101d] shadow-[0_18px_50px_rgba(2,8,23,0.38),0_0_34px_rgba(31,111,219,0.3)] transition duration-300 hover:bg-white/95 hover:shadow-[0_22px_64px_rgba(2,8,23,0.45),0_0_44px_rgba(31,111,219,0.4)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101d] focus-visible:outline-none motion-reduce:transition-none"
                                        >
                                            Apply for Your Estate
                                        </Link>
                                    </MagneticButton>

                                    <Link
                                        href="/product/residents#download"
                                        className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/30 bg-slate-900/60 px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-300 hover:border-white/60 hover:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101d] focus-visible:outline-none"
                                    >
                                        Download the App &darr;
                                    </Link>
                                </div>
                                <span className="mt-4 text-xs font-medium text-slate-300 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
                                    Already a resident? Your estate needs to be on Kontrol first.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PERSONA SPLIT SECTION - TWO AUDIENCES */}
                <section className="bg-white pt-24 pb-20 sm:pt-32 sm:pb-28 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="gsap-stagger-section mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Card 1: Estate Managers */}
                            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 sm:p-10 transition-all duration-300 hover:border-blue-500/30 dark:border-slate-800/80 dark:bg-slate-900/30 dark:hover:border-blue-500/30">
                                <div>
                                    <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        For Estate Managers
                                    </span>
                                    <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                        Manage gate access, dues, announcements, and your full estate — from one dashboard.
                                    </h3>
                                    <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                        Eliminate gate bottlenecks, automate fee collection, and maintain complete real-time visibility over your entire community operations.
                                    </p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                                    <Link
                                        href="/product/estates"
                                        className="inline-flex items-center font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Explore the Platform &rarr;
                                    </Link>
                                </div>
                            </div>

                            {/* Card 2: Residents */}
                            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 sm:p-10 transition-all duration-300 hover:border-cyan-500/30 dark:border-slate-800/80 dark:bg-slate-900/30 dark:hover:border-cyan-500/30">
                                <div>
                                    <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                                        For Residents
                                    </span>
                                    <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                        Generate visitor passes, pay dues, and stay connected to your estate — all from your phone.
                                    </h3>
                                    <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                        No more calls from security when your guests arrive. Grant instant gate passes, settle estate invoices, and receive updates directly on your mobile device.
                                    </p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                                    <Link
                                        href="/product/residents#download"
                                        className="inline-flex items-center font-semibold text-cyan-700 transition-colors hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                                    >
                                        Download the App &rarr;
                                    </Link>
                                </div>
                            </div>
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
                            We work directly with your estate management to configure and launch your platform in days — not weeks. Apply to get your estate on Kontrol today.
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
