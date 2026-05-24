import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ForgotPasswordController from '@/actions/App/Http/Controllers/Auth/ForgotPasswordController';
import Toast from '@/Components/Toast';

export default function ForgotPassword() {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(ForgotPasswordController.store.url());
    }

    return (
        <>
            <Head title="Forgot Password" />

            <div className="flex min-h-screen">
                {/* Left side - Branding */}
                <div className="relative hidden w-1/2 overflow-hidden bg-linear-to-br from-[#0A3D91] to-[#041E4A] lg:flex lg:flex-col lg:justify-between lg:p-12">
                    <div className="relative z-10">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-8 w-auto" />
                    </div>

                    <motion.div
                        className="relative z-10 flex flex-1 items-center justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-center">
                            <svg className="mx-auto h-32 w-32 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                            </svg>
                        </div>
                    </motion.div>

                    <motion.div
                        className="relative z-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white">
                            Forgot your
                            <br />
                            password?
                        </h1>
                        <p className="max-w-sm text-base text-white/60">No worries. We'll send you a link to reset it.</p>
                    </motion.div>

                    <div className="relative z-10 text-sm text-white/40">&copy; {new Date().getFullYear()} Kontrol. All rights reserved.</div>
                </div>

                {/* Right side - Form */}
                <div className="relative flex w-full flex-col justify-center overflow-hidden bg-white px-8 lg:w-1/2 lg:px-24">
                    <div className="relative z-10 mx-auto w-full max-w-sm">
                        {/* Mobile logo */}
                        <div className="mb-10 flex justify-center lg:hidden">
                            <img src="assets/images/icon.png" alt="Kontrol" className="h-20 w-20" />
                        </div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <h2 className="mb-2 text-3xl font-semibold text-gray-900">Reset password</h2>
                            <p className="mb-8 text-gray-500">Enter the email address associated with your account.</p>
                        </motion.div>

                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            onSubmit={submit}
                            className="space-y-5"
                        >
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-[#1F6FDB] px-4 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#1F6FDB]/25 transition-all hover:bg-[#0A3D91] hover:shadow-[#0A3D91]/25 focus:ring-2 focus:ring-[#1F6FDB] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send reset link'
                                )}
                            </button>

                            <div className="text-center">
                                <Link href="/login" className="text-sm font-medium text-[#1F6FDB] hover:text-[#0A3D91]">
                                    Back to sign in
                                </Link>
                            </div>
                        </motion.form>
                    </div>
                </div>
            </div>

            <Toast show={showToast} message={flash?.success ?? ''} type="success" onClose={() => setShowToast(false)} />
        </>
    );
}
