import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Building, User, Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Apply() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        estateName: '',
        estateLocation: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (step === 1 && (!formData.estateName || !formData.estateLocation)) {
            alert('Please fill in the estate details');
            return;
        }
        if (step === 2 && (!formData.contactName || !formData.contactEmail)) {
            alert('Please fill in your contact details');
            return;
        }
        if (step < 3) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate an API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    return (
        <PublicLayout>
            <Head>
                <title>Apply for Your Estate - Kontrol</title>
            </Head>

            <div className="bg-white py-24 sm:py-32 dark:bg-slate-950 min-h-[80vh]">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    {!isSuccess ? (
                        <>
                            <div className="text-center mb-12">
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                                >
                                    Apply for Your Estate
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400"
                                >
                                    Start your free trial and experience modern estate management.
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-12"
                            >
                                {/* Progress Indicator */}
                                <div className="mb-8 flex items-center justify-between relative">
                                    <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-slate-100 dark:bg-slate-800">
                                        <motion.div
                                            className="h-full bg-blue-600"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${((step - 1) / 2) * 100}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    {[1, 2, 3].map((num) => (
                                        <div
                                            key={num}
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                                                step >= num
                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                    : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900'
                                            }`}
                                        >
                                            {step > num ? <CheckCircle2 className="h-6 w-6" /> : num}
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
                                                    <Building className="h-6 w-6 text-blue-600" />
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Estate Details</h3>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Estate Name</label>
                                                    <input
                                                        type="text"
                                                        name="estateName"
                                                        value={formData.estateName}
                                                        onChange={handleChange}
                                                        className="mt-2 block w-full rounded-md border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                                        placeholder="E.g., Aethewood Estate"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Location / City</label>
                                                    <input
                                                        type="text"
                                                        name="estateLocation"
                                                        value={formData.estateLocation}
                                                        onChange={handleChange}
                                                        className="mt-2 block w-full rounded-md border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                                        placeholder="E.g., Lagos, Nigeria"
                                                        required
                                                    />
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
                                                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
                                                    <User className="h-6 w-6 text-blue-600" />
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contact Information</h3>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Full Name</label>
                                                    <input
                                                        type="text"
                                                        name="contactName"
                                                        value={formData.contactName}
                                                        onChange={handleChange}
                                                        className="mt-2 block w-full rounded-md border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                                        placeholder="Your Name"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Email Address</label>
                                                    <input
                                                        type="email"
                                                        name="contactEmail"
                                                        value={formData.contactEmail}
                                                        onChange={handleChange}
                                                        className="mt-2 block w-full rounded-md border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                                        placeholder="you@example.com"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Phone Number (Optional)</label>
                                                    <input
                                                        type="tel"
                                                        name="contactPhone"
                                                        value={formData.contactPhone}
                                                        onChange={handleChange}
                                                        className="mt-2 block w-full rounded-md border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
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
                                                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
                                                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Review & Submit</h3>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-800">
                                                    <dl className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                                        <div>
                                                            <dt className="font-medium text-slate-900 dark:text-white">Estate Name</dt>
                                                            <dd className="mt-1">{formData.estateName}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-medium text-slate-900 dark:text-white">Location</dt>
                                                            <dd className="mt-1">{formData.estateLocation}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-medium text-slate-900 dark:text-white">Contact</dt>
                                                            <dd className="mt-1">{formData.contactName} ({formData.contactEmail})</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    By submitting this application, our team will review your details and reach out within 24 hours to help you start your trial.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className={`text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ${step === 1 ? 'invisible' : ''}`}
                                        >
                                            Back
                                        </button>
                                        
                                        {step < 3 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                                            >
                                                Continue <ArrowRight className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors disabled:opacity-70"
                                            >
                                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </motion.div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 max-w-2xl mx-auto"
                        >
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 mb-8">
                                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                                Application Received!
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                                Thank you for choosing Kontrol. Our team is reviewing your application and will be in touch with you shortly at <strong>{formData.contactEmail}</strong> to help you set up your trial.
                            </p>
                            <a
                                href="/"
                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                            >
                                Return to Home
                            </a>
                        </motion.div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
