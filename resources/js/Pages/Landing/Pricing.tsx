import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check, Zap, ShieldCheck, Users, ChevronDown, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import SEO from '@/Components/Landing/SEO';
import LandingLayout from '@/Layouts/LandingLayout';
import { login } from '@/routes';

interface Plan {
    id: number;
    name: string;
    price: number;
    formatted_price: string;
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    is_featured: boolean;
    badge: string | null;
    description: string | null;
}

interface Props {
    plans: Plan[];
}

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-800 py-6">
            <button onClick={() => setIsOpen(!isOpen)} className="group flex w-full items-center justify-between text-left">
                <span className="text-lg font-bold text-slate-200 transition-colors group-hover:text-indigo-400">{question}</span>
                <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
                <p className="mt-4 leading-relaxed font-medium text-slate-400">{answer}</p>
            </motion.div>
        </div>
    );
};

export default function Pricing({ plans }: Props) {
    const faqs = [
        {
            question: 'How long does setup take?',
            answer: 'Most estates are up and running in less than 48 hours. Our onboarding team assists you with resident data upload and security guard training.',
        },
        {
            question: 'Can residents pay in installments?',
            answer: 'Kontrol allows admins to configure collection targets with specific deadlines. While the system tracks total progress, payment flexibility is decided by the estate board.',
        },
        {
            question: 'Is my data secure?',
            answer: 'Yes. We use bank-grade encryption and follow strict financial and privacy protocols. We are PCI-compliant for all payment processing through Paystack.',
        },
        {
            question: 'Do you offer custom plans for large estates?',
            answer: 'Absolutely. For estates with over 1,000 residents or specific hardware integration needs, we offer Enterprise plans with dedicated support.',
        },
    ];

    return (
        <LandingLayout isDark={true}>
            <SEO
                title="Simple, Transparent Pricing"
                description="Choose the perfect plan for your estate. From basic visitor management to full-scale financial operations and security command centers."
            />

            {/* Grid & Ambient Glows Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[#020617]" />
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[150px]" />
            </div>

            {/* --- HEADER --- */}
            <header className="relative z-10 overflow-hidden pt-32 pb-20 text-center lg:pt-48 lg:pb-32">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase font-mono block mb-4">Pricing Architecture</span>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                            Plans that scale with your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Estate.</span>
                        </h1>
                        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed font-medium text-slate-400">
                            Transparent pricing with no hidden fees. All annual plans include free onboarding and security guard training.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* --- PRICING GRID --- */}
            <section className="relative z-10 -mt-12 pb-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative flex flex-col rounded-[3rem] p-8 border transition-all hover:shadow-2xl ${
                                    plan.is_featured
                                        ? 'z-10 bg-indigo-950/40 border-indigo-500/40 text-white shadow-xl shadow-indigo-500/5 lg:scale-105'
                                        : 'bg-slate-900/40 border-slate-800/80 text-slate-200'
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3
                                        className={`text-xl font-bold tracking-widest uppercase ${plan.is_featured ? 'text-indigo-400' : 'text-slate-400'}`}
                                    >
                                        {plan.name}
                                    </h3>
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="text-5xl font-extrabold tracking-tight font-mono">{plan.formatted_price}</span>
                                        <span className={`text-sm font-bold uppercase ${plan.is_featured ? 'text-indigo-300' : 'text-slate-500'}`}>
                                            / resident / year
                                        </span>
                                    </div>
                                    <p
                                        className={`mt-6 text-sm leading-relaxed font-medium ${plan.is_featured ? 'text-slate-300' : 'text-slate-400'}`}
                                    >
                                        {plan.description || `Optimized for estates with up to ${plan.max_residents || 'unlimited'} residents.`}
                                    </p>
                                </div>

                                <ul className="mb-10 flex-1 space-y-4">
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-indigo-400' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">{plan.max_residents || 'Unlimited'} Residents</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-indigo-400' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">{plan.max_security || 'Unlimited'} Security Guards</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-indigo-400' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">{plan.max_admins || 'Unlimited'} Admin Seats</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-indigo-400' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">Visitor Access Codes</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-indigo-400' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">SOS Emergency System</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-indigo-400' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium">Financial Collections</span>
                                    </li>
                                </ul>

                                <Link
                                    href={login().url}
                                    className={`flex h-14 items-center justify-center rounded-2xl text-lg font-bold transition-all active:scale-95 ${
                                        plan.is_featured
                                            ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 shadow-indigo-600/20'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700/60 hover:bg-slate-700'
                                    }`}
                                >
                                    Select Plan
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ --- */}
            <section className="relative z-10 bg-slate-950/40 border-t border-slate-900 py-24">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase font-mono block mb-4">FAQ</span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <FaqItem key={faq.question} {...faq} />
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="relative z-10 py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-12 rounded-[3rem] bg-indigo-950/20 border border-indigo-900/30 p-8 text-white lg:flex-row lg:p-16">
                        <div className="max-w-xl text-center lg:text-left">
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Still have questions?</h2>
                            <p className="mt-4 text-lg leading-relaxed font-medium text-slate-400">
                                Our estate consultants are ready to walk you through a personalized demo tailored to your estate's needs.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-4 justify-center">
                            <button className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-lg font-bold text-slate-950 shadow-xl transition-all hover:bg-slate-100">
                                Contact Sales
                            </button>
                            <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 text-lg font-bold text-white shadow-sm transition-all hover:bg-indigo-500 shadow-lg shadow-indigo-600/20">
                                Request a Demo
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
