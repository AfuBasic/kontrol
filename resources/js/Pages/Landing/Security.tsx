import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldAlert, Bell, Users, PhoneCall, MapPin, Zap, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import SEO from '@/Components/Landing/SEO';
import LandingLayout from '@/Layouts/LandingLayout';
import { login } from '@/routes';

export default function Security() {
    const securityFeatures = [
        {
            title: 'Instant SOS Trigger',
            description: 'Residents can trigger a silent or audible alarm from their smartphone, instantly notifying guards.',
            icon: ShieldAlert,
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        },
        {
            title: 'Digital Guard Post',
            description: "Guards receive alerts on their command dashboard with the resident's exact location and profile.",
            icon: Bell,
            color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        },
        {
            title: 'Emergency Contacts',
            description: 'Automatically notify up to three pre-registered emergency contacts when an SOS is triggered.',
            icon: Users,
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        },
        {
            title: 'Direct Guard Calls',
            description: 'Establish an immediate voice connection between the resident and the main gatehouse.',
            icon: PhoneCall,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
    ];

    return (
        <LandingLayout isDark={true}>
            <SEO
                title="Advanced Estate Security & SOS System"
                description="Your safety is our priority. Kontrol provides a high-reliability SOS system that connects residents to estate security instantly during emergencies."
            />

            {/* Grid & Ambient Glows Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-rose-500/10 blur-[150px]" />
            </div>

            {/* --- HERO --- */}
            <header className="relative z-10 overflow-hidden pt-32 pb-20 text-center lg:pt-48 lg:pb-32">
                <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-xs font-bold tracking-widest text-rose-400 uppercase shadow-sm ring-1 ring-rose-500/20">
                            <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                            <span>Mission Critical Security</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Safety <span className="bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent">Without</span> Compromise.
                        </h1>
                        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed font-medium text-slate-400">
                            We've engineered the most reliable SOS and emergency response system for residential estates, because seconds matter in a
                            crisis.
                        </p>
                        <div className="mt-12 flex flex-wrap justify-center gap-4">
                            <Link
                                href={login().url}
                                className="flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-10 text-lg font-bold text-white shadow-xl hover:bg-indigo-500 shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
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
                        className="overflow-hidden rounded-[3rem] bg-slate-900 border border-slate-800 p-4 shadow-2xl"
                    >
                        <img
                            src="/images/landing/security.png"
                            alt="Kontrol Security Command Center"
                            className="w-full opacity-80 transition-opacity hover:opacity-100 rounded-2xl"
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="relative z-10 bg-slate-950/40 border-t border-slate-900 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto mb-20 max-w-2xl text-center">
                        <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase font-mono block mb-4">Reliability at the Core</span>
                        <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">How Kontrol protects you.</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {securityFeatures.map((feature, idx) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative rounded-3xl bg-slate-900/40 border border-slate-850 p-8 transition-all hover:-translate-y-1.5 hover:border-slate-800"
                            >
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${feature.color} shadow-sm transition-transform group-hover:scale-110`}
                                >
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-white">{feature.title}</h3>
                                <p className="mt-4 text-sm leading-relaxed font-medium text-slate-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- REAL-LIFE CASE --- */}
            <section className="relative z-10 overflow-hidden bg-slate-950/20 border-t border-slate-900 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-3xl" />
                            <div className="relative rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 text-white shadow-2xl">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-rose-550">
                                                <ShieldAlert className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">Active SOS</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">02:45 PM</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-850 shrink-0">
                                                <MapPin className="h-6 w-6 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Trigger Location</p>
                                                <p className="text-sm font-extrabold text-white">Unit 248, Block C</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-850 shrink-0">
                                                <ShieldCheck className="h-6 w-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Assigned Guard</p>
                                                <p className="text-sm font-extrabold text-white">Officer John Doe</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg hover:bg-indigo-500 shadow-indigo-600/20 transition-transform active:scale-95">
                                        View Live Stream
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                                Real-time response, real-world impact.
                            </h2>
                            <p className="mt-8 text-lg leading-relaxed font-medium text-slate-400">
                                Our security system isn't just about logs—it's about active protection. From the moment an alert is triggered, guards
                                have visual and geographic data to reach the resident faster.
                            </p>
                            <div className="mt-10 grid gap-6">
                                <div className="flex gap-4">
                                    <Zap className="h-6 w-6 shrink-0 text-indigo-400" />
                                    <p className="text-sm font-bold text-slate-350">Sub-1 second alert delivery to all guard terminals.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Lock className="h-6 w-6 shrink-0 text-indigo-400" />
                                    <p className="text-sm font-bold text-slate-350">Encrypted logs for post-incident review.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Smartphone className="h-6 w-6 shrink-0 text-indigo-400" />
                                    <p className="text-sm font-bold text-slate-350">Automatic location tracking for accurate guard dispatch.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="relative z-10 bg-indigo-950/20 border-t border-slate-900 py-24 text-white">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Because every second counts.</h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-slate-400">
                        Don't wait for an incident to occur. Secure your estate with the industry's most advanced SOS system.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Link
                            href={login().url}
                            className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-lg font-bold text-slate-950 shadow-xl transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
                        >
                            Get Kontrol Now
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
