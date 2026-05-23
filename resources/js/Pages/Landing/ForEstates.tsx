import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { BarChart3, Users2, ShieldCheck, FileText, Settings, ArrowRight, Zap, LayoutDashboard } from 'lucide-react';
import SEO from '@/Components/Landing/SEO';
import LandingLayout from '@/Layouts/LandingLayout';
import { login } from '@/routes';

export default function ForEstates() {
    const adminFeatures = [
        {
            title: 'Unified Dashboard',
            description: "Get a bird's eye view of your estate—from active security alerts to daily collection progress.",
            icon: LayoutDashboard,
        },
        {
            title: 'Resident Database',
            description: 'Maintain an accurate, searchable record of every household, resident, and staff member.',
            icon: Users2,
        },
        {
            title: 'Automated Reports',
            description: 'Generate high-resolution financial and security reports for board meetings in one click.',
            icon: BarChart3,
        },
        {
            title: 'Role-Based Access',
            description: 'Assign specific permissions for security teams, estate managers, and facility accountants.',
            icon: Settings,
        },
    ];

    return (
        <LandingLayout>
            <SEO
                title="Operational Efficiency for Estate Admins"
                description="Empower your estate management team with Kontrol's robust administrative tools. Track collections, manage residents, and oversee security operations from a single dashboard."
            />

            {/* --- HERO --- */}
            <header className="relative overflow-hidden bg-slate-50 pt-32 pb-20 lg:pt-48 lg:pb-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-bold tracking-widest text-primary-700 uppercase shadow-sm ring-1 ring-primary-200">
                                <Zap className="h-3.5 w-3.5" />
                                <span>Enterprise-Grade Management</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                                Run your Estate with <span className="text-primary-600">Precision.</span>
                            </h1>
                            <p className="mt-8 text-xl leading-relaxed font-medium text-slate-500">
                                Kontrol provides estate managers with the data, tools, and automation needed to operate efficiently and transparently.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <Link
                                    href={login().url}
                                    className="flex h-14 items-center justify-center rounded-2xl bg-primary-700 px-10 text-lg font-bold text-white shadow-xl shadow-primary-700/20 transition-all hover:bg-primary-800"
                                >
                                    Try the Admin Demo
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                            <div className="overflow-hidden rounded-[3rem] bg-white shadow-2xl ring-1 ring-slate-200">
                                <img src="/images/landing/estates.png" alt="Kontrol Admin Dashboard" className="w-full" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* --- ADMIN FEATURES --- */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                        {adminFeatures.map((feature, idx) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-2 hover:shadow-xl"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-transform group-hover:scale-110">
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-slate-900">{feature.title}</h3>
                                <p className="mt-4 text-sm leading-relaxed font-medium text-slate-500">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CASE FOR EFFICIENCY --- */}
            <section className="overflow-hidden bg-white py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                                Turn chaos into clear, actionable data.
                            </h2>
                            <p className="mt-8 text-lg leading-relaxed font-medium text-slate-500">
                                Manual spreadsheets and physical logs are the biggest bottlenecks in estate operations. Kontrol digitizes every
                                touchpoint—from the gatehouse to the accounting office.
                            </p>

                            <div className="mt-12 grid gap-6">
                                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 text-slate-800">100% Audit trail for all visitor entries.</span>
                                </div>
                                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 text-slate-800">
                                        Automated collection tracking & reconciliation.
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 text-slate-800">Real-time SOS response monitoring.</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary-100/50 blur-3xl" />
                            <div className="relative rounded-[3rem] bg-slate-900 p-8 text-white shadow-2xl">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <span className="text-sm font-bold tracking-widest text-primary-400 uppercase">Monthly Revenue Report</span>
                                        <FileText className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div className="grid gap-6">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total Collected</p>
                                                <p className="mt-1 text-4xl font-extrabold">₦42.5M</p>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-400">+12% vs last month</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                                            <div className="h-full w-[85%] bg-primary-500" />
                                        </div>
                                        <div className="flex justify-between text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            <span>85% Targets Reached</span>
                                            <span>₦5.2M Outstanding</span>
                                        </div>
                                    </div>
                                    <button className="h-14 w-full rounded-2xl bg-white text-lg font-bold text-primary-900 shadow-xl transition-transform active:scale-95">
                                        Download Detailed Audit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Empower your management team today.</h2>
                    <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed font-medium text-slate-500">
                        Join the elite estates that use Kontrol to provide a premium living experience for their residents.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Link
                            href={login().url}
                            className="flex h-14 items-center justify-center rounded-2xl bg-primary-700 px-10 text-lg font-bold text-white shadow-xl shadow-primary-700/20 transition-all hover:bg-primary-800"
                        >
                            Get Started
                        </Link>
                        <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-lg font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50">
                            Book a Live Demo
                        </button>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
