import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { CheckCircle2, Building, User, ArrowRight } from 'lucide-react';
import { useState, useRef, FormEventHandler } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useForm } from '@inertiajs/react';

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

    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });

    const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
    const opacityHero = useTransform(scrollYProgress, [0, 1], [1, 0]);

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

            {/* Parallax Hero Section */}
            <section ref={heroRef} className="relative flex min-h-[40vh] items-center justify-center overflow-hidden bg-slate-950 pt-24 pb-16">
                <div className="absolute inset-0 z-0">
                    <motion.div style={{ y: yBg }} className="absolute inset-x-0 -inset-y-16">
                        <img
                            src="/assets/images/premium-estate-hero.png"
                            alt="Estate Application"
                            className="h-full w-full object-cover opacity-50 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
                    </motion.div>
                </div>

                <motion.div style={{ opacity: opacityHero }} className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl"
                    >
                        Join Kontrol
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mt-6 text-xl leading-8 font-medium text-slate-300 drop-shadow-sm"
                    >
                        Start your free trial and experience modern estate management.
                    </motion.p>
                </motion.div>
            </section>

            {/* Application Content Section */}
            <div className="min-h-[60vh] bg-slate-50 py-24 dark:bg-slate-950">
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
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {plans?.map((plan) => (
                                                        <label
                                                            key={plan.id}
                                                            className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none ${
                                                                data.plan_id === String(plan.id)
                                                                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 dark:bg-blue-900/20'
                                                                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="plan_id"
                                                                value={plan.id}
                                                                className="sr-only"
                                                                onChange={(e) => setData('plan_id', e.target.value)}
                                                            />
                                                            <div className="flex flex-1">
                                                                <div className="flex flex-col">
                                                                    <span className="block text-sm font-medium text-slate-900 dark:text-white">
                                                                        {plan.name}
                                                                    </span>
                                                                    <span className="mt-1 flex items-center text-sm text-slate-500 dark:text-slate-400">
                                                                        {plan.formatted_price} / {plan.billing_interval}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <CheckCircle2
                                                                className={`h-5 w-5 ${
                                                                    data.plan_id === String(plan.id) ? 'text-blue-600' : 'invisible'
                                                                }`}
                                                            />
                                                        </label>
                                                    ))}
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
                                                        <dt className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Estate Name</dt>
                                                        <dd className="font-semibold text-slate-900 dark:text-white">{data.estateName}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Location</dt>
                                                        <dd className="font-semibold text-slate-900 dark:text-white">{data.estateLocation}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Selected Plan</dt>
                                                        <dd className="font-semibold text-slate-900 dark:text-white">
                                                            {plans?.find(p => String(p.id) === String(data.plan_id))?.name || 'None'}
                                                            <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                                                                ({plans?.find(p => String(p.id) === String(data.plan_id))?.formatted_price || ''} / {plans?.find(p => String(p.id) === String(data.plan_id))?.billing_interval || ''})
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
        </PublicLayout>
    );
}
