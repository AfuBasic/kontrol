import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import AnimatedLayout from '@/Layouts/AnimatedLayout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus');
    }

    return (
        <AnimatedLayout>
            <Head title="Zeus - Kontrol Admin Portal" />

            <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-primary-950 via-primary-900 to-primary-950 px-4">
                {/* Animated background gradient orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{ y: [0, 30, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-800/20 blur-3xl"
                    />
                    <motion.div
                        animate={{ y: [30, -30, 30] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-700/10 blur-3xl"
                    />
                </div>

                {/* Main content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="relative z-10 w-full max-w-md"
                >
                    {/* Logo - Bold and Prominent */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                        className="mb-12 flex justify-center"
                    >
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-12 w-auto object-contain" />
                    </motion.div>

                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">Zeus</h1>
                        <p className="text-sm text-primary-200">Platform Administration Portal</p>
                    </motion.div>

                    {/* Login Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                    >
                        <div className="rounded-2xl border border-primary-800/40 bg-primary-900/50 p-8 shadow-2xl backdrop-blur-xl">
                            <form onSubmit={submit} className="space-y-5">
                                {/* Username field */}
                                <div>
                                    <label htmlFor="username" className="mb-2 block text-sm font-semibold text-primary-100">
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="Enter your username"
                                        autoComplete="username"
                                        className="w-full rounded-lg border border-primary-700/40 bg-primary-800/30 px-4 py-3 text-sm text-white placeholder-primary-400/60 transition-all focus:border-primary-500/80 focus:bg-primary-800/50 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    />
                                    {errors.username && <p className="mt-2 text-sm text-red-400">{errors.username}</p>}
                                </div>

                                {/* Password field */}
                                <div>
                                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-primary-100">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            className="w-full rounded-lg border border-primary-700/40 bg-primary-800/30 px-4 py-3 pr-12 text-sm text-white placeholder-primary-400/60 transition-all focus:border-primary-500/80 focus:bg-primary-800/50 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-400 transition-colors outline-none hover:text-primary-100"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-6 w-full rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-primary-600 hover:to-primary-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
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
                                            Signing in...
                                        </span>
                                    ) : (
                                        'Sign in to Zeus'
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Footer text */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-8 text-center text-xs text-primary-300/60"
                    >
                        Authorized personnel only • Kontrol Admin Portal
                    </motion.p>
                </motion.div>
            </div>
        </AnimatedLayout>
    );
}
