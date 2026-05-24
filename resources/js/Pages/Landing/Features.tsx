import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, Zap, CreditCard, Shield, Home as HomeIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import SEO from '@/Components/Landing/SEO';
import LandingLayout from '@/Layouts/LandingLayout';
import { login } from '@/routes';
import landing from '@/routes/landing';

const FeatureDetail = ({ title, description, icon: Icon, color, reversed = false }: any) => (
    <section className="relative z-10 overflow-hidden py-20 border-b border-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className={`grid gap-16 lg:grid-cols-2 lg:items-center ${reversed ? 'lg:direction-rtl' : ''}`}>
                <motion.div
                    initial={{ opacity: 0, x: reversed ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={reversed ? 'lg:order-2' : ''}
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg">
                        <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
                    <p className="mt-6 text-lg leading-relaxed font-medium text-slate-400">{description}</p>
                    <ul className="mt-10 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                                <span className="text-sm font-bold text-slate-300">Premium feature capability {i}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className={`relative ${reversed ? 'lg:order-1' : ''}`}
                >
                    <div className="aspect-[4/3] overflow-hidden rounded-[3rem] bg-slate-900/60 border border-slate-800 shadow-2xl">
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-12">
                            <Icon className="h-24 w-24 text-indigo-400/80" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </section>
);

export default function Features() {
    return (
        <LandingLayout isDark={true}>
            <SEO
                title="Powerful Features for Modern Estates"
                description="Explore Kontrol's robust suite of tools: from visitor access codes and SOS emergency alerts to automated collection tracking and household management."
            />

            {/* Grid & Ambient Glows Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[150px]" />
            </div>

            {/* --- HEADER --- */}
            <header className="relative z-10 overflow-hidden pt-32 pb-20 text-center lg:pt-48 lg:pb-32">
                <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase font-mono block mb-4">Core Infrastructure</span>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                            The Complete <span className="bg-gradient-to-r from-indigo-400 to-orange-400 bg-clip-text text-transparent">Toolkit</span> for Estate Operations.
                        </h1>
                        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed font-medium text-slate-400">
                            We've built a multi-layered ecosystem that solves the most complex challenges of residential living.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* --- VISUAL HIGHLIGHT --- */}
            <section className="relative z-10 -mt-12 py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden rounded-[3rem] bg-slate-950/60 border border-slate-900 shadow-2xl"
                    >
                        <img src="/images/landing/features.png" alt="Kontrol Platform Features" className="w-full object-cover opacity-80" />
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURE SECTIONS --- */}
            <FeatureDetail
                title="Visitor Access Codes"
                description="Secure your estate with expiring, one-time-use digital keys. Residents generate codes for guests, and security validates them at the gatehouse with a simple scan."
                icon={Lock}
                color="bg-slate-900 text-indigo-400"
            />

            <FeatureDetail
                title="SOS Emergency System"
                description="Safety is just a tap away. Our SOS system instantly alerts estate security and designated emergency contacts with real-time location data when triggered by a resident."
                icon={Zap}
                color="bg-slate-900 text-rose-400"
                reversed
            />

            <FeatureDetail
                title="Collections & Billing"
                description="Automate the heavy lifting of estate financial operations. Track dues, manage recurring bills, and provide residents with instant digital receipts—all synchronized with the estate bank account."
                icon={CreditCard}
                color="bg-slate-900 text-emerald-400"
            />

            <FeatureDetail
                title="Household Management"
                description="Organize everything related to your home in one place. Manage family members, register vehicles for gatehouse clearance, and authorize domestic staff access."
                icon={HomeIcon}
                color="bg-slate-900 text-amber-400"
                reversed
            />

            <FeatureDetail
                title="Security Dashboard"
                description="Empower your security personnel with a real-time command center. Validate visitors, monitor estate activity logs, and respond to SOS alerts from a unified mobile-first interface."
                icon={Shield}
                color="bg-slate-900 text-white"
            />

            {/* --- FINAL CTA --- */}
            <section className="relative z-10 bg-slate-950/40 border-t border-slate-900 py-24">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Everything you need, nothing you don't.</h2>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Link
                            href={login().url}
                            className="flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-10 text-lg font-bold text-white shadow-xl hover:bg-indigo-500 shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                        >
                            Get Started
                        </Link>
                        <Link
                            href={landing.mobile().url}
                            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 px-8 text-lg font-bold hover:bg-slate-800 transition-all"
                        >
                            See Mobile Experience
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
