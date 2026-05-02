import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';
import { 
    CreditCard, 
    Banknote, 
    ShieldCheck, 
    PieChart,
    ArrowRight,
    Lock,
    Zap,
    Download,
    Smartphone
} from 'lucide-react';
import { Link } from '@inertiajs/react';
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
        <LandingLayout>
            <SEO 
                title="Transparent Estate Collections & Billing" 
                description="Experience a seamless, middleman-free financial ecosystem. Kontrol enables residents to pay estates directly with real-time tracking and automated reconciliation."
            />

            {/* --- HERO --- */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold tracking-widest text-emerald-700 uppercase shadow-sm ring-1 ring-emerald-100">
                                <Lock className="h-3.5 w-3.5" />
                                <span>Zero-Custody Payments</span>
                            </div>
                            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                                Financial <span className="text-emerald-600">Transparency</span> for Every Estate.
                            </h1>
                            <p className="mt-8 text-xl font-medium text-slate-500 leading-relaxed">
                                Kontrol doesn't hold your money. We build the secure infrastructure that connects residents directly to the estate's bank account.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* --- FLOW DIAGRAM SECTION --- */}
            <section className="py-20 bg-slate-50 relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                How the money flows.
                            </h2>
                            <p className="mt-6 text-lg font-medium text-slate-500 leading-relaxed">
                                Our integration with Paystack ensures that every Kobo paid by a resident is instantly routed to the configured estate subaccount.
                            </p>
                            
                            <div className="mt-12 space-y-8">
                                <div className="flex gap-4 p-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-primary-700 text-white">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">1. Resident Initiates</h4>
                                        <p className="text-sm font-medium text-slate-500">Pay for dues or utilities via the Kontrol app.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-emerald-600 text-white">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">2. Secure Processing</h4>
                                        <p className="text-sm font-medium text-slate-500">Encrypted transaction verified via Paystack gateway.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-primary-900 text-white">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">3. Direct Settlement</h4>
                                        <p className="text-sm font-medium text-slate-500">Funds settle directly into the estate's bank account (T+1).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-7">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="rounded-[3rem] bg-white p-4 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-200 overflow-hidden"
                            >
                                <img 
                                    src="/images/landing/billing-flow.png" 
                                    alt="Kontrol Billing Flow" 
                                    className="w-full"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- VALUE PROPS --- */}
            <section className="py-24">
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
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-50 text-emerald-600 shadow-inner">
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

            {/* --- SECURITY MESSAGE --- */}
            <section className="py-24 bg-primary-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                     <div className="absolute top-0 left-0 h-96 w-96 bg-primary-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                     <div className="absolute bottom-0 right-0 h-96 w-96 bg-primary-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>
                
                <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 text-center">
                    <ShieldCheck className="mx-auto h-16 w-16 text-emerald-400 mb-8" />
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                        Bank-Grade Security for Every Transaction.
                    </h2>
                    <p className="mt-8 text-xl font-medium text-primary-100 max-w-3xl mx-auto leading-relaxed">
                        We use industry-standard encryption and follow strict financial protocols to ensure that every collection is auditable, traceable, and secure.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-8">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-emerald-400" />
                            <span className="text-sm font-bold tracking-widest uppercase">SSL Encrypted</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-400" />
                            <span className="text-sm font-bold tracking-widest uppercase">PCI Compliant</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <PieChart className="h-5 w-5 text-emerald-400" />
                            <span className="text-sm font-bold tracking-widest uppercase">Auditable Logs</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="rounded-[3rem] bg-slate-50 p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 ring-1 ring-slate-200">
                        <div className="max-w-xl">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                Eliminate collection headaches today.
                            </h2>
                            <p className="mt-4 text-lg font-medium text-slate-500">
                                Start tracking dues with 100% precision and give your residents a frictionless way to contribute.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4 shrink-0">
                            <Link
                                href={login().url}
                                className="flex h-14 items-center justify-center rounded-2xl bg-primary-700 px-10 text-lg font-bold text-white shadow-xl shadow-primary-700/20 transition-all hover:bg-primary-800"
                            >
                                Get Started
                            </Link>
                            <Link
                                href={landing.forEstates().url}
                                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-lg font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
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

