import { Head, usePage, useForm, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Mail,
    CheckCircle2,
    Clock,
    ArrowRight,
    ShieldCheck,
    Headphones,
    Settings,
    HelpCircle,
    Send,
    Building,
    MapPin,
    User,
    Plus,
    Minus,
} from 'lucide-react';
import { type FormEventHandler, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
    {
        question: 'How long does onboarding take?',
        answer: 'Most estates complete onboarding within 48 hours. Our dedicated team will guide you through data import, setting up roles, and training your security personnel.',
    },
    {
        question: 'How does the free trial work?',
        answer: "You get full access to Kontrol's premium features for 14 days. No credit card is required to start. We want you to experience the value before making a commitment.",
    },
    {
        question: 'Can residents use Kontrol immediately?',
        answer: "Yes! Once you add a resident's details, they receive an email invitation to download the app and instantly access their estate profile.",
    },
    {
        question: 'Do I need special hardware?',
        answer: 'No specialized hardware is required. Security teams can use standard Android or iOS smartphones to scan codes, log visitors, and communicate with residents.',
    },
    {
        question: 'Can we migrate from our current process?',
        answer: 'Absolutely. Our onboarding team can help import your existing resident directory, payment records, and visitor logs securely into Kontrol.',
    },
    {
        question: 'How does visitor management work?',
        answer: 'Residents generate access codes via their app and share them with guests. Security simply enters or scans the code at the gate to verify and grant access instantly.',
    },
    {
        question: 'Can security teams use Kontrol?',
        answer: 'Yes, we have a dedicated Security Module designed for fast, seamless operations at the gate without requiring complex technical skills.',
    },
    {
        question: 'What happens after we apply?',
        answer: 'Our team will reach out within 24 hours to verify your estate, and discuss onboarding details.',
    },
];

