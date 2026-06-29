import { Head, Link } from '@inertiajs/react';
import { ShieldCheck, Zap, MessageSquare, CheckCircle2, Apple } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Player, PlayerRef } from '@remotion/player';

import InteractiveTilt from '@/Components/Public/InteractiveTilt';
import MagneticButton from '@/Components/Public/MagneticButton';
import InteractiveShowcase from '@/Components/Public/InteractiveShowcase';
import { CinematicEstate } from '@/Remotion/CinematicEstate';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<PlayerRef>(null);
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.play();
        }
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

            // --- HERO TEXT ENTRANCE (Line by Line Mask Reveal) ---
            const heroTimeline = gsap.timeline();

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
        },
        { scope: containerRef, dependencies: [isReducedMotion] },
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
                {/* HERO CINEMATIC EXPERIENCE */}
                <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 pt-20">
                    {/* Layer 1 (Background): Cinematic Remotion Experience */}
                    <div className="absolute inset-0 z-0 h-full w-full [&_canvas]:object-cover [&_video]:object-cover">
                        <Player
                            ref={playerRef}
                            component={CinematicEstate}
                            durationInFrames={300}
                            fps={30}
                            compositionWidth={1280}
                            compositionHeight={720}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            loop
                            autoPlay
                            muted
                            controls={false}
                            clickToPlay={false}
                        />
                        {/* Semi-transparent dark overlay to secure readability */}
                        <div className="absolute inset-0 bg-slate-950/50 mix-blend-multiply" />
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
                    </div>

                    {/* Layer 2 (Foreground): Standard React HTML */}
                    <div className="relative z-10 mx-auto max-w-5xl px-6 text-center text-white">
                        <div className="gsap-hero-content flex flex-col items-center will-change-transform">
                            <h1 className="flex flex-col items-center text-5xl leading-none font-extrabold tracking-tight text-white drop-shadow-lg sm:text-7xl lg:text-8xl">
                                <span className="inline-block overflow-hidden py-1.5 leading-none">
                                    <span className="gsap-hero-title-line inline-block">The Operating System</span>
                                </span>
                                <span className="inline-block overflow-hidden bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text py-1.5 leading-none text-transparent">
                                    <span className="gsap-hero-title-line inline-block">For Modern Estates</span>
                                </span>
                            </h1>

                            <p className="gsap-hero-stagger-item mx-auto mt-8 max-w-3xl text-xl leading-relaxed font-semibold text-slate-300 drop-shadow-md sm:text-2xl">
                                Modernise every part of your estate—from visitor access and collections to resident communication and security—all in
                                one intelligent platform.
                            </p>

                            <div className="gsap-hero-stagger-item mt-12 flex justify-center">
                                <MagneticButton>
                                    <Link
                                        href="/apply"
                                        className="group relative flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-slate-900 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)] active:scale-95"
                                    >
                                        Get Started Free
                                    </Link>
                                </MagneticButton>
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

                {/* PRICING - STRIPE INSPIRED */}
                <section className="bg-white py-32 sm:py-48 dark:bg-slate-950" id="pricing">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto mb-24 max-w-3xl text-center">
                            <h2 className="gsap-fade-up text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl dark:text-white">
                                Simple, transparent pricing.
                            </h2>
                            <p className="gsap-fade-up mt-8 text-2xl text-slate-600 dark:text-slate-400">
                                One powerful platform for your entire community. No hidden fees.
                            </p>
                        </div>

                        <div className="gsap-stagger-section mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-3 lg:gap-12">
                            {/* Quarterly */}
                            <InteractiveTilt maxRotation={4} className="h-full">
                                <div className="flex h-full flex-col rounded-[2.5rem] bg-slate-50/50 p-10 ring-1 ring-slate-200 transition-shadow duration-300 hover:shadow-xl dark:bg-slate-900/30 dark:ring-slate-800">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quarterly</h3>
                                    <div className="mt-6 flex items-baseline gap-x-2">
                                        <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">₦15k</span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Per resident / Quarter</p>

                                    <div className="mt-10 flex-1 space-y-4">
                                        <p className="mb-4 font-semibold text-slate-900 dark:text-white">Everything included:</p>
                                        {['Visitor Management', 'Estate Payments', 'Announcements', 'Resident Complaints', 'Unlimited Residents'].map(
                                            (feature, i) => (
                                                <div key={i} className="flex gap-x-3 text-base text-slate-700 dark:text-slate-300">
                                                    <CheckCircle2 className="h-6 w-6 shrink-0 text-slate-400" />
                                                    {feature}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </InteractiveTilt>

                            {/* Semi-Annual - HIGHLIGHTED */}
                            <InteractiveTilt maxRotation={5} className="h-full">
                                <div className="relative flex h-full flex-col rounded-[2.5rem] bg-white p-10 shadow-2xl ring-2 shadow-blue-900/10 ring-blue-600 dark:bg-slate-900">
                                    <div className="absolute inset-x-0 -top-5 flex justify-center">
                                        <span className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold tracking-wide text-white shadow-lg">
                                            RECOMMENDED
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Semi-Annual</h3>
                                    <div className="mt-6 flex items-baseline gap-x-2">
                                        <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">₦27k</span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Per resident / 6 Months</p>
                                    <div className="mt-4 inline-flex self-start rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                        Save 10%
                                    </div>
                                    <div className="mt-10 flex-1 space-y-4">
                                        <p className="mb-4 font-semibold text-slate-900 dark:text-white">Everything included:</p>
                                        {['Visitor Management', 'Estate Payments', 'Announcements', 'Resident Complaints', 'Unlimited Residents'].map(
                                            (feature, i) => (
                                                <div key={i} className="flex gap-x-3 text-base font-medium text-slate-900 dark:text-white">
                                                    <CheckCircle2 className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />
                                                    {feature}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <div className="mt-12">
                                        <MagneticButton>
                                            <Link
                                                href="/apply"
                                                className="block w-full rounded-2xl bg-blue-600 px-6 py-4 text-center text-base font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
                                            >
                                                Start Free Trial
                                            </Link>
                                        </MagneticButton>
                                    </div>
                                </div>
                            </InteractiveTilt>

                            {/* Annual */}
                            <InteractiveTilt maxRotation={4} className="h-full">
                                <div className="flex h-full flex-col rounded-[2.5rem] bg-slate-50/50 p-10 ring-1 ring-slate-200 transition-shadow duration-300 hover:shadow-xl dark:bg-slate-900/30 dark:ring-slate-800">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Annual</h3>
                                    <div className="mt-6 flex items-baseline gap-x-2">
                                        <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">₦48k</span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Per resident / Year</p>
                                    <div className="mt-4 inline-flex self-start rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                        Save 20%
                                    </div>
                                    <div className="mt-10 flex-1 space-y-4">
                                        <p className="mb-4 font-semibold text-slate-900 dark:text-white">Everything included:</p>
                                        {['Visitor Management', 'Estate Payments', 'Announcements', 'Resident Complaints', 'Unlimited Residents'].map(
                                            (feature, i) => (
                                                <div key={i} className="flex gap-x-3 text-base text-slate-700 dark:text-slate-300">
                                                    <CheckCircle2 className="h-6 w-6 shrink-0 text-slate-400" />
                                                    {feature}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </InteractiveTilt>
                        </div>
                    </div>
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
                        <h2 className="text-6xl leading-tight font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl">
                            Ready to upgrade your estate?
                        </h2>
                        <p className="mx-auto mt-10 max-w-2xl text-2xl text-slate-300">
                            Join modern communities using Kontrol to simplify their operations.
                        </p>
                        <div className="mt-16 flex justify-center">
                            <MagneticButton>
                                <Link
                                    href="/apply"
                                    className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-12 py-6 text-2xl font-bold text-slate-900 shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all hover:bg-slate-50"
                                >
                                    Upgrade Your Estate
                                </Link>
                            </MagneticButton>
                        </div>
                        <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row">
                            <a
                                href="https://apps.apple.com/ng/app/access-kontrol/id6772562083"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-2xl bg-slate-800/80 px-8 py-4 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-slate-700 hover:ring-white/20"
                            >
                                <Apple className="h-8 w-8" />
                                <div className="text-left">
                                    <p className="text-xs font-medium text-slate-400">Download on the</p>
                                    <p className="text-xl font-bold">App Store</p>
                                </div>
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-2xl bg-slate-800/80 px-8 py-4 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-slate-700 hover:ring-white/20"
                            >
                                <img src="/assets/images/google-play.svg" alt="Google Play" className="h-8 w-8" />
                                <div className="text-left">
                                    <p className="text-xs font-medium text-slate-400">GET IT ON</p>
                                    <p className="text-xl font-bold">Google Play</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
