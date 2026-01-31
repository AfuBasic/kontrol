import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AnimatedLayout from '@/layouts/AnimatedLayout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus');
    }

    return (
        <AnimatedLayout>
            <Head title="Zeus - Admin Access" />

            <style>{`
                @import url('https://fonts.bunny.net/css?family=geist-sans:400,500,600&display=swap');

                .font-geist { font-family: 'Geist Sans', system-ui, sans-serif; }

                @keyframes pulse-subtle {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }

                .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }

                .input-field {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s ease;
                }

                .input-field:focus {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(245, 48, 3, 0.5);
                    box-shadow: 0 0 0 3px rgba(245, 48, 3, 0.1);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #f53003 0%, #dc2702 100%);
                    transition: all 0.2s ease;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(245, 48, 3, 0.4);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>

            <div className="font-geist relative flex min-h-screen items-center justify-center bg-[#0f0f0f] px-4">
                {/* Subtle background gradient */}
                <div className="fixed inset-0">
                    <div className="absolute inset-0 bg-linear-to-br from-[#0f0f0f] via-[#141414] to-[#0f0f0f]" />
                    <div className="animate-pulse-subtle absolute top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,48,3,0.03)_0%,transparent_70%)]" />
                </div>

                {/* Main content */}
                <div className="relative z-10 w-full max-w-sm">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="mb-8 flex justify-center"
                    >
                        <div className="h-16 w-full overflow-hidden">
                            <img src="/assets/images/kontrol-white-logo.png" alt="Kontrol" className="w-full -translate-y-24" />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                        className="mb-8 text-center"
                    >
                        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">Zeus</h1>
                        <p className="text-sm text-zinc-500">Admin access portal</p>
                    </motion.div>

                    {/* Login form */}
                    <motion.form
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                        onSubmit={submit}
                    >
                        <div className="rounded-xl border border-white/6 bg-white/2 p-6 backdrop-blur-sm">
                            {/* Username field */}
                            <div className="mb-4">
                                <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-300">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    className="input-field w-full rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                    autoFocus
                                />
                                {errors.username && <p className="mt-2 text-sm text-red-400">{errors.username}</p>}
                            </div>

                            {/* Password field */}
                            <div className="mb-6">
                                <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="input-field w-full rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-medium text-white"
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
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </motion.form>

                    {/* Footer */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                        className="mt-8 text-center text-xs text-zinc-600"
                    >
                        Authorized personnel only
                    </motion.p>
                </div>
            </div>
        </AnimatedLayout>
    );
}
