import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, ShieldCheck, PieChart, ArrowRight, Lock, Zap, Smartphone } from 'lucide-react';
import SEO from '@/Components/Landing/SEO';
import LandingLayout from '@/Layouts/LandingLayout';
import { login } from '@/routes';
import landing from '@/routes/landing';

export default function Billing() {
    const valueProps = [
        {
            title: 'Direct Settlements',
            description: 'Funds move from residents directly to the estate bank account via Paystack. No middleman.',
            icon: ShieldCheck,
        },
        {
            title: 'Automated Receipts',
            description: 'Instant digital receipts are generated and sent to residents as soon as payment is verified.',
            icon: Zap,
        },
        {
            title: 'Manual Reconciliation',
            description: 'Logged bank transfers or cash payments can be manually reconciled by admins in seconds.',
            icon: Banknote,
        },
        {
            title: 'Real-time Reporting',
            description: 'Comprehensive dashboards for admins to track collection progress and outstanding dues.',
            icon: PieChart,
        },
    ];

    return (
        <LandingLayout isDark={true}>
            <SEO
                title="Transparent Estate Collections & Billing"
                description="Experience a seamless, middleman-free financial ecosystem. Kontrol enables residents to pay estates directly with real-time tracking and automated reconciliation."
            />

            {/* Grid & Ambient Glows Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-[30%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[150px]" />
            </div>

            {/* --- HERO --- */}
            <header className="relative z-10 overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/60 border border-emerald-800/40 px-4 py-1.5 text-xs font-bold tracking-widest text-emerald-400 uppercase shadow-sm">
                                <Lock className="h-3.5 w-3.5" />
                                <span>Zero-Custody Payments</span>
                            </div>
                            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                                Financial <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Transparency</span> for Every Estate.
                            </h1>
                            <p className="mt-8 text-xl leading-relaxed font-medium text-slate-400">
                                Kontrol doesn't hold your money. We build the secure infrastructure that connects residents directly to the estate's
                                bank account.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* --- FLOW DIAGRAM SECTION --- */}
            <section className="relative z-10 overflow-hidden bg-slate-950/40 border-y border-slate-900/60 py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">How the money flows.</h2>
                            <p className="mt-6 text-lg leading-relaxed font-medium text-slate-400">
                                Our integration with Paystack ensures that every Kobo paid by a resident is instantly routed to the configured estate
                                subaccount.
                            </p>

                            <div className="mt-12 space-y-8">
                                <div className="flex gap-4 rounded-2xl bg-slate-900/40 border border-slate-850 p-6 shadow-sm">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">1. Resident Initiates</h4>
                                        <p className="text-sm font-medium text-slate-400">Pay for dues or utilities via the Kontrol app.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 rounded-2xl bg-slate-900/40 border border-slate-850 p-6 shadow-sm">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">2. Secure Processing</h4>
                                        <p className="text-sm font-medium text-slate-400">Encrypted transaction verified via Paystack gateway.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 rounded-2xl bg-slate-900/40 border border-slate-850 p-6 shadow-sm">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">3. Direct Settlement</h4>
                                        <p className="text-sm font-medium text-slate-400">
                                            Funds settle directly into the estate's bank account (T+1).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="overflow-hidden rounded-[3rem] bg-slate-900 p-4 border border-slate-800 shadow-2xl"
                            >
                                <img src="/images/landing/billing-flow.png" alt="Kontrol Billing Flow" className="w-full opacity-80" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- VALUE PROPS --- */}
            <section className="relative z-10 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                        {valueProps.map((prop, idx) => (
                            <motion.div
                                key={prop.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="text-center"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                                    <prop.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-8 text-xl font-bold text-white">{prop.title}</h3>
                                <p className="mt-4 text-sm leading-relaxed font-medium text-slate-400">{prop.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SECURITY MESSAGE --- */}
            <section className="relative z-10 overflow-hidden bg-indigo-950/40 border-y border-indigo-900/30 py-24 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 blur-3xl" />
                    <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-500 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8">
                    <ShieldCheck className="mx-auto mb-8 h-16 text-indigo-400" />
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Bank-Grade Security for Every Transaction.</h2>
                    <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed font-medium text-slate-300">
                        We use industry-standard encryption and follow strict financial protocols to ensure that every collection is auditable,
                        traceable, and secure.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-8">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-indigo-400" />
                            <span className="text-sm font-bold tracking-widest uppercase font-mono">SSL Encrypted</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-indigo-400" />
                            <span className="text-sm font-bold tracking-widest uppercase font-mono">PCI Compliant</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <PieChart className="h-5 w-5 text-indigo-400" />
                            <span className="text-sm font-bold tracking-widest uppercase font-mono">Auditable Logs</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="relative z-10 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-12 rounded-[3rem] bg-slate-900/40 border border-slate-800 p-8 lg:flex-row lg:p-16">
                        <div className="max-w-xl text-center lg:text-left">
                            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                Eliminate collection headaches today.
                            </h2>
                            <p className="mt-4 text-lg font-medium text-slate-400">
                                Start tracking dues with 100% precision and give your residents a frictionless way to contribute.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-4 justify-center">
                            <Link
                                href={login().url}
                                className="flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-10 text-lg font-bold text-white shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95"
                            >
                                Get Started
                            </Link>
                            <Link
                                href={landing.forEstates().url}
                                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-8 text-lg font-bold text-slate-200 hover:bg-slate-850 transition-all"
                            >
                                Learn more for Estates
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
