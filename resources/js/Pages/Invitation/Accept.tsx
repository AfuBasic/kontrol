import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function AcceptInvitation({ user }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/invitation/${user.id}${window.location.search}`);
    }

    return (
        <>
            <Head title="Set Up Your Password - Kontrol" />

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#0A3D91] to-[#041E4A] px-4 py-12">
                {/* Ambient logic background */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-0 left-0 h-96 w-96 bg-[#1F6FDB] opacity-10 blur-[100px]" />
                    <div className="absolute right-0 bottom-0 h-96 w-96 bg-[#1F6FDB] opacity-5 blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 w-full max-w-md"
                >
                    {/* Branding - Quiet Luxury (Small & Centered) */}
                    <div className="mb-10 flex justify-center">
                        <div className="h-10 w-auto">
                            <img
                                src="/assets/images/kontrol-white-logo-new.png"
                                alt="Kontrol"
                                className="h-full w-auto object-contain transition-transform duration-700 hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Frosted Glass Panel */}
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl">
                        <div className="p-8 lg:p-10">
                            <div className="mb-8 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome, {user.name}</h1>
                                <p className="mt-2 text-sm text-white/50">Establish your secure access credentials.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email (Locked Display) */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">Assigned Email</label>
                                    <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3.5 text-sm text-white/60">{user.email}</div>
                                </div>

                                {/* Password Entrance */}
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label htmlFor="password" className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
                                            Choose Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder-white/20 transition-all focus:border-[#1F6FDB] focus:bg-white/10 focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                                placeholder="Create a strong password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/20 transition-colors outline-none hover:text-white/60"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-1.5 text-xs text-red-400"
                                            >
                                                {errors.password}
                                            </motion.p>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <label
                                            htmlFor="password_confirmation"
                                            className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase"
                                        >
                                            Verify Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="password_confirmation"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder-white/20 transition-all focus:border-[#1F6FDB] focus:bg-white/10 focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                                placeholder="Repeat for security"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/20 transition-colors outline-none hover:text-white/60"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="relative w-full overflow-hidden rounded-xl bg-[#1F6FDB] px-4 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-[#1F6FDB]/20 transition-all hover:bg-[#2579ed] hover:shadow-[#1F6FDB]/40 active:scale-98 disabled:opacity-50"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {processing ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Validating...
                                            </>
                                        ) : (
                                            'Activate Account'
                                        )}
                                    </span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-xs text-white/30">
                        Secure connection via Kontrol Access Gateway.
                        <br />
                        &copy; {new Date().getFullYear()} Kontrol.
                    </p>
                </motion.div>
            </div>
        </>
    );
}
