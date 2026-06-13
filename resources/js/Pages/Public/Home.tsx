import { Head, Link } from '@inertiajs/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Zap, MessageSquare, Fingerprint, Lock, CheckCircle2, ChevronRight, Apple, Play } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import DesktopFrame from '@/Components/Mockups/DesktopFrame';
import IphoneFrame from '@/Components/Mockups/IphoneFrame';
import { useRef } from 'react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

export default function Home() {
    const { scrollYProgress } = useScroll();
    const heroRef = useRef(null);
    const { scrollYProgress: heroProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });

    // Parallax values for Hero
    const yBg = useTransform(heroProgress, [0, 1], [0, 300]);
    const yDesktop = useTransform(heroProgress, [0, 1], [0, -100]);
    const yMobile = useTransform(heroProgress, [0, 1], [0, -250]);
    const opacityHeroText = useTransform(heroProgress, [0, 0.4], [1, 0]);

    return (
        <PublicLayout>
            <Head>
                <title>Modern Estate Access Control - Kontrol</title>
            </Head>

            {/* PREMIUM HERO SECTION */}
            <section ref={heroRef} className="relative bg-slate-950 pt-32 sm:pt-40">
                {/* Parallax Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.div style={{ y: yBg }} className="absolute inset-x-0 -inset-y-32">
                        <img
                            src="/assets/images/premium-estate-hero.png"
                            alt="Premium Real Estate"
                            className="h-full w-full object-cover opacity-60 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950" />
                        {/* Glowing orb effect */}
                        <div className="absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/30 blur-[120px]" />
                    </motion.div>
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-6 pb-64 sm:pb-80 lg:px-8 lg:pb-[400px]">
                    <motion.div
                        style={{ opacity: opacityHeroText }}
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="mx-auto max-w-5xl text-center"
                    >
                        <motion.h1
                            variants={fadeUp}
                            className="text-6xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-7xl lg:text-8xl"
                        >
                            The Operating System <br className="hidden lg:block" />
                            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">For Your Estate.</span>
                        </motion.h1>
                        <motion.p
                            variants={fadeUp}
                            className="mx-auto mt-8 max-w-2xl text-xl leading-8 font-medium text-slate-300 drop-shadow-sm sm:text-2xl"
                        >
                            Ditch the paper logs and WhatsApp groups. Manage visitors, collections, and residents with one seamlessly integrated
                            platform.
                        </motion.p>

                        <motion.div variants={fadeUp} className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
                            <Link
                                href="/apply"
                                className="group relative flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-slate-900 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)]"
                            >
                                Get Started Free
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>

                {/* OVERLAPPING HERO MOCKUPS */}
                <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-full max-w-[1200px] -translate-x-1/2 translate-y-[40%] px-4 sm:translate-y-1/2 sm:px-6">
                    <div className="pointer-events-auto relative">
                        {/* Desktop Dashboard */}
                        <motion.div style={{ y: yDesktop }} className="relative z-10 w-full">
                            <DesktopFrame src="/assets/images/screenshots/large-desktop.png" alt="Kontrol Desktop Dashboard" />
                        </motion.div>

                        {/* Floating Mobile App */}
                        <motion.div style={{ y: yMobile }} className="absolute -right-4 bottom-12 z-20 hidden md:-right-12 md:bottom-24 md:block">
                            <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
                                <IphoneFrame
                                    src="/assets/images/screenshots/frictionless-access.png"
                                    alt="Kontrol Mobile App"
                                    className="origin-bottom-right scale-90 drop-shadow-2xl md:scale-100"
                                />
                            </motion.div>
                        </motion.div>

                        {/* Floating Activity Card */}
                        <motion.div
                            className="absolute top-1/3 -left-4 z-20 hidden md:-left-12 lg:block"
                            animate={{ y: [0, 15, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                        >
                            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                                    <ShieldCheck className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Visitor Approved</p>
                                    <p className="text-xs text-slate-400">David Smith • Just now</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* THE PROBLEM SECTION - HIGH CONTRAST */}
            <section className="bg-white pt-48 pb-32 sm:pt-64 sm:pb-40 lg:pt-[450px] dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
                        >
                            Stop running your estate on spreadsheets and phone calls.
                        </motion.h2>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        className="mx-auto mt-24 grid max-w-lg grid-cols-1 gap-12 sm:max-w-none sm:grid-cols-3"
                    >
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
                            <motion.div key={index} variants={fadeUp} className="group flex flex-col items-center text-center">
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 ring-1 ring-slate-200 transition-all group-hover:scale-110 group-hover:bg-blue-50 group-hover:ring-blue-200 dark:bg-slate-800 dark:ring-slate-700 dark:group-hover:bg-blue-900/30 dark:group-hover:ring-blue-500/30">
                                    <item.icon className="h-10 w-10 text-slate-600 transition-colors group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />
                                </div>
                                <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
                                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* PREMIUM FEATURE SHOWCASE */}
            <section id="features" className="overflow-hidden bg-slate-50 py-32 sm:py-48 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="space-y-48">
                        {/* Feature 1 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: '-200px' }}
                            className="flex flex-col gap-16 lg:flex-row lg:items-center"
                        >
                            <div className="lg:w-1/2 lg:pr-16">
                                <h2 className="mb-8 text-5xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                                    Frictionless Access Control.
                                </h2>
                                <p className="mb-12 text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                                    Empower your residents to invite guests with a single tap. Generate unique QR codes that security can instantly
                                    scan at the gate.
                                </p>
                                <ul className="space-y-8">
                                    {[
                                        { title: 'Instant QR Passes', desc: 'Secure, time-bound access codes for visitors.' },
                                        { title: 'Real-time Notifications', desc: 'Know exactly when your guest arrives at the gate.' },
                                        { title: 'Digital Logs', desc: 'A complete, searchable history of everyone entering the estate.' },
                                    ].map((benefit, idx) => (
                                        <li key={idx} className="flex gap-5">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                                <Fingerprint className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{benefit.title}</h4>
                                                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{benefit.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex justify-center lg:w-1/2">
                                <motion.div
                                    initial={{ x: 100, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 40, damping: 20 }}
                                    viewport={{ once: true }}
                                >
                                    <IphoneFrame src="/assets/images/screenshots/frictionless-access.png" alt="Access Control App" />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: '-200px' }}
                            className="flex flex-col gap-16 lg:flex-row-reverse lg:items-center"
                        >
                            <div className="lg:w-1/2 lg:pl-16">
                                <h2 className="mb-8 text-5xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                                    Automated Collections.
                                </h2>
                                <p className="mb-12 text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                                    End the hassle of chasing payments. Invoice residents automatically, track balances, and generate instant
                                    financial reports.
                                </p>
                                <ul className="space-y-8">
                                    {[
                                        { title: 'Instant Billing', desc: 'Send dues to all residents with a single click.' },
                                        { title: 'Defaulter Tracking', desc: 'Automatically restrict gate access for outstanding balances.' },
                                        { title: 'Transparent Receipts', desc: 'Residents receive instant digital receipts upon payment.' },
                                    ].map((benefit, idx) => (
                                        <li key={idx} className="flex gap-5">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                                                <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{benefit.title}</h4>
                                                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{benefit.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex justify-center lg:w-1/2">
                                <motion.div
                                    initial={{ x: -100, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 40, damping: 20 }}
                                    viewport={{ once: true }}
                                >
                                    <IphoneFrame src="/assets/images/screenshots/collections.png" alt="Billing and Payments" />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: '-200px' }}
                            className="flex flex-col gap-16 lg:flex-row lg:items-center"
                        >
                            <div className="lg:w-1/2 lg:pr-16">
                                <h2 className="mb-8 text-5xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                                    Instant Communication.
                                </h2>
                                <p className="mb-12 text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                                    Replace messy chat groups with an organized system. Send estate-wide announcements and manage resident complaints
                                    in real-time.
                                </p>
                                <ul className="space-y-8">
                                    {[
                                        { title: 'Push Announcements', desc: 'Ensure every resident gets important updates instantly.' },
                                        { title: 'Complaint Tracking', desc: 'Residents can report issues and track resolution progress.' },
                                        { title: 'Organized History', desc: 'A clean log of all past communications and resolved issues.' },
                                    ].map((benefit, idx) => (
                                        <li key={idx} className="flex gap-5">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                                                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{benefit.title}</h4>
                                                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{benefit.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex justify-center lg:w-1/2">
                                <motion.div
                                    initial={{ x: 100, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 40, damping: 20 }}
                                    viewport={{ once: true }}
                                >
                                    <IphoneFrame src="/assets/images/screenshots/incidents.png" alt="Announcements and Complaints" />
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* PRICING - STRIPE INSPIRED */}
            <section className="bg-white py-32 sm:py-48 dark:bg-slate-900" id="pricing">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto mb-24 max-w-3xl text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl dark:text-white"
                        >
                            Simple, transparent pricing.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="mt-8 text-2xl text-slate-600 dark:text-slate-400"
                        >
                            One powerful platform for your entire community. No hidden fees.
                        </motion.p>
                    </div>

                    <div className="mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-3 lg:gap-12">
                        {/* Quarterly */}
                        <motion.div
                            whileHover={{ y: -8 }}
                            className="flex flex-col rounded-[2.5rem] bg-slate-50/50 p-10 ring-1 ring-slate-200 transition-shadow hover:shadow-xl dark:bg-slate-900/50 dark:ring-slate-800"
                        >
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
                        </motion.div>

                        {/* Semi-Annual - HIGHLIGHTED */}
                        <motion.div
                            whileHover={{ y: -8 }}
                            className="relative flex flex-col rounded-[2.5rem] bg-white p-10 shadow-2xl ring-2 shadow-blue-900/20 ring-blue-600 dark:bg-slate-800"
                        >
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
                            <Link
                                href="/apply"
                                className="mt-12 block w-full rounded-2xl bg-blue-600 px-3 py-4 text-center text-base font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
                            >
                                Start Free Trial
                            </Link>
                        </motion.div>

                        {/* Annual */}
                        <motion.div
                            whileHover={{ y: -8 }}
                            className="flex flex-col rounded-[2.5rem] bg-slate-50/50 p-10 ring-1 ring-slate-200 transition-shadow hover:shadow-xl dark:bg-slate-900/50 dark:ring-slate-800"
                        >
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
                        </motion.div>
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

                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8">
                    <h2 className="text-6xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl">Ready to upgrade your estate?</h2>
                    <p className="mx-auto mt-10 max-w-2xl text-2xl text-slate-300">
                        Join modern communities using Kontrol to simplify their operations.
                    </p>
                    <div className="mt-16">
                        <Link
                            href="/apply"
                            className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-12 py-6 text-2xl font-bold text-slate-900 shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:bg-slate-50"
                        >
                            Upgrade Your Estate
                        </Link>
                    </div>
                    <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row">
                        <a
                            href="https://apps.apple.com/ng/app/access-kontrol/id6772562083"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-2xl bg-slate-800/80 px-8 py-4 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-slate-700 hover:ring-white/20"
                        >
                            <Apple className="h-8 w-8" />
                            <div className="text-left">
                                <p className="text-xs font-medium text-slate-400">Download on the</p>
                                <p className="text-xl font-bold">App Store</p>
                            </div>
                        </a>
                        <a
                            href="#"
                            className="flex items-center gap-3 rounded-2xl bg-slate-800/80 px-8 py-4 text-white ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-slate-700 hover:ring-white/20"
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
        </PublicLayout>
    );
}
