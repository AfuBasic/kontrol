import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Smartphone, Zap, Lock, ArrowRight, MousePointer2, CheckCircle2, Wifi } from 'lucide-react';
import SEO from '@/Components/Landing/SEO';
import LandingLayout from '@/Layouts/LandingLayout';
import { login } from '@/routes';

export default function Mobile() {
    const mobileValueProps = [
        {
            title: 'Sub-second Latency',
            description: 'Optimized for speed. Every tap and transition feels instantaneous, even on slower networks.',
            icon: Zap,
        },
        {
            title: 'Native-like Experience',
            description: 'Leveraging modern web technology to provide a fluid, app-like feel without the friction of an app store.',
            icon: Smartphone,
        },
        {
            title: 'Biometric Ready',
            description: 'Secure your operations with native biometric authentication for sensitive actions.',
            icon: Lock,
        },
        {
            title: 'Offline Resiliency',
            description: 'Core security functions are designed to work reliably even when connectivity is intermittent.',
            icon: Wifi,
        },
    ];

    return (
        <LandingLayout isDark={true}>
            <SEO
                title="A Native-Like Mobile Experience"
                description="Kontrol is built for the palm of your hand. Experience fast, fluid, and reliable estate management through our premium mobile-first platform."
            />

            {/* Grid & Ambient Glows Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[150px]" />
            </div>

            {/* --- HERO --- */}
            <header className="relative z-10 overflow-hidden pt-32 pb-20 text-white lg:pt-48 lg:pb-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-indigo-950/60 border border-indigo-850 px-4 py-1.5 text-xs font-bold tracking-widest text-indigo-400 uppercase shadow-sm">
                                <MousePointer2 className="h-3.5 w-3.5" />
                                <span>Built for Touch</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                                The Power of <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Native</span> on the Web.
                            </h1>
                            <p className="mt-8 max-w-xl text-xl leading-relaxed font-medium text-slate-400">
                                We've obsessed over every pixel and micro-interaction to ensure Kontrol feels like a high-end native app on any
                                device.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <Link
                                    href={login().url}
                                    className="flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-10 text-lg font-bold text-white shadow-xl hover:bg-indigo-500 shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    Try on Mobile
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                            <div className="relative z-10 rounded-[3.5rem] bg-slate-900 p-4 border border-slate-800 shadow-2xl">
                                <img src="/images/landing/mobile.png" alt="Kontrol Mobile Experience" className="w-full rounded-[2.8rem] opacity-80" />
                            </div>
                            {/* Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-indigo-500/10 blur-3xl" />
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* --- CORE PERFORMANCE --- */}
            <section className="relative z-10 bg-slate-950/40 border-t border-slate-900 py-24">
                <div className="mx-auto mb-20 max-w-7xl px-6 text-center lg:px-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl font-sans">Engineered for the palm of your hand.</h2>
                </div>

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                        {mobileValueProps.map((prop, idx) => (
                            <motion.div
                                key={prop.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group rounded-3xl bg-slate-900/40 border border-slate-850 p-8 text-center transition-all hover:-translate-y-1.5 hover:border-slate-800"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 transition-transform group-hover:scale-110">
                                    <prop.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-white">{prop.title}</h3>
                                <p className="mt-4 text-sm leading-relaxed font-medium text-slate-400">{prop.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- VISUAL INTERACTIVE SECTION --- */}
            <section className="relative z-10 overflow-hidden bg-slate-950/20 border-t border-slate-900 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <div className="lg:order-2">
                            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">No app store, no friction.</h2>
                            <p className="mt-8 text-lg leading-relaxed font-medium text-slate-400">
                                Kontrol uses PWA (Progressive Web App) technology. This means residents can "Install" Kontrol directly from their
                                browser, receiving push notifications and a dedicated home screen icon—all while staying lightweight and secure.
                            </p>

                            <ul className="mt-12 space-y-6">
                                <li className="flex items-center gap-4">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold tracking-wide text-slate-300 uppercase">
                                        Instant Updates (No Store Approval)
                                    </span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold tracking-wide text-slate-300 uppercase">Low Storage Requirement</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold tracking-wide text-slate-300 uppercase">
                                        Cross-Platform (iOS, Android, Desktop)
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="relative lg:order-1">
                            {/* Decorative Mobile Flow Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="relative z-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 shadow-2xl"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Mobile Notification</h4>
                                        <Zap className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
                                            <Smartphone className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-white">New Access Code Generated</p>
                                            <p className="mt-1 text-xs font-medium text-slate-400 font-mono">Guest: John Smith • Code: K-1234</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '100%' }}
                                                transition={{ duration: 1.5 }}
                                                className="h-full bg-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="relative z-10 bg-indigo-950/20 border-t border-slate-900 py-24 text-white">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Experience the difference.</h2>
                    <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed font-medium text-slate-400">
                        Join the hundreds of residents who enjoy a seamless, mobile-first lifestyle with Kontrol.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Link
                            href={login().url}
                            className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-lg font-bold text-slate-950 shadow-xl transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
                        >
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
