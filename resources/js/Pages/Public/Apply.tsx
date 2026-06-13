import { Head, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Building, User, Users, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useState, useRef, type FormEventHandler } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useForm } from '@inertiajs/react';
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
        plan_id: '',
    });

    const { plans } = usePage().props as unknown as { plans: any[] };

    const { flash } = usePage().props as unknown as { flash: { success?: string } };

    const containerRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const tlParallax = gsap.timeline({
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            tlParallax.to('.gsap-hero-bg', { y: 150, ease: 'none' }, 0).to('.gsap-hero-content', { opacity: 0, y: -50, ease: 'none' }, 0);

            gsap.from('.gsap-hero-stagger-item', {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                delay: 0.1,
            });
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
            if (!data.plan_id) {
                setError('plan_id', 'Please select a subscription plan');
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
                <title>Apply for Your Estate - Kontrol</title>
            </Head>

            <div ref={containerRef}>
                {/* Parallax Hero Section */}
                <section ref={heroRef} className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-slate-950 pt-24 pb-16">
                    <div className="absolute inset-0 z-0">
                        <div className="gsap-hero-bg absolute inset-x-0 -inset-y-16 will-change-transform">
                            <img
                                src="/assets/images/premium-estate-hero.png"
                                alt="Estate Application"
                                className="h-full w-full object-cover opacity-40 mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950" />
                        </div>
                    </div>

                    <div className="gsap-hero-content relative z-10 mx-auto max-w-4xl px-6 text-center will-change-transform lg:px-8">
                        <div className="gsap-hero-stagger-item mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            Setup takes less than 5 minutes
                        </div>

                        <h1 className="gsap-hero-stagger-item text-5xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-7xl">
                            Start Your Trial For <br className="hidden sm:block" />
                            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Absolutely FREE</span>
                        </h1>

                        <p className="gsap-hero-stagger-item mt-6 text-xl leading-8 font-medium text-slate-300 drop-shadow-sm sm:text-2xl">
                            Experience the future of estate management today. <br className="hidden sm:block" />
                            <span className="text-white">No credit card required. Cancel anytime.</span>
                        </p>

                        <div className="gsap-hero-stagger-item mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-300">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-400" />
                                Unlimited Residents
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                14-Day Free Access
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-emerald-400" />
                                24/7 Support
                            </div>
                        </div>
                    </div>
                </section>

                {/* Application Content Section */}
                <div className="min-h-[60vh] bg-slate-50 pb-24 pt-16 dark:bg-slate-950">
                    {/* 3 Steps Flow */}
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-24">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="gsap-fade-up text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Three steps to a smarter estate</h2>
                            <p className="gsap-fade-up mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
                                We've made the transition as seamless as possible. No downtime, no complex onboarding.
                            </p>
                        </div>
                        <div className="gsap-stagger-section mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Submit Details</h3>
                                <p className="text-slate-600 dark:text-slate-400">Tell us a bit about your estate and choose a plan that fits your community size.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">2</span>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Rapid Verification</h3>
                                <p className="text-slate-600 dark:text-slate-400">Our team verifies your estate within 24 hours to ensure a secure, trusted network.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Go Live</h3>
                                <p className="text-slate-600 dark:text-slate-400">Invite residents, arm your security gates, and experience total control.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mx-auto max-w-3xl px-6 lg:px-8">
                        {!flash?.success ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-3xl bg-white p-8 shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100 sm:p-12 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800"
                            >
                                {/* Progress Indicator */}
                                <div className="relative mb-12 flex items-center justify-between">
                                    <div className="absolute top-1/2 left-0 -z-10 h-1 w-full -translate-y-1/2 bg-slate-100 dark:bg-slate-800">
                                        <motion.div
                                            className="h-full rounded-full bg-blue-600"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${((step - 1) / 2) * 100}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    {[1, 2, 3].map((num) => (
                                        <div
                                            key={num}
                                            className={`flex h-12 w-12 items-center justify-center rounded-full border-4 text-base font-bold transition-all duration-300 ${
                                                step >= num
                                                    ? 'border-blue-100 bg-blue-600 text-white dark:border-blue-900/50'
                                                    : 'border-slate-50 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
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
                                                className="space-y-6"
                                            >
                                                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                                                        <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Estate Details</h3>
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300">
                                                        Estate Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="estateName"
                                                        value={data.estateName}
                                                        onChange={(e) => setData('estateName', e.target.value)}
                                                        className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.estateName ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700`}
                                                        placeholder="E.g., Aethewood Estate"
                                                    />
                                                    {errors.estateName && <p className="mt-2 text-sm text-red-500">{errors.estateName}</p>}
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300">
                                                        Location / City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="estateLocation"
                                                        value={data.estateLocation}
                                                        onChange={(e) => setData('estateLocation', e.target.value)}
                                                        className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.estateLocation ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700`}
                                                        placeholder="E.g., Lagos, Nigeria"
                                                    />
                                                    {errors.estateLocation && <p className="mt-2 text-sm text-red-500">{errors.estateLocation}</p>}
                                                </div>

                                                <div className="pt-4">
                                                    <label className="mb-4 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300">
                                                        Select Subscription Plan
                                                    </label>
                                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-4">
                                                    {plans?.map((plan) => {
                                                        const isSelected = data.plan_id === String(plan.id);
                                                        const isAnnual = plan.billing_interval?.toLowerCase() === 'year' || plan.billing_interval?.toLowerCase() === 'annual' || plan.name?.toLowerCase().includes('annual');

                                                        return (
                                                            <label
                                                                key={plan.id}
                                                                className={`relative group flex cursor-pointer flex-col rounded-[2rem] p-6 transition-all duration-300 ${
                                                                    isSelected
                                                                        ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2 ring-offset-slate-50 scale-105 z-10 dark:ring-offset-slate-900'
                                                                        : 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 hover:scale-105 hover:shadow-2xl dark:bg-slate-800 dark:text-white dark:shadow-none dark:ring-slate-700'
                                                                }`}
                                                            >
                                                                {/* Background glow for selected state */}
                                                                {isSelected && (
                                                                    <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-b from-blue-400 to-blue-600 opacity-50 blur-xl transition-opacity duration-300"></div>
                                                                )}
                                                                
                                                                {isAnnual && (
                                                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-extrabold uppercase tracking-widest shadow-md transition-colors duration-300 ${
                                                                        isSelected ? 'bg-white text-blue-600' : 'bg-slate-900 text-white dark:bg-blue-500 dark:text-white'
                                                                    }`}>
                                                                        Best Value
                                                                    </div>
                                                                )}
                                                                
                                                                <input
                                                                    type="radio"
                                                                    name="plan_id"
                                                                    value={plan.id}
                                                                    className="sr-only"
                                                                    onChange={(e) => setData('plan_id', e.target.value)}
                                                                />
                                                                
                                                                <div className="flex items-center justify-between mb-8">
                                                                    <h3 className={`text-xl font-bold transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                                        {plan.name}
                                                                    </h3>
                                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                                                                        isSelected 
                                                                            ? 'bg-white text-blue-600 scale-110 shadow-lg' 
                                                                            : 'bg-slate-50 text-transparent border border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                                                                    }`}>
                                                                        <CheckCircle2 className={`h-5 w-5 ${isSelected ? 'fill-current' : ''}`} />
                                                                    </div>
                                                                </div>

                                                                <div className="mt-auto pt-4 border-t transition-colors duration-300 border-white/10 dark:border-slate-700">
                                                                    <div className="flex items-end gap-1 mb-1">
                                                                        <span className="text-3xl font-black tracking-tight">
                                                                            {plan.formatted_price}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`text-sm font-medium transition-colors duration-300 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                        Per resident / {plan.billing_interval}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                    {errors.plan_id && <p className="mt-2 text-sm text-red-500">{errors.plan_id}</p>}
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                                                        <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Information</h3>
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="contactName"
                                                        value={data.contactName}
                                                        onChange={(e) => setData('contactName', e.target.value)}
                                                        className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.contactName ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700`}
                                                        placeholder="Your Name"
                                                    />
                                                    {errors.contactName && <p className="mt-2 text-sm text-red-500">{errors.contactName}</p>}
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="contactEmail"
                                                        value={data.contactEmail}
                                                        onChange={(e) => setData('contactEmail', e.target.value)}
                                                        className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.contactEmail ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700`}
                                                        placeholder="you@example.com"
                                                    />
                                                    {errors.contactEmail && <p className="mt-2 text-sm text-red-500">{errors.contactEmail}</p>}
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300">
                                                        Phone Number <span className="font-normal text-slate-400">(Optional)</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="contactPhone"
                                                        value={data.contactPhone}
                                                        onChange={(e) => setData('contactPhone', e.target.value)}
                                                        className="block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-blue-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                                                        placeholder="+234..."
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                                                        <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Review & Submit</h3>
                                                </div>
                                                <div className="rounded-2xl bg-slate-50 p-8 ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-800">
                                                    <dl className="space-y-6 text-base text-slate-600 dark:text-slate-300">
                                                        <div>
                                                            <dt className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                                Estate Name
                                                            </dt>
                                                            <dd className="font-semibold text-slate-900 dark:text-white">{data.estateName}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Location</dt>
                                                            <dd className="font-semibold text-slate-900 dark:text-white">{data.estateLocation}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                                Selected Plan
                                                            </dt>
                                                            <dd className="font-semibold text-slate-900 dark:text-white">
                                                                {plans?.find((p) => String(p.id) === String(data.plan_id))?.name || 'None'}
                                                                <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                                                                    (
                                                                    {plans?.find((p) => String(p.id) === String(data.plan_id))?.formatted_price || ''}{' '}
                                                                    /{' '}
                                                                    {plans?.find((p) => String(p.id) === String(data.plan_id))?.billing_interval ||
                                                                        ''}
                                                                    )
                                                                </span>
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                                Contact Details
                                                            </dt>
                                                            <dd className="font-semibold text-slate-900 dark:text-white">{data.contactName}</dd>
                                                            <dd className="mt-0.5 text-sm">{data.contactEmail}</dd>
                                                            {data.contactPhone && <dd className="mt-0.5 text-sm">{data.contactPhone}</dd>}
                                                        </div>
                                                    </dl>
                                                </div>
                                                <p className="px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                                    By submitting this application, our team will review your details and reach out within 24 hours to
                                                    help you start your trial.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className={`text-base font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ${step === 1 ? 'invisible' : ''}`}
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
                                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-600/40"
                                            >
                                                Continue <ArrowRight className="h-5 w-5" />
                                            </button>
                                        ) : (
                                            <button
                                                key="submit-btn"
                                                type="submit"
                                                disabled={processing}
                                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-70"
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
                                className="mx-auto max-w-2xl rounded-3xl bg-white p-12 text-center shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800"
                            >
                                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Application Received!</h2>
                                <p className="mb-10 text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                                    Thank you for choosing Kontrol. Our team is reviewing your application and will be in touch with you shortly at{' '}
                                    <strong className="text-slate-900 dark:text-white">{data.contactEmail}</strong> to help you set up your trial.
                                </p>
                                <a
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                >
                                    Return to Homepage
                                </a>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
