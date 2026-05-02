import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';
import { 
    BarChart3, 
    Users2, 
    ShieldCheck, 
    FileText,
    Settings,
    ArrowRight,
    Zap,
    LayoutDashboard
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { login } from '@/routes';

export default function ForEstates() {
    const adminFeatures = [
        {
            title: 'Unified Dashboard',
            description: 'Get a bird\'s eye view of your estate—from active security alerts to daily collection progress.',
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
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-bold tracking-widest text-primary-700 uppercase shadow-sm ring-1 ring-primary-200 mb-8">
                                <Zap className="h-3.5 w-3.5" />
                                <span>Enterprise-Grade Management</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                                Run your Estate with <span className="text-primary-600">Precision.</span>
                            </h1>
                            <p className="mt-8 text-xl font-medium text-slate-500 leading-relaxed">
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

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                        >
                             <div className="rounded-[3rem] bg-white p-4 shadow-2xl ring-1 ring-slate-200 overflow-hidden">
                                <img 
                                    src="/images/landing/estates.png" 
                                    alt="Kontrol Admin Dashboard" 
                                    className="w-full"
                                />
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
                                className="group p-8 rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 group-hover:scale-110 transition-transform">
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-slate-900">{feature.title}</h3>
                                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-500">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CASE FOR EFFICIENCY --- */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <div>
                             <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                                Turn chaos into clear, actionable data.
                             </h2>
                             <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed">
                                Manual spreadsheets and physical logs are the biggest bottlenecks in estate operations. Kontrol digitizes every touchpoint—from the gatehouse to the accounting office.
                             </p>
                             
                             <div className="mt-12 grid gap-6">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 text-slate-800">100% Audit trail for all visitor entries.</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                                    <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 text-slate-800">Automated collection tracking & reconciliation.</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                                    <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 text-slate-800">Real-time SOS response monitoring.</span>
                                </div>
                             </div>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-100/50 blur-3xl rounded-full" />
                            <div className="relative rounded-[3rem] bg-slate-900 p-8 shadow-2xl text-white">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <span className="text-sm font-bold uppercase tracking-widest text-primary-400">Monthly Revenue Report</span>
                                        <FileText className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div className="grid gap-6">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Collected</p>
                                                <p className="text-4xl font-extrabold mt-1">₦42.5M</p>
                                            </div>
                                            <span className="text-emerald-400 text-sm font-bold">+12% vs last month</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full w-[85%] bg-primary-500" />
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <span>85% Targets Reached</span>
                                            <span>₦5.2M Outstanding</span>
                                        </div>
                                    </div>
                                    <button className="w-full h-14 rounded-2xl bg-white text-primary-900 font-bold text-lg shadow-xl active:scale-95 transition-transform">
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
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Empower your management team today.
                    </h2>
                    <p className="mt-8 text-lg font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
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
