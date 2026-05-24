import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Building2, Mail, User as UserIcon, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    token: string;
    estate: {
        name: string;
        address: string;
        logo: string | null;
    };
}

// Reuse the illustration from Login or a similar aesthetic
function JoinIllustration() {
    return (
        <svg viewBox="0 0 400 400" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="joinGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1F6FDB" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#1F6FDB" stopOpacity="0" />
                </radialGradient>
            </defs>
            <motion.path
                d="M40,320 Q200,40 360,320"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <motion.path
                d="M70,320 Q200,80 330,320"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.15"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.1 }}
            />
            <motion.path
                d="M100,320 Q200,120 300,320"
                stroke="#1F6FDB"
                strokeWidth="2"
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
            />
            <motion.circle
                cx="200"
                cy="200"
                r="60"
                fill="url(#joinGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
            />
            <motion.path
                d="M180,200 L195,215 L230,180"
                stroke="#1F6FDB"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
            />
        </svg>
    );
}

export default function Join({ token, estate }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/join/${token}`);
    };

    return (
        <div className="flex min-h-screen bg-white">
            <Head title={`Join ${estate.name}`} />

            {/* Left side - Context & Illustration */}
            <div className="relative hidden w-1/2 overflow-hidden bg-linear-to-br from-[#0A3D91] to-[#041E4A] lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="relative z-10">
                    <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-8 w-auto" />
                </div>

                <div className="relative z-10 flex flex-1 items-center justify-center">
                    <div className="h-80 w-80">
                        <JoinIllustration />
                    </div>
                </div>

                <motion.div className="relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                        <Building2 className="h-4 w-4" />
                        Official Invitation
                    </div>
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">
                        Welcome to
                        <br />
                        {estate.name}
                    </h1>
                    <p className="max-w-md text-lg text-white/60">Join your estate community on Kontrol. Secure, verified, and connected.</p>
                </motion.div>
            </div>

            {/* Right side - Form */}
            <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-10 lg:hidden">
                        <img src="/assets/images/icon.png" alt="Kontrol" className="h-12 w-12" />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
                        <p className="mt-2 text-gray-500">Please fill in your details to request access to {estate.name}.</p>
                    </motion.div>

                    <form onSubmit={submit} className="mt-10 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pr-4 pl-10 text-gray-900 transition-all outline-none focus:border-primary-500 focus:bg-white focus:ring-primary-500"
                                        placeholder="John Doe"
                                    />
                                </div>
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pr-4 pl-10 text-gray-900 transition-all outline-none focus:border-primary-500 focus:bg-white focus:ring-primary-500"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pr-12 pl-10 text-gray-900 transition-all outline-none focus:border-primary-500 focus:bg-white focus:ring-primary-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 outline-none hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <CheckCircle2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pr-12 pl-10 text-gray-900 transition-all outline-none focus:border-primary-500 focus:bg-white focus:ring-primary-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 outline-none hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-primary-600 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700 hover:shadow-primary-500/40 disabled:opacity-50"
                        >
                            {processing ? 'Processing...' : 'Sign up'}
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
