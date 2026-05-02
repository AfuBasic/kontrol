import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, CreditCard, Zap, ArrowRight, Smartphone, Lock, BarChart3 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { login } from '@/routes';
import landing from '@/routes/landing';

export default function Home() {
    const features = [
        {
            title: 'Visitor Access Control',
            description: 'Generate secure, single-use access codes for visitors with real-time entry logs.',
            icon: Lock,
            color: 'bg-primary-50 text-primary-600',
        },
        {
            title: 'SOS Emergency Alerts',
            description: 'One-tap emergency response that notifies estate security and emergency contacts instantly.',
            icon: Zap,
            color: 'bg-rose-50 text-rose-600',
        },
        {
            title: 'Financial Transparency',
            description: 'Track estate dues, utility payments, and collections with automated receipt generation.',
            icon: CreditCard,
            color: 'bg-emerald-50 text-emerald-600',
        },
        {
            title: 'Resident Management',
            description: 'A centralized dashboard to manage households, vehicle permits, and staff approvals.',
            icon: UserCheck,
            color: 'bg-amber-50 text-amber-600',
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'Register Estate',
            description: 'Set up your estate profile and define security protocols in minutes.',
        },
        {
            number: '02',
            title: 'Onboard Residents',
            description: 'Invite residents to join through secure, expiring invitation links.',
        },
        {
            number: '03',
            title: 'Operate Securely',
            description: 'Start managing access, payments, and security through a unified dashboard.',
        },
    ];

    return (
        <LandingLayout>
            <SEO
                title="Smarter Estate Management & Security"
                description="Kontrol is a premium residential ecosystem designed for modern estate operations, visitor access control, and financial transparency."
            />

            {/* --- HERO SECTION --- */}
            <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
                {/* Background Blobs */}
                <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl" />
                <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-emerald-100/30 blur-3xl" />

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold tracking-widest text-primary-700 uppercase shadow-sm ring-1 ring-primary-100">
                                <Zap className="h-3.5 w-3.5" />
                                <span>The Future of Estate Living</span>
                            </div>
                            <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                                Complete <span className="text-primary-600">Kontrol</span> of your Estate.
                            </h1>
                            <p className="mt-8 max-w-xl text-lg leading-relaxed font-medium text-slate-500 sm:text-xl">
                                A premium ecosystem for residents, admins, and security. Manage visitor access, automate collections, and ensure
                                safety—all in one place.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <Link
                                    href={login().url}
                                    className="flex h-14 items-center justify-center rounded-2xl bg-primary-700 px-10 text-lg font-bold text-white shadow-2xl shadow-primary-700/30 transition-all hover:scale-105 hover:bg-primary-800 active:scale-95"
                                >
                                    Get Started
                                </Link>
                                <Link
                                    href={landing.features().url}
                                    className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-lg font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                                >
                                    Explore Features
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            </div>

                            {/* Trust Badge */}
                            <div className="mt-12 flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 ring-1 ring-slate-200" />
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Zap key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Trusted by 50+ Estates</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative z-10 overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-slate-200">
                                <img src="/images/landing/hero.png" alt="Kontrol Estate Management" className="w-full object-cover" />
                                {/* Floating Overlay Cards */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute top-12 -left-8 hidden items-center gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-100 sm:flex"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Security Status</p>
                                        <p className="text-sm font-extrabold text-slate-900">Fully Secured</p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Background decoration */}
                            <div className="absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full bg-primary-100/50 blur-3xl" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- CORE FEATURES GRID --- */}
            <section className="bg-slate-50 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-xs font-bold tracking-[0.2em] text-primary-600 uppercase">Engineered for Excellence</h2>
                        <p className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Everything you need to run a modern estate.
                        </p>
                    </div>

                    <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-2 hover:shadow-xl"
                            >
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition-transform group-hover:scale-110`}
                                >
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="mt-6 text-xl font-bold text-slate-900">{feature.title}</h3>
                                <p className="mt-4 text-sm leading-relaxed font-medium text-slate-500">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="overflow-hidden py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                                Simple onboarding, powerful results.
                            </h2>
                            <p className="mt-6 text-lg font-medium text-slate-500">
                                We designed Kontrol to be as intuitive as a consumer app, but as robust as enterprise software.
                            </p>

                            <div className="mt-12 space-y-10">
                                {steps.map((step) => (
                                    <div key={step.number} className="flex gap-6">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-sm font-bold text-white shadow-lg shadow-primary-700/20">
                                            {step.number}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900">{step.title}</h4>
                                            <p className="mt-2 text-sm leading-relaxed font-medium text-slate-500">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative lg:w-1/2">
                            {/* Decorative Mobile UI representation */}
                            <div className="group relative aspect-[4/5] overflow-hidden rounded-[3rem] bg-slate-900 p-3 shadow-2xl shadow-primary-900/40">
                                <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-slate-800">
                                    {/* Mockup Content */}
                                    <div className="absolute inset-x-0 top-0 flex h-12 items-center justify-between bg-slate-800 px-8">
                                        <div className="h-2 w-12 rounded-full bg-slate-700" />
                                        <div className="flex gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-slate-700" />
                                            <div className="h-2 w-2 rounded-full bg-slate-700" />
                                        </div>
                                    </div>
                                    <div className="mt-12 p-8">
                                        <div className="mb-8 h-8 w-32 rounded-xl bg-slate-700" />
                                        <div className="space-y-4">
                                            <div className="h-24 w-full rounded-2xl border border-primary-500/30 bg-primary-600/20" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="h-32 w-full rounded-2xl bg-slate-700" />
                                                <div className="h-32 w-full rounded-2xl bg-slate-700" />
                                            </div>
                                            <div className="h-24 w-full rounded-2xl bg-slate-700" />
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Badge */}
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -right-4 -bottom-4 rounded-3xl bg-emerald-500 p-6 text-white shadow-2xl"
                                >
                                    <Smartphone className="h-8 w-8" />
                                </motion.div>
                            </div>

                            <div className="absolute -top-12 -right-12 -z-10 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA BANNER --- */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-[3rem] bg-primary-900 px-8 py-20 text-center shadow-2xl sm:px-16">
                        {/* Background Elements */}
                        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-800/50 blur-3xl" />
                        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary-800/50 blur-3xl" />

                        <div className="relative z-10 mx-auto max-w-3xl">
                            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                                Ready to modernize your estate operations?
                            </h2>
                            <p className="mt-6 text-lg leading-relaxed font-medium text-primary-100">
                                Join dozens of forward-thinking estates and start managing your residential ecosystem with precision.
                            </p>
                            <div className="mt-12 flex flex-wrap justify-center gap-4">
                                <Link
                                    href={login().url}
                                    className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-lg font-bold text-primary-900 shadow-xl transition-all hover:scale-105 hover:bg-slate-50 active:scale-95"
                                >
                                    Get Started Today
                                </Link>
                                <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary-800 px-8 text-lg font-bold text-white shadow-sm transition-all hover:bg-primary-700">
                                    Request a Demo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
