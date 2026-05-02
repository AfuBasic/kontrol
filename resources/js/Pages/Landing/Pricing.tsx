import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';
import { 
    Check, 
    X, 
    Zap, 
    ShieldCheck, 
    Users,
    ChevronDown,
    ArrowRight
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { login } from '@/routes';
import { useState } from 'react';

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

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="border-b border-slate-200 py-6">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between text-left group"
            >
                <span className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{question}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden"
            >
                <p className="mt-4 text-slate-500 font-medium leading-relaxed">{answer}</p>
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
        <LandingLayout>
            <SEO 
                title="Simple, Transparent Pricing" 
                description="Choose the perfect plan for your estate. From basic visitor management to full-scale financial operations and security command centers."
            />

            {/* --- HEADER --- */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden text-center">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                            Plans that scale with your <span className="text-primary-600">Estate.</span>
                        </h1>
                        <p className="mt-8 text-xl font-medium text-slate-500 leading-relaxed max-w-2xl mx-auto">
                            Transparent pricing with no hidden fees. All annual plans include free onboarding and security guard training.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* --- PRICING GRID --- */}
            <section className="pb-24 -mt-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative flex flex-col rounded-[3rem] p-8 ring-1 transition-all hover:shadow-2xl ${
                                    plan.is_featured 
                                        ? 'bg-primary-900 text-white ring-primary-700 shadow-xl lg:scale-105 z-10' 
                                        : 'bg-white text-slate-900 ring-slate-200'
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase">
                                        {plan.badge}
                                    </div>
                                )}
                                
                                <div className="mb-8">
                                    <h3 className={`text-xl font-bold uppercase tracking-widest ${plan.is_featured ? 'text-primary-400' : 'text-primary-600'}`}>
                                        {plan.name}
                                    </h3>
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="text-5xl font-extrabold tracking-tight">{plan.formatted_price}</span>
                                        <span className={`text-sm font-bold uppercase ${plan.is_featured ? 'text-primary-300' : 'text-slate-400'}`}>/ year</span>
                                    </div>
                                    <p className={`mt-6 text-sm font-medium leading-relaxed ${plan.is_featured ? 'text-primary-100' : 'text-slate-500'}`}>
                                        {plan.description || `Optimized for estates with up to ${plan.max_residents || 'unlimited'} residents.`}
                                    </p>
                                </div>

                                <ul className="mb-10 space-y-4 flex-1">
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                        <span className="text-sm font-bold">{plan.max_residents || 'Unlimited'} Residents</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                        <span className="text-sm font-bold">{plan.max_security || 'Unlimited'} Security Guards</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                        <span className="text-sm font-bold">{plan.max_admins || 'Unlimited'} Admin Seats</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                        <span className="text-sm font-bold">Visitor Access Codes</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                        <span className="text-sm font-bold">SOS Emergency System</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className={`h-5 w-5 ${plan.is_featured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                        <span className="text-sm font-bold">Financial Collections</span>
                                    </li>
                                </ul>

                                <Link
                                    href={login().url}
                                    className={`flex h-14 items-center justify-center rounded-2xl text-lg font-bold transition-all active:scale-95 ${
                                        plan.is_featured
                                            ? 'bg-white text-primary-900 shadow-xl hover:bg-slate-50'
                                            : 'bg-primary-700 text-white shadow-lg shadow-primary-700/20 hover:bg-primary-800'
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
            <section className="py-24 bg-slate-50">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Frequently Asked Questions
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <FaqItem key={faq.question} {...faq} />
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="rounded-[3rem] bg-emerald-600 p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 text-white">
                        <div className="max-w-xl">
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Still have questions?
                            </h2>
                            <p className="mt-4 text-lg font-medium text-emerald-50 leading-relaxed">
                                Our estate consultants are ready to walk you through a personalized demo tailored to your estate's needs.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4 shrink-0">
                            <button className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-lg font-bold text-emerald-600 shadow-xl transition-all hover:bg-emerald-50">
                                Contact Sales
                            </button>
                            <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-8 text-lg font-bold text-white shadow-sm transition-all hover:bg-emerald-800">
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
