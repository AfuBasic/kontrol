import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import ResetPasswordController from '@/actions/App/Http/Controllers/Auth/ResetPasswordController';

interface Props {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(ResetPasswordController.store.url());
    }

    return (
        <>
            <Head title="Reset Password" />

            <div className="flex min-h-screen">
                {/* Left side - Branding */}
                <div className="relative hidden w-1/2 overflow-hidden bg-linear-to-br from-[#0A3D91] to-[#041E4A] lg:flex lg:flex-col lg:justify-between lg:p-12">
                    <div className="relative z-10">
                        <div className="h-12 w-48 overflow-hidden">
                            <img src="/assets/images/kontrol-white-logo.png" alt="Kontrol" className="w-full -translate-y-8" />
                        </div>
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
                                    d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
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
                            Set a new
                            <br />
                            password.
                        </h1>
                        <p className="max-w-sm text-base text-white/60">Choose a strong password to keep your account secure.</p>
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
                            <h2 className="mb-2 text-3xl font-semibold text-gray-900">New password</h2>
                            <p className="mb-8 text-gray-500">Enter your new password below.</p>
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
                                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3.5 text-gray-500"
                                    readOnly
                                />
                                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    New password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 pr-10 text-gray-900 placeholder-gray-400 transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 pr-10 text-gray-900 placeholder-gray-400 transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                        placeholder="Re-enter your password"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
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
                                        Resetting...
                                    </span>
                                ) : (
                                    'Reset password'
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
        </>
    );
}
