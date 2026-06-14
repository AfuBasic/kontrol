import { Head, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    CheckCircle2, Building, User, ArrowRight, Users, 
    Bell, CreditCard, MessageSquare, Phone, Mail, MapPin, AlertCircle
} from 'lucide-react';
import { useState, useRef, type FormEventHandler } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useForm, Link } from '@inertiajs/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Apply() {
    const [step, setStep] = useState(1);

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
        estateName: '',
        estateLocation: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
    });

    const { flash } = usePage().props as unknown as { flash: { success?: string } };

    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            // Parallax Hero Background
            gsap.to('.gsap-hero-bg', {
                y: 200,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero-section',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            // Floating Cards Animation
            gsap.to('.gsap-floating-card-1', {
                y: -20,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
            gsap.to('.gsap-floating-card-2', {
                y: 25,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: 1,
            });
            gsap.to('.gsap-floating-card-3', {
                y: -15,
                duration: 4.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: 2,
            });

            // Fade Up Elements
            const fadeUpElements = gsap.utils.toArray('.gsap-fade-up') as HTMLElement[];
            fadeUpElements.forEach((el) => {
                gsap.fromTo(el, 
                    { y: 40, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 90%',
                        },
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        ease: 'power3.out',
                    }
                );
            });

            // Stagger Sections
            const staggerSections = gsap.utils.toArray('.gsap-stagger-section') as HTMLElement[];
            staggerSections.forEach((section) => {
                gsap.fromTo(section.children, 
                    { y: 40, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: section,
                            start: 'top 85%',
                        },
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.15,
                        ease: 'power3.out',
                    }
                );
            });

            // Screenshot Reveals
            const screenshots = gsap.utils.toArray('.gsap-screenshot') as HTMLElement[];
            screenshots.forEach((el, i) => {
                const direction = i % 2 === 0 ? 50 : -50;
                gsap.fromTo(el, 
                    { x: direction, opacity: 0, scale: 0.95 },
                    {
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                        },
                        x: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 1,
                        ease: 'power3.out',
                    }
                );
            });
            
            
            // Visitor Phone Animation
            gsap.to('.gsap-visitor-card', {
                scrollTrigger: {
                    trigger: '.gsap-visitor-card',
                    start: 'top 90%',
                },
                y: 0,
                duration: 1,
                ease: 'back.out(1.5)',
            });

            // Invoice Stamp Animation
            gsap.to('.gsap-paid-stamp', {
                scrollTrigger: {
                    trigger: '.gsap-invoice-card',
                    start: 'top 85%',
                },
                opacity: 1,
                scale: 1,
                rotation: -15,
                duration: 0.6,
                delay: 0.3,
                ease: 'back.out(2)',
            });

            // Notifications Animation
            gsap.to('.gsap-notification-1', {
                scrollTrigger: { trigger: '.gsap-notification-1', start: 'top 85%' },
                x: 0, opacity: 1, duration: 0.8, ease: 'power3.out'
            });
            gsap.to('.gsap-notification-2', {
                scrollTrigger: { trigger: '.gsap-notification-2', start: 'top 85%' },
                x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power3.out'
            });

            // Ticket Resolution Animation
            const tl = gsap.timeline({
                scrollTrigger: { trigger: '.gsap-ticket-1', start: 'top 85%' }
            });
            tl.to('.gsap-ticket-1', { x: 50, opacity: 0, duration: 0.5, ease: 'power2.in' })
              .to('.gsap-ticket-resolved', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');

            // Timeline Line Animation
            gsap.fromTo('.gsap-timeline-line', 
                { scaleY: 0 },
                {
                    scrollTrigger: {
                        trigger: '.gsap-timeline-container',
                        start: 'top 70%',
                    },
                    scaleY: 1,
                    transformOrigin: 'top center',
                    duration: 1.5,
                    ease: 'power3.out',
                }
            );
        },
        { scope: containerRef },
    );

    const nextStep = () => {
        clearErrors();
        let hasErrors = false;

        if (step === 1) {
            if (!data.estateName.trim()) {
                setError('estateName', 'Estate Name is required');
                hasErrors = true;
            }
            if (!data.estateLocation.trim()) {
                setError('estateLocation', 'Estate Location is required');
                hasErrors = true;
            }
        }

        if (step === 2) {
            if (!data.contactName.trim()) {
                setError('contactName', 'Contact Name is required');
                hasErrors = true;
            }
            if (!data.contactEmail.trim() || !/^\S+@\S+\.\S+$/.test(data.contactEmail)) {
                setError('contactEmail', 'A valid email address is required');
                hasErrors = true;
            }
        }

        if (hasErrors) return;
        if (step < 3) setStep(step + 1);
    };

    const prevStep = () => {
        clearErrors();
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (step < 3) {
            nextStep();
            return;
        }
        post('/apply', {
            preserveScroll: true,
        });
    };

    return (
        <PublicLayout>
            <Head>
                <title>Bring Kontrol To Your Estate - Apply Now</title>
            </Head>

            <div ref={containerRef} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-blue-500/30">
                {/* SECTION 1: PREMIUM HERO (Always Dark) */}
                <section className="hero-section relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-slate-950 pt-32 pb-24">
                    <div className="absolute inset-0 z-0">
                        <div className="gsap-hero-bg absolute inset-x-0 -inset-y-32 will-change-transform">
                            <img
                                src="/assets/images/premium-estate-hero.png"
                                alt="Estate Background"
                                className="h-full w-full object-cover opacity-30 mix-blend-luminosity"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950" />
                        </div>
                    </div>

                    <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
                        <div className="gsap-fade-up max-w-2xl">
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-300 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                                </span>
                                Setup takes less than 5 minutes
                            </div>
                            
                            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-6xl xl:text-7xl text-white">
                                Bring Kontrol To <br />
                                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Your Estate.
                                </span>
                            </h1>
                            
                            <p className="mt-6 text-xl leading-8 text-slate-300">
                                Manage visitors, payments, announcements, and resident complaints from one beautifully simple platform.
                            </p>
                            
                            <div className="mt-10 flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-blue-600/50"
                                >
                                    Apply For Your Estate <ArrowRight className="ml-2 h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => document.getElementById('outcomes')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/50 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800"
                                >
                                    View Features
                                </button>
                            </div>
                        </div>

                        {/* Floating Hero UI Elements */}
                        <div className="relative hidden lg:block h-[600px] w-full perspective-1000">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-y-[-15deg] rotate-x-[5deg] transform">
                                {/* Abstract Dashboard Mockup */}
                                <div className="h-[400px] w-[600px] rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl">
                                    <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-4">
                                        <div className="h-3 w-3 rounded-full bg-red-500/50" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                                        <div className="h-3 w-3 rounded-full bg-green-500/50" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="h-24 rounded-xl bg-slate-800/50" />
                                        <div className="h-24 rounded-xl bg-blue-900/20 border border-blue-500/20" />
                                        <div className="h-24 rounded-xl bg-slate-800/50" />
                                    </div>
                                    <div className="mt-4 h-48 rounded-xl bg-slate-800/30" />
                                </div>
                            </div>
                            
                            {/* Floating Cards */}
                            <div className="gsap-floating-card-1 absolute top-20 right-10 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Visitor Arrived</p>
                                    <p className="text-xs text-slate-400">Just now</p>
                                </div>
                            </div>

                            <div className="gsap-floating-card-2 absolute bottom-32 -left-10 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                                    <CreditCard className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Payment Received</p>
                                    <p className="text-xs text-slate-400">₦50,000 Dues</p>
                                </div>
                            </div>

                            <div className="gsap-floating-card-3 absolute top-60 -left-4 flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                                    <Bell className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Announcement Sent</p>
                                    <p className="text-xs text-slate-400">To all residents</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: WHY ESTATES CHOOSE KONTROL */}
                <section id="outcomes" className="relative bg-white dark:bg-slate-950 py-32 overflow-hidden border-t border-slate-100 dark:border-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 dark:from-blue-900/20 via-white dark:via-slate-950 to-white dark:to-slate-950"></div>
                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="gsap-fade-up mx-auto max-w-2xl text-center mb-20">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Outcomes, Not Just Features</h2>
                            <h3 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                                Why Premium Estates Choose Kontrol
                            </h3>
                        </div>

                        <div className="gsap-stagger-section grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { icon: Users, title: 'Know When Visitors Arrive', desc: 'Pre-book access codes and eliminate gate congestion permanently.' },
                                { icon: CreditCard, title: 'Collect Dues Easily', desc: 'Automated invoicing, reminders, and transparent financial tracking.' },
                                { icon: Bell, title: 'Keep Residents Updated', desc: 'Send instant push notifications and emergency alerts to everyone.' },
                                { icon: MessageSquare, title: 'Track Complaints', desc: 'Centralized ticketing system for maintenance and resident issues.' },
                            ].map((feature, i) => (
                                <div key={i} className="group relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 dark:from-blue-600/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
                                        <feature.icon className="h-7 w-7" />
                                    </div>
                                    <h4 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h4>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 3: PRODUCT PREVIEW */}
                <section id="features" className="bg-slate-50 py-32 dark:bg-slate-950 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-900">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-32">
                        {/* Feature 1 */}
                        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                            <div className="gsap-fade-up order-2 lg:order-1">
                                <h3 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-6">Manage Visitors</h3>
                                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    End the chaos at the gate. Residents generate access codes directly from their phones, and security personnel simply scan or verify them in seconds.
                                </p>
                                <ul className="space-y-4">
                                    {['Pre-booked access codes', 'Real-time entry notifications', 'Digital visitor logs'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="gsap-screenshot order-1 lg:order-2">
                                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl flex items-center justify-center">
                                    <div className="relative h-64 w-full max-w-[260px] rounded-[2rem] border-[6px] border-slate-800 bg-slate-950 p-4 shadow-inner flex flex-col justify-end overflow-hidden">
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-full"></div>
                                        <div className="gsap-visitor-card bg-blue-600 rounded-xl p-4 w-full shadow-lg translate-y-[150%]">
                                            <div className="text-blue-200 text-[10px] font-bold mb-1 tracking-wider">ACCESS CODE</div>
                                            <div className="text-white text-2xl font-black tracking-widest">842 901</div>
                                            <div className="mt-4 flex justify-between items-center border-t border-blue-500/50 pt-3">
                                                <div className="h-1.5 w-12 bg-blue-400/50 rounded-full"></div>
                                                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                            <div className="gsap-screenshot">
                                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl">
                                    <div className="relative h-64 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                                        <div className="gsap-invoice-card w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 relative">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="text-slate-900 dark:text-white font-bold text-lg">₦50,000</div>
                                            </div>
                                            <div className="space-y-3 mb-2">
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                                <div className="h-2 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            </div>
                                            <div className="gsap-paid-stamp absolute inset-0 m-auto w-28 h-10 border-4 border-emerald-500/80 text-emerald-500/80 font-black tracking-widest flex items-center justify-center rounded-lg opacity-0 scale-150 rotate-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                                                PAID
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="gsap-fade-up">
                                <h3 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-6">Collect Dues</h3>
                                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    Never chase residents for payments again. Kontrol automates invoicing, tracks who has paid, and sends polite reminders to those who haven't.
                                </p>
                                <ul className="space-y-4">
                                    {['Automated recurring invoices', 'Instant payment verification', 'Defaulter tracking'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                            <div className="gsap-fade-up order-2 lg:order-1">
                                <h3 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-6">Keep Residents Updated</h3>
                                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    Broadcast announcements, power outage schedules, or emergency alerts instantly. Residents get notified directly on their devices.
                                </p>
                                <ul className="space-y-4">
                                    {['Instant push notifications', 'Important estate announcements', 'Read receipts'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="gsap-screenshot order-1 lg:order-2">
                                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl">
                                    <div className="relative h-64 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col items-center justify-center overflow-hidden gap-4">
                                        <div className="gsap-notification-1 w-full max-w-[260px] bg-white dark:bg-slate-900 rounded-xl shadow-lg p-3 flex items-start gap-3 translate-x-12 opacity-0 ring-1 ring-slate-200 dark:ring-slate-700">
                                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg shrink-0">
                                                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Announcement</div>
                                                    <div className="text-[9px] text-slate-400">Just now</div>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-1.5"></div>
                                                <div className="h-1.5 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="gsap-notification-2 w-full max-w-[260px] bg-white dark:bg-slate-900 rounded-xl shadow-lg p-3 flex items-start gap-3 -translate-x-12 opacity-0 ring-1 ring-slate-200 dark:ring-slate-700">
                                            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg shrink-0">
                                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Alert</div>
                                                    <div className="text-[9px] text-slate-400">2m ago</div>
                                                </div>
                                                <div className="h-1.5 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full mb-1.5"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                            <div className="gsap-screenshot">
                                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl">
                                    <div className="relative h-64 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 flex items-center justify-center overflow-hidden">
                                        <div className="flex gap-4 w-full max-w-sm">
                                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                                                <div className="text-[10px] font-bold text-slate-400 mb-4 uppercase flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-orange-500"></div> Pending
                                                </div>
                                                <div className="gsap-ticket-1 h-16 w-full bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-lg p-2 flex flex-col justify-between mb-3 relative z-10 shadow-sm">
                                                    <div className="h-1.5 w-1/2 bg-orange-200 dark:bg-orange-500/30 rounded-full"></div>
                                                    <div className="flex justify-end"><div className="h-4 w-4 rounded-full bg-orange-200 dark:bg-orange-500/30"></div></div>
                                                </div>
                                                <div className="h-16 w-full bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/50"></div>
                                            </div>
                                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 relative">
                                                <div className="text-[10px] font-bold text-slate-400 mb-4 uppercase flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div> Resolved
                                                </div>
                                                <div className="gsap-ticket-resolved absolute top-11 left-3 right-3 h-16 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-2 flex flex-col justify-between opacity-0 shadow-sm">
                                                    <div className="h-1.5 w-1/2 bg-emerald-200 dark:bg-emerald-500/30 rounded-full"></div>
                                                    <div className="flex justify-end"><div className="h-4 w-4 rounded-full bg-emerald-200 dark:bg-emerald-500/30"></div></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="gsap-fade-up">
                                <h3 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-6">Track Complaints</h3>
                                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    Give residents a central hub to report maintenance issues or neighborhood disputes, and track resolution transparently.
                                </p>
                                <ul className="space-y-4">
                                    {['Centralized ticketing', 'Status tracking updates', 'Direct resident communication'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 4: WHAT HAPPENS NEXT */}
                <section className="bg-white dark:bg-slate-950 py-32 border-t border-slate-200 dark:border-slate-900">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="gsap-fade-up mx-auto max-w-2xl text-center mb-24">
                            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">What Happens Next?</h2>
                            <p className="mt-4 text-xl text-slate-600 dark:text-slate-400">A completely transparent, zero-risk onboarding process.</p>
                        </div>

                        <div className="gsap-timeline-container relative mx-auto max-w-4xl">
                            {/* Vertical Line */}
                            <div className="gsap-timeline-line absolute left-[28px] md:left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-600 rounded-full md:-translate-x-1/2"></div>
                            
                            <div className="space-y-24">
                                {[
                                    { step: 1, title: 'Tell Us About Your Estate', desc: 'Fill out the short application form below with your basic contact information.', align: 'right' },
                                    { step: 2, title: "We'll Contact You", desc: 'Our onboarding specialists will verify your estate and give you a quick walkthrough.', align: 'left' },
                                    { step: 3, title: 'Start Your Free Trial', desc: 'Invite your residents and security team, and experience the platform risk-free.', align: 'right' },
                                ].map((item, index) => (
                                    <div key={index} className={`gsap-fade-up relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 ${item.align === 'left' ? 'md:flex-row-reverse' : ''}`}>
                                        <div className="hidden md:block w-[45%]"></div>
                                        <div className="absolute left-0 md:left-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border-4 border-white dark:border-slate-950 shadow-[0_0_0_4px_rgba(37,99,235,1)] md:-translate-x-1/2 z-10">
                                            <span className="text-xl font-black text-slate-900 dark:text-white">{item.step}</span>
                                        </div>
                                        <div className={`w-full md:w-[45%] pl-20 md:pl-0 ${item.align === 'left' ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                                            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 backdrop-blur-sm shadow-sm dark:shadow-none">
                                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 5: APPLICATION FORM */}
                <section id="application-form" className="relative bg-slate-50 dark:bg-slate-900 py-32 border-t border-slate-200 dark:border-slate-800">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100 dark:from-blue-900/10 via-slate-50 dark:via-slate-900 to-slate-50 dark:to-slate-900"></div>
                    <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
                        <div className="gsap-fade-up mx-auto max-w-2xl text-center mb-16">
                            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">Join The Future</h2>
                            <p className="mt-4 text-xl text-slate-600 dark:text-slate-400">Complete this short form to secure your free trial.</p>
                        </div>

                        {!flash?.success ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-[2.5rem] bg-white dark:bg-slate-950/50 p-8 shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 sm:p-12 backdrop-blur-xl"
                            >
                                {/* Progress Indicator */}
                                <div className="relative mb-12 flex items-center justify-between px-4">
                                    <div className="absolute top-1/2 left-8 right-8 -z-10 h-1 -translate-y-1/2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                        <motion.div
                                            className="h-full rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)] dark:shadow-[0_0_10px_rgba(37,99,235,0.8)]"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${((step - 1) / 2) * 100}%` }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                        />
                                    </div>
                                    {[1, 2, 3].map((num) => (
                                        <div
                                            key={num}
                                            className={`flex h-12 w-12 items-center justify-center rounded-full border-4 text-base font-bold transition-all duration-300 ${
                                                step >= num
                                                    ? 'border-blue-100 dark:border-blue-900/50 bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                    : 'border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500'
                                            }`}
                                        >
                                            {step > num ? <CheckCircle2 className="h-6 w-6" /> : num}
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit} noValidate>
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-8"
                                            >
                                                <div className="text-center mb-8">
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Estate Information</h3>
                                                    <p className="text-slate-600 dark:text-slate-400 mt-2">Let's start with where you're managing.</p>
                                                </div>
                                                
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Estate Name
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                                <Building className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                name="estateName"
                                                                value={data.estateName}
                                                                onChange={(e) => setData('estateName', e.target.value)}
                                                                className={`block w-full rounded-2xl border-0 bg-slate-50 dark:bg-slate-900/80 py-4 pl-12 pr-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset transition-all ${errors.estateName ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-200 dark:ring-white/10 focus:ring-blue-500'} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2`}
                                                                placeholder="E.g., Aethewood Estate"
                                                            />
                                                        </div>
                                                        {errors.estateName && <p className="mt-2 text-sm text-red-500">{errors.estateName}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Location / City
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                                <MapPin className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                name="estateLocation"
                                                                value={data.estateLocation}
                                                                onChange={(e) => setData('estateLocation', e.target.value)}
                                                                className={`block w-full rounded-2xl border-0 bg-slate-50 dark:bg-slate-900/80 py-4 pl-12 pr-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset transition-all ${errors.estateLocation ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-200 dark:ring-white/10 focus:ring-blue-500'} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2`}
                                                                placeholder="E.g., Lagos, Nigeria"
                                                            />
                                                        </div>
                                                        {errors.estateLocation && <p className="mt-2 text-sm text-red-500">{errors.estateLocation}</p>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-8"
                                            >
                                                <div className="text-center mb-8">
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Information</h3>
                                                    <p className="text-slate-600 dark:text-slate-400 mt-2">How should we reach out to you?</p>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Full Name
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                                <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                name="contactName"
                                                                value={data.contactName}
                                                                onChange={(e) => setData('contactName', e.target.value)}
                                                                className={`block w-full rounded-2xl border-0 bg-slate-50 dark:bg-slate-900/80 py-4 pl-12 pr-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset transition-all ${errors.contactName ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-200 dark:ring-white/10 focus:ring-blue-500'} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2`}
                                                                placeholder="Your Name"
                                                            />
                                                        </div>
                                                        {errors.contactName && <p className="mt-2 text-sm text-red-500">{errors.contactName}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Email Address
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                                <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                            <input
                                                                type="email"
                                                                name="contactEmail"
                                                                value={data.contactEmail}
                                                                onChange={(e) => setData('contactEmail', e.target.value)}
                                                                className={`block w-full rounded-2xl border-0 bg-slate-50 dark:bg-slate-900/80 py-4 pl-12 pr-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset transition-all ${errors.contactEmail ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-200 dark:ring-white/10 focus:ring-blue-500'} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2`}
                                                                placeholder="you@example.com"
                                                            />
                                                        </div>
                                                        {errors.contactEmail && <p className="mt-2 text-sm text-red-500">{errors.contactEmail}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            Phone Number <span className="font-normal text-slate-500">(Optional)</span>
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                                <Phone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                            </div>
                                                            <input
                                                                type="tel"
                                                                name="contactPhone"
                                                                value={data.contactPhone}
                                                                onChange={(e) => setData('contactPhone', e.target.value)}
                                                                className="block w-full rounded-2xl border-0 bg-slate-50 dark:bg-slate-900/80 py-4 pl-12 pr-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10 ring-inset transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                                                                placeholder="+234..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-8"
                                            >
                                                <div className="text-center mb-8">
                                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                                        <CheckCircle2 className="h-8 w-8" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Review & Submit</h3>
                                                    <p className="text-slate-600 dark:text-slate-400 mt-2">Please confirm your details below.</p>
                                                </div>

                                                {Object.keys(errors).length > 0 && (
                                                    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-500/30">
                                                        <div className="flex items-center gap-3">
                                                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                                                {errors.contactEmail || errors.contactPhone || errors.estateName || errors.estateLocation || errors.contactName || 'An error occurred. Please go back and check your details.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="rounded-[2rem] bg-slate-50 dark:bg-slate-900/80 p-8 ring-1 ring-slate-200 dark:ring-white/10">
                                                    <dl className="space-y-6 text-base text-slate-700 dark:text-slate-300">
                                                        <div>
                                                            <dt className="text-sm font-medium text-slate-500">Estate Name</dt>
                                                            <dd className="mt-1 font-semibold text-slate-900 dark:text-white text-lg">{data.estateName}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-sm font-medium text-slate-500">Location</dt>
                                                            <dd className="mt-1 font-semibold text-slate-900 dark:text-white text-lg">{data.estateLocation}</dd>
                                                        </div>
                                                        <div className="pt-6 border-t border-slate-200 dark:border-white/5">
                                                            <dt className="text-sm font-medium text-slate-500">Contact Details</dt>
                                                            <dd className="mt-2 font-semibold text-slate-900 dark:text-white">{data.contactName}</dd>
                                                            <dd className="mt-1 text-slate-600 dark:text-slate-400">{data.contactEmail}</dd>
                                                            {data.contactPhone && <dd className="mt-1 text-slate-600 dark:text-slate-400">{data.contactPhone}</dd>}
                                                        </div>
                                                    </dl>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-10 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-8">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className={`text-base font-semibold text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white ${step === 1 ? 'invisible' : ''}`}
                                        >
                                            Back
                                        </button>

                                        {step < 3 ? (
                                            <button
                                                key="continue-btn"
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    nextStep();
                                                }}
                                                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
                                            >
                                                Continue <ArrowRight className="h-5 w-5" />
                                            </button>
                                        ) : (
                                            <button
                                                key="submit-btn"
                                                type="submit"
                                                disabled={processing}
                                                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                                            >
                                                {processing ? 'Submitting...' : 'Submit Application'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mx-auto max-w-2xl rounded-[2.5rem] bg-white dark:bg-slate-950/50 p-12 text-center shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 backdrop-blur-xl"
                            >
                                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Application Received!</h2>
                                <p className="mb-10 text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                                    Thank you for choosing Kontrol. Our team is reviewing your application and will be in touch with you shortly at{' '}
                                    <strong className="text-slate-900 dark:text-white">{data.contactEmail}</strong> to help you set up your trial.
                                </p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 dark:bg-white px-8 py-4 text-base font-bold text-white dark:text-slate-900 shadow-xl transition-all hover:scale-105 hover:bg-slate-800 dark:hover:bg-slate-100"
                                >
                                    Return to Homepage
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* SECTION 6: SUPPORT & CONTACT */}
                <section className="bg-white dark:bg-slate-950 py-24 border-t border-slate-200 dark:border-slate-900">
                    <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                        <h2 className="gsap-fade-up text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-12">Need Help?</h2>
                        <div className="gsap-stagger-section flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                                    <Phone className="h-6 w-6 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-slate-600 dark:text-slate-500 font-medium">Call Us Directly</p>
                                    <p className="text-lg text-slate-900 dark:text-white font-bold">+234 703 648 1189</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                                    <Mail className="h-6 w-6 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-slate-600 dark:text-slate-500 font-medium">Email Support</p>
                                    <p className="text-lg text-slate-900 dark:text-white font-bold">support@usekontrol.com</p>
                                </div>
                            </div>
                            <a href="https://wa.me/2347036481189" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:border-green-200 dark:group-hover:border-green-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-slate-500 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400">
                                        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path>
                                        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path>
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm text-slate-600 dark:text-slate-500 font-medium">Chat with us</p>
                                    <p className="text-lg text-slate-900 dark:text-white font-bold">WhatsApp</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
