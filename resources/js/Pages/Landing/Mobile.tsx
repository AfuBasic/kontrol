import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';
import { 
    Smartphone, 
    Zap, 
    TouchpadOff, 
    Wifi,
    Lock,
    ArrowRight,
    MousePointer2,
    CheckCircle2
} from 'lucide-react';
import { Link } from '@inertiajs/react';
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

            {/* --- HERO --- */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0A0F1D] text-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary-600/10 px-4 py-1.5 text-xs font-bold tracking-widest text-primary-400 uppercase shadow-sm ring-1 ring-primary-500/20 mb-8">
                                <MousePointer2 className="h-3.5 w-3.5" />
                                <span>Built for Touch</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                                The Power of <span className="text-primary-400">Native</span> on the Web.
                            </h1>
                            <p className="mt-8 text-xl font-medium text-slate-400 leading-relaxed max-w-xl">
                                We've obsessed over every pixel and micro-interaction to ensure Kontrol feels like a high-end native app on any device.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <Link
                                    href={login().url}
                                    className="flex h-14 items-center justify-center rounded-2xl bg-primary-600 px-10 text-lg font-bold text-white shadow-xl shadow-primary-600/20 transition-all hover:bg-primary-500"
                                >
                                    Try on Mobile
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                        >
                             <div className="relative z-10 rounded-[3.5rem] bg-slate-900 p-4 shadow-2xl shadow-primary-500/10 ring-1 ring-white/10">
                                <img 
                                    src="/images/landing/mobile.png" 
                                    alt="Kontrol Mobile Experience" 
                                    className="w-full rounded-[2.8rem]"
                                />
                             </div>
                             {/* Background Glow */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary-500/20 blur-3xl -z-10" />
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* --- CORE PERFORMANCE --- */}
            <section className="py-24 bg-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center mb-20">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Engineered for the palm of your hand.
                    </h2>
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
                                className="group text-center p-8 rounded-3xl bg-slate-50 transition-all hover:bg-white hover:shadow-xl ring-1 ring-slate-100"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary-50 text-primary-600 transition-transform group-hover:scale-110">
                                    <prop.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-slate-900">{prop.title}</h3>
                                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-500">
                                    {prop.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- VISUAL INTERACTIVE SECTION --- */}
            <section className="py-24 bg-slate-50 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <div className="lg:order-2">
                             <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                No app store, no friction.
                             </h2>
                             <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed">
                                Kontrol uses PWA (Progressive Web App) technology. This means residents can "Install" Kontrol directly from their browser, receiving push notifications and a dedicated home screen icon—all while staying lightweight and secure.
                             </p>
                             
                             <ul className="mt-12 space-y-6">
                                <li className="flex items-center gap-4">
                                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Instant Updates (No Store Approval)</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Low Storage Requirement</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Cross-Platform (iOS, Android, Desktop)</span>
                                </li>
                             </ul>
                        </div>
                        
                        <div className="lg:order-1 relative">
                            {/* Decorative Mobile Flow Card */}
                            <motion.div 
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="relative z-10 rounded-[2.5rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Notification</h4>
                                        <Zap className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                                            <Smartphone className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900">New Access Code Generated</p>
                                            <p className="text-xs font-medium text-slate-500 mt-1">Guest: John Smith • Code: K-1234</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '100%' }}
                                                transition={{ duration: 1.5 }}
                                                className="h-full bg-primary-600" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-primary-100/50 blur-3xl -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24 bg-primary-900 text-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                        Experience the difference.
                    </h2>
                    <p className="mt-8 text-lg font-medium text-primary-100 max-w-2xl mx-auto leading-relaxed">
                        Join the hundreds of residents who enjoy a seamless, mobile-first lifestyle with Kontrol.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Link
                            href={login().url}
                            className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-lg font-bold text-primary-900 shadow-xl transition-all hover:bg-slate-50"
                        >
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
