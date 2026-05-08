import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';
import { ShieldAlert, Bell, Users, PhoneCall, MapPin, Zap, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { login } from '@/routes';

export default function Security() {
    const securityFeatures = [
        {
            title: 'Instant SOS Trigger',
            description: 'Residents can trigger a silent or audible alarm from their smartphone, instantly notifying guards.',
            icon: ShieldAlert,
            color: 'bg-rose-100 text-rose-600',
        },
        {
            title: 'Digital Guard Post',
            description: "Guards receive alerts on their command dashboard with the resident's exact location and profile.",
            icon: Bell,
            color: 'bg-primary-100 text-primary-600',
        },
        {
            title: 'Emergency Contacts',
            description: 'Automatically notify up to three pre-registered emergency contacts when an SOS is triggered.',
            icon: Users,
            color: 'bg-amber-100 text-amber-600',
        },
        {
            title: 'Direct guard Calls',
            description: 'Establish an immediate voice connection between the resident and the main gatehouse.',
            icon: PhoneCall,
            color: 'bg-emerald-100 text-emerald-600',
        },
    ];

    return (
        <LandingLayout isDark={true}>
            <SEO
                title="Advanced Estate Security & SOS System"
                description="Your safety is our priority. Kontrol provides a high-reliability SOS system that connects residents to estate security instantly during emergencies."
            />

            {/* --- HERO --- */}
            <header className="relative overflow-hidden bg-[#050A18] pt-32 pb-20 text-center lg:pt-48 lg:pb-32">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-1/2 h-full w-full -translate-x-1/2 bg-gradient-to-b from-primary-600/20 to-transparent blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-xs font-bold tracking-widest text-rose-400 uppercase shadow-sm ring-1 ring-rose-500/20">
                            <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                            <span>Mission Critical Security</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Safety <span className="text-primary-400">Without</span> Compromise.
                        </h1>
                        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed font-medium text-slate-400">
                            We've engineered the most reliable SOS and emergency response system for residential estates, because seconds matter in a
                            crisis.
                        </p>
                        <div className="mt-12 flex flex-wrap justify-center gap-4">
                            <Link
                                href={login().url}
                                className="flex h-14 items-center justify-center rounded-2xl bg-primary-600 px-10 text-lg font-bold text-white shadow-xl shadow-primary-600/20 transition-all hover:bg-primary-500"
                            >
                                Secure My Estate
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* --- COMMAND CENTER VISUAL --- */}
            <section className="relative z-20 -mt-20 py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="overflow-hidden rounded-[3rem] bg-[#0B1221] p-4 shadow-2xl ring-1 shadow-primary-900/40 ring-white/10"
                    >
                        <img
                            src="/images/landing/security.png"
                            alt="Kontrol Security Command Center"
                            className="w-full opacity-90 transition-opacity hover:opacity-100"
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto mb-20 max-w-2xl text-center">
                        <h2 className="text-xs font-bold tracking-[0.2em] text-primary-600 uppercase">Reliability at the Core</h2>
                        <p className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">How Kontrol protects you.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {securityFeatures.map((feature, idx) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-100 transition-all hover:-translate-y-2 hover:bg-white hover:shadow-xl"
                            >
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} shadow-sm transition-transform group-hover:scale-110`}
                                >
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-slate-900">{feature.title}</h3>
                                <p className="mt-4 text-sm leading-relaxed font-medium text-slate-500">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- REAL-LIFE CASE --- */}
            <section className="overflow-hidden bg-slate-50 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary-600/10 blur-3xl" />
                            <div className="relative rounded-[2.5rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-rose-500">
                                                <ShieldAlert className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">Active SOS</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">02:45 PM</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                                <MapPin className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Trigger Location</p>
                                                <p className="text-sm font-extrabold text-slate-900">Unit 248, Block C</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                                <ShieldCheck className="h-6 w-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Guard</p>
                                                <p className="text-sm font-extrabold text-slate-900">Officer John Doe</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="h-12 w-full rounded-xl bg-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-transform active:scale-95">
                                        View Live Stream
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                Real-time response, real-world impact.
                            </h2>
                            <p className="mt-8 text-lg leading-relaxed font-medium text-slate-500">
                                Our security system isn't just about logs—it's about active protection. From the moment an alert is triggered, guards
                                have visual and geographic data to reach the resident faster.
                            </p>
                            <div className="mt-10 grid gap-6">
                                <div className="flex gap-4">
                                    <Zap className="h-6 w-6 shrink-0 text-primary-600" />
                                    <p className="text-sm font-bold text-slate-700">Sub-1 second alert delivery to all guard terminals.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Lock className="h-6 w-6 shrink-0 text-primary-600" />
                                    <p className="text-sm font-bold text-slate-700">Encrypted logs for post-incident review.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Smartphone className="h-6 w-6 shrink-0 text-primary-600" />
                                    <p className="text-sm font-bold text-slate-700">Automatic location tracking for accurate guard dispatch.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="bg-primary-900 py-24 text-white">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Because every second counts.</h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-primary-100">
                        Don't wait for an incident to occur. Secure your estate with the industry's most advanced SOS system.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Link
                            href={login().url}
                            className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-lg font-bold text-primary-900 shadow-xl transition-all hover:bg-slate-50"
                        >
                            Get Kontrol Now
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