export default function Support() {
    const { data, setData, post, processing, errors, reset, setError, clearErrors } = useForm({
        name: '',
        email: '',
        message: '',
    });

    const { flash } = usePage().props as unknown as { flash: { success?: string } };
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        clearErrors();
        let hasErrors = false;

        if (!data.name.trim()) {
            setError('name', 'Full name is required');
            hasErrors = true;
        }
        if (!data.email.trim() || !/^\S+@\S+\.\S+$/.test(data.email)) {
            setError('email', 'A valid email address is required');
            hasErrors = true;
        }
        if (!data.message.trim() || data.message.length < 10) {
            setError('message', 'Message must be at least 10 characters long');
            hasErrors = true;
        }
        if (hasErrors) return;

        post('/support', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    useGSAP(() => {
        // Hero Parallax Elements
        gsap.to('.gsap-hero-bg', {
            yPercent: 30,
            ease: 'none',
            scrollTrigger: {
                trigger: '#support-hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        // Floating Hero Cards
        gsap.to('.gsap-floating-card-1', {
            y: 20,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
        });
        gsap.to('.gsap-floating-card-2', {
            y: -20,
            duration: 2.5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            delay: 0.5,
        });

        // Fade Up Elements
        const fadeUpElements = gsap.utils.toArray('.gsap-fade-up') as HTMLElement[];
        fadeUpElements.forEach((el) => {
            gsap.fromTo(
                el,
                { y: 40, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                    },
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                },
            );
        });

        // Stagger Grid Items
        const gridItems = gsap.utils.toArray('.gsap-grid-item') as HTMLElement[];
        if (gridItems.length > 0) {
            gsap.fromTo(
                gridItems,
                { y: 40, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: gridItems[0],
                        start: 'top 85%',
                    },
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                },
            );
        }

        // Contact Cards Stagger
        const contactCards = gsap.utils.toArray('.gsap-contact-card') as HTMLElement[];
        if (contactCards.length > 0) {
            gsap.fromTo(
                contactCards,
                { scale: 0.9, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: contactCards[0],
                        start: 'top 85%',
                    },
                    scale: 1,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'back.out(1.5)',
                },
            );
        }
    });

    return (
        <PublicLayout>
            <Head title="Support & Help Center | Kontrol" />

            <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-500/30 dark:bg-slate-950">
                {/* SECTION 1: HERO */}
                <section
                    id="support-hero"
                    className="relative flex min-h-[70vh] items-center justify-center overflow-hidden border-b border-slate-900 bg-slate-950 pt-32 pb-20"
                >
                    <div className="gsap-hero-bg absolute inset-0 z-0">
                        <img
                            src="/assets/images/premium-estate-hero.png"
                            alt="Kontrol Support"
                            className="h-[130%] w-full object-cover opacity-40 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
                        <div className="grid items-center gap-16 lg:grid-cols-2">
                            <div className="text-left">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-md"
                                >
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                                    Dedicated Help Center
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-7xl"
                                >
                                    Need Help?
                                    <br />
                                    <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">We're Here.</span>
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="mb-10 max-w-lg text-xl leading-relaxed text-slate-300"
                                >
                                    Whether you're exploring Kontrol, planning onboarding, or already managing an estate, our team is ready to assist
                                    you.
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    className="flex flex-wrap gap-x-6 gap-y-4"
                                >
                                    {[
                                        { icon: Clock, text: 'Fast Responses' },
                                        { icon: ShieldCheck, text: 'Dedicated Support' },
                                        { icon: ArrowRight, text: 'Guided Onboarding' },
                                        { icon: User, text: 'Real People' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 font-medium text-slate-300">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800">
                                                <item.icon className="h-3 w-3 text-blue-400" />
                                            </div>
                                            {item.text}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Floating UI Elements */}
                            <div className="relative hidden h-[500px] w-full lg:block">
                                <div className="absolute top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
                                    <div className="gsap-floating-card-1 absolute -top-10 -right-10 z-20 flex w-64 items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                                            <Headphones className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Live Support</p>
                                            <p className="text-xs text-slate-400">Available Mon-Fri</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
                                        <div className="mb-6 flex items-center gap-4 border-b border-slate-800 pb-6">
                                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-blue-500 bg-slate-800">
                                                <img
                                                    src="/assets/images/team/support-avatar.jpg"
                                                    alt="Agent"
                                                    className="h-full w-full object-cover opacity-80"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <User className="absolute h-6 w-6 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-white">Customer Success</p>
                                                <p className="flex items-center gap-1 text-sm text-blue-400">
                                                    <span className="h-2 w-2 rounded-full bg-green-500"></span> Online now
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-slate-800/50 p-4 text-sm text-slate-300">
                                                Hi there! How can we help your estate today?
                                            </div>
                                        </div>
                                    </div>

                                    <div className="gsap-floating-card-2 absolute -bottom-10 -left-10 z-20 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold tracking-wider text-white uppercase">Avg Response Time</p>
                                            <p className="text-sm font-medium text-emerald-400">Under 24 Hours</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: HOW WE CAN HELP */}
                <section className="relative border-b border-slate-200 bg-white py-32 dark:border-slate-900 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="gsap-fade-up mb-16 max-w-2xl">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">How We Can Help</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">
                                Select a topic below to find relevant resources or to direct your inquiry to the right specialist.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                { icon: Building, title: 'Getting Started', desc: 'Need help understanding how Kontrol works for your estate?' },
                                {
                                    icon: ArrowRight,
                                    title: 'Estate Onboarding',
                                    desc: "We'll help your estate get set up correctly and import your data.",
                                },
                                { icon: Settings, title: 'Technical Support', desc: 'Questions about features, app usage, or account access?' },
                                {
                                    icon: HelpCircle,
                                    title: 'General Enquiries',
                                    desc: 'Need more information about pricing or features before applying?',
                                },
                            ].map((card, idx) => (
                                <div
                                    key={idx}
                                    className="gsap-grid-item group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30"
                                >
                                    <div className="absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:text-blue-400">
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 3: FAQ */}
                <section className="relative border-b border-slate-200 bg-slate-50 py-32 dark:border-slate-900 dark:bg-slate-900/50">
                    <div className="mx-auto max-w-3xl px-6 lg:px-8">
                        <div className="gsap-fade-up mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">
                                Find quick answers to the most common questions about Kontrol.
                            </p>
                        </div>

                        <div className="gsap-fade-up space-y-4">
                            {faqs.map((faq, idx) => (
                                <div
                                    key={idx}
                                    className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-slate-900 ${
                                        openFaq === idx
                                            ? 'border-blue-500/50 shadow-lg dark:border-blue-500/50'
                                            : 'border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none"
                                    >
                                        <span className="pr-8 text-lg font-bold text-slate-900 dark:text-white">{faq.question}</span>
                                        <div
                                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${openFaq === idx ? 'rotate-180 bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                                        >
                                            {openFaq === idx ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            >
                                                <div className="mx-6 mt-2 border-t border-slate-100 px-6 pt-4 pb-6 leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 4: CONTACT OPTIONS */}
                <section className="relative border-b border-slate-200 bg-white py-32 dark:border-slate-900 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid gap-8 lg:grid-cols-3">
                            <a
                                href="mailto:support@usekontrol.com"
                                className="gsap-contact-card group relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white text-blue-600 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400">
                                    <Mail className="h-10 w-10" />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Email Support</h3>
                                <p className="mb-4 text-lg font-bold text-blue-600 dark:text-blue-400">support@usekontrol.com</p>
                                <div className="mt-auto inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-1.5 text-xs font-bold tracking-wider text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                                    <Clock className="h-3 w-3" /> Typical response: Within 24 hours
                                </div>
                            </a>

                            <a
                                href="https://wa.me/2347036481189"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gsap-contact-card group relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-green-500/50 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-green-500/50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white text-green-500 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:border-green-400 group-hover:bg-green-500 group-hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-green-400">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="40"
                                        height="40"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path>
                                        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path>
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">WhatsApp Support</h3>
                                <p className="mb-4 text-lg font-bold text-green-600 dark:text-green-400">+234 703 648 1189</p>
                                <div className="mt-auto inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-1.5 text-center text-xs font-bold tracking-wider text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                                    Quick answers & onboarding
                                </div>
                            </a>

                            <div className="gsap-contact-card group relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-slate-400/50 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600/50">
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-600 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:border-slate-700 group-hover:bg-slate-800 group-hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                    <Building className="h-10 w-10" />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Business Hours</h3>
                                <div className="mb-4 space-y-1 text-lg text-slate-600 dark:text-slate-400">
                                    <p className="font-medium">Monday – Friday</p>
                                    <p className="font-bold">9:00 AM – 5:00 PM</p>
                                </div>
                                <div className="mt-auto inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-1.5 text-xs font-bold tracking-wider text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                                    <MapPin className="h-3 w-3" /> Lagos, Nigeria
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 5: SEND US A MESSAGE (FORM) */}
                <section className="relative border-b border-slate-200 bg-slate-50 py-32 dark:border-slate-900 dark:bg-slate-900">
                    <div className="mx-auto max-w-3xl px-6 lg:px-8">
                        <div className="gsap-fade-up mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Send Us A Message</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">
                                Tell us a little about what you need and our team will get back to you promptly.
                            </p>
                        </div>

                        <div className="gsap-fade-up relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200 sm:p-12 dark:bg-slate-950 dark:ring-slate-800">
                            <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                            {flash?.success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">Message Sent!</h3>
                                    <p className="mx-auto max-w-md text-lg text-slate-600 dark:text-slate-400">{flash.success}</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={submit} className="space-y-8" noValidate>
                                    <div className="grid gap-8 sm:grid-cols-2">
                                        <div className="group">
                                            <label
                                                htmlFor="name"
                                                className="mb-3 block text-sm font-bold text-slate-900 transition-colors group-focus-within:text-blue-600 dark:text-slate-300 dark:group-focus-within:text-blue-400"
                                            >
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className={`block w-full rounded-2xl border-0 py-4 pr-4 pl-12 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} bg-slate-50 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-900 dark:text-white dark:ring-slate-700`}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            {errors.name && <p className="mt-2 text-sm font-medium text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="group">
                                            <label
                                                htmlFor="email"
                                                className="mb-3 block text-sm font-bold text-slate-900 transition-colors group-focus-within:text-blue-600 dark:text-slate-300 dark:group-focus-within:text-blue-400"
                                            >
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-500">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className={`block w-full rounded-2xl border-0 py-4 pr-4 pl-12 text-slate-900 shadow-sm ring-1 ring-inset ${errors.email ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} bg-slate-50 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-900 dark:text-white dark:ring-slate-700`}
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                            {errors.email && <p className="mt-2 text-sm font-medium text-red-500">{errors.email}</p>}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label
                                            htmlFor="message"
                                            className="mb-3 block text-sm font-bold text-slate-900 transition-colors group-focus-within:text-blue-600 dark:text-slate-300 dark:group-focus-within:text-blue-400"
                                        >
                                            How can we help?
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={6}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className={`block w-full rounded-2xl border-0 p-5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.message ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} bg-slate-50 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-900 dark:text-white dark:ring-slate-700`}
                                            placeholder="Tell us what you need..."
                                        ></textarea>
                                        {errors.message && <p className="mt-2 text-sm font-medium text-red-500">{errors.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-5 text-lg font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] hover:bg-blue-500 hover:shadow-blue-600/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                                    >
                                        {processing ? (
                                            'Sending Message...'
                                        ) : (
                                            <>
                                                Send Message{' '}
                                                <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>

                {/* SECTION 6: FINAL TRUST CTA */}
                <section className="relative overflow-hidden border-t border-slate-900 bg-slate-950 py-32">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
                    <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="rounded-[3rem] border border-slate-800 bg-slate-900/50 p-10 shadow-2xl backdrop-blur-xl sm:p-16"
                        >
                            <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                                Let's Make Estate Management Easier.
                            </h2>
                            <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-slate-300">
                                Whether you're exploring Kontrol or ready to onboard your estate, we're happy to help you every step of the way.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link
                                    href="/apply"
                                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500"
                                >
                                    Apply For Your Estate <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                                <button
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800"
                                >
                                    Back to Top
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
