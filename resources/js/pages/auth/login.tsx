import SocialLoginController from '@/actions/App/Http/Controllers/Auth/SocialLoginController';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';

// Abstract SVG illustration: "Controlled Passage"
// Flowing paths through layered boundaries suggesting secure, approved entry
function GatewayIllustration() {
    return (
        <svg viewBox="0 0 400 400" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                {/* Entry glow gradient */}
                <radialGradient id="entryGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1F6FDB" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1F6FDB" stopOpacity="0" />
                </radialGradient>

                {/* Vertical flow gradient */}
                <linearGradient id="flowGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#1F6FDB" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#1F6FDB" stopOpacity="1" />
                    <stop offset="100%" stopColor="#1F6FDB" stopOpacity="0.5" />
                </linearGradient>
            </defs>

            {/* Outer boundary arcs - representing layers of access */}
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
                stroke="white"
                strokeWidth="1.5"
                strokeOpacity="0.2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
            />
            <motion.path
                d="M130,320 Q200,160 270,320"
                stroke="#1F6FDB"
                strokeWidth="2"
                strokeOpacity="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />

            {/* Inner gateway frame */}
            <motion.path
                d="M160,320 Q200,200 240,320"
                stroke="#1F6FDB"
                strokeWidth="2"
                strokeOpacity="0.8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
            />

            {/* Central flowing path - approved entry */}
            <motion.path
                d="M200,360 L200,200"
                stroke="url(#flowGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.7 }}
            />

            {/* Entry glow */}
            <motion.circle
                cx="200"
                cy="200"
                r="50"
                fill="url(#entryGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
            />

            {/* Validation checkpoints - with subtle pulse */}
            <motion.circle
                cx="200"
                cy="200"
                r="8"
                fill="#1F6FDB"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{
                    scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 },
                }}
            />
            <motion.circle
                cx="200"
                cy="200"
                r="12"
                stroke="#1F6FDB"
                strokeWidth="2"
                fill="none"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: [0.5, 0.3, 0.5] }}
                transition={{
                    scale: { duration: 0.4, delay: 1.3 },
                    opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 },
                }}
            />

            {/* Upper checkpoint nodes */}
            <motion.circle
                cx="200"
                cy="160"
                r="4"
                fill="#1F6FDB"
                fillOpacity="0.7"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.4 }}
            />
            <motion.circle
                cx="200"
                cy="130"
                r="3"
                fill="#1F6FDB"
                fillOpacity="0.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.5 }}
            />
            <motion.circle
                cx="200"
                cy="105"
                r="2"
                fill="#1F6FDB"
                fillOpacity="0.3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.6 }}
            />

            {/* Horizontal boundary lines */}
            <motion.line
                x1="120"
                y1="200"
                x2="170"
                y2="200"
                stroke="#1F6FDB"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
            />
            <motion.line
                x1="230"
                y1="200"
                x2="280"
                y2="200"
                stroke="#1F6FDB"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
            />
        </svg>
    );
}

// Ambient background accents for left panel corners
function LeftPanelAccents() {
    return (
        <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Top-left corner accent - small arc cluster */}
            <motion.path
                d="M0,12 Q6,6 12,0"
                stroke="white"
                strokeWidth="0.3"
                strokeOpacity="0.15"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.path
                d="M0,18 Q9,9 18,0"
                stroke="white"
                strokeWidth="0.3"
                strokeOpacity="0.1"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.6 }}
            />

            {/* Top-left breathing dot */}
            <motion.circle
                cx="5"
                cy="5"
                r="0.6"
                fill="white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Bottom-right corner accent */}
            <motion.path
                d="M100,88 Q94,94 88,100"
                stroke="white"
                strokeWidth="0.3"
                strokeOpacity="0.1"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
            />

            {/* Scattered ambient dots with breathing animation */}
            <motion.circle
                cx="85"
                cy="15"
                r="0.4"
                fill="white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            <motion.circle
                cx="12"
                cy="75"
                r="0.4"
                fill="white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.12, 0.22, 0.12] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            />
            <motion.circle
                cx="90"
                cy="85"
                r="0.3"
                fill="#1F6FDB"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />
        </svg>
    );
}

// Striking geometric illustration for the right (form) panel
// Network of connected nodes suggesting controlled access flow
function RightPanelIllustration() {
    return (
        <>
            {/* Top-right corner illustration */}
            <svg
                className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 opacity-60"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1F6FDB" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1F6FDB" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {/* Concentric arcs */}
                <motion.path
                    d="M200,0 Q200,100 100,100"
                    stroke="url(#lineGradient1)"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                />
                <motion.path
                    d="M200,0 Q200,70 130,70"
                    stroke="#1F6FDB"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                />
                <motion.path
                    d="M200,0 Q200,40 160,40"
                    stroke="#1F6FDB"
                    strokeWidth="1"
                    strokeOpacity="0.2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
                />

                {/* Connection nodes */}
                <motion.circle
                    cx="170"
                    cy="30"
                    r="4"
                    fill="#1F6FDB"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                />
                <motion.circle
                    cx="145"
                    cy="55"
                    r="3"
                    fill="#1F6FDB"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 0.3, delay: 1 }}
                />
                <motion.circle
                    cx="120"
                    cy="80"
                    r="5"
                    fill="#1F6FDB"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1, 1], opacity: [0, 0.6, 0.4] }}
                    transition={{ duration: 2, delay: 1.2, repeat: Infinity, repeatType: 'reverse' }}
                />

                {/* Connecting lines between nodes */}
                <motion.line
                    x1="170"
                    y1="30"
                    x2="145"
                    y2="55"
                    stroke="#1F6FDB"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                />
                <motion.line
                    x1="145"
                    y1="55"
                    x2="120"
                    y2="80"
                    stroke="#1F6FDB"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 1.3 }}
                />
            </svg>

            {/* Bottom-left corner illustration */}
            <svg
                className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 opacity-50"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="lineGradient2" x1="100%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#1F6FDB" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1F6FDB" stopOpacity="0.05" />
                    </linearGradient>
                    <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1F6FDB" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1F6FDB" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Large sweeping arcs */}
                <motion.path
                    d="M0,200 Q0,80 120,80"
                    stroke="url(#lineGradient2)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                />
                <motion.path
                    d="M0,200 Q0,120 80,120"
                    stroke="#1F6FDB"
                    strokeWidth="1.5"
                    strokeOpacity="0.25"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                />
                <motion.path
                    d="M0,200 Q0,160 40,160"
                    stroke="#1F6FDB"
                    strokeWidth="1"
                    strokeOpacity="0.15"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.7 }}
                />

                {/* Glow effect */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="30"
                    fill="url(#nodeGlow)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                />

                {/* Network nodes */}
                <motion.circle
                    cx="30"
                    cy="170"
                    r="3"
                    fill="#1F6FDB"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, opacity: [0.3, 0.5, 0.3] }}
                    transition={{ scale: { duration: 0.3, delay: 0.9 }, opacity: { duration: 3, repeat: Infinity, delay: 2 } }}
                />
                <motion.circle
                    cx="60"
                    cy="140"
                    r="4"
                    fill="#1F6FDB"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 0.3, delay: 1.1 }}
                />
                <motion.circle
                    cx="100"
                    cy="100"
                    r="6"
                    fill="#1F6FDB"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                />

                {/* Connecting lines */}
                <motion.line
                    x1="30"
                    y1="170"
                    x2="60"
                    y2="140"
                    stroke="#1F6FDB"
                    strokeWidth="1"
                    strokeOpacity="0.25"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 1.2 }}
                />
                <motion.line
                    x1="60"
                    y1="140"
                    x2="100"
                    y2="100"
                    stroke="#1F6FDB"
                    strokeWidth="1.5"
                    strokeOpacity="0.3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                />

                {/* Additional floating nodes */}
                <motion.circle
                    cx="140"
                    cy="60"
                    r="2"
                    fill="#1F6FDB"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
                <motion.circle
                    cx="160"
                    cy="90"
                    r="2.5"
                    fill="#1F6FDB"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
                />
            </svg>
        </>
    );
}

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Sign in" />

            <div className="flex min-h-screen">
                {/* Left side - Branding with SVG Illustration */}
                <div className="relative hidden w-1/2 overflow-hidden bg-linear-to-br from-[#0A3D91] to-[#041E4A] lg:flex lg:flex-col lg:justify-between lg:p-12">
                    {/* Ambient corner accents */}
                    <LeftPanelAccents />

                    <div className="relative z-10">
                        <div className="h-12 w-48 overflow-hidden">
                            <img src="/assets/images/kontrol-white-logo.png" alt="Kontrol" className="w-full -translate-y-8" />
                        </div>
                    </div>

                    {/* SVG Illustration */}
                    <div className="relative z-10 flex flex-1 items-center justify-center px-8">
                        <div className="h-80 w-80">
                            <GatewayIllustration />
                        </div>
                    </div>

                    <motion.div
                        className="relative z-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white">
                            Secure access,
                            <br />
                            simplified.
                        </h1>
                        <p className="max-w-sm text-base text-white/60">Control who enters your estate with confidence and clarity.</p>
                    </motion.div>

                    <div className="relative z-10 text-sm text-white/40">&copy; {new Date().getFullYear()} Kontrol. All rights reserved.</div>
                </div>

                {/* Right side - Login form */}
                <div className="relative flex w-full flex-col justify-center overflow-hidden bg-white px-8 lg:w-1/2 lg:px-24">
                    {/* Ambient corner accents */}
                    <RightPanelIllustration />

                    <div className="relative z-10 mx-auto w-full max-w-sm">
                        {/* Mobile logo - centered shield icon */}
                        <div className="mb-10 flex justify-center lg:hidden">
                            <img src="assets/images/icon.png" alt="Kontrol" className="h-20 w-20" />
                        </div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <h2 className="mb-2 text-3xl font-semibold text-gray-900">Welcome back</h2>
                            <p className="mb-8 text-gray-500">Sign in to your account to continue.</p>
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
                                    autoFocus
                                />
                                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex cursor-pointer items-center gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                    />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
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
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-4 text-gray-500">or</span>
                                </div>
                            </div>

                            {/* Google Sign-in */}
                            <a
                                href={SocialLoginController.redirectToGoogle.url()}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </a>

                            {/* Legal Links */}
                            <p className="mt-6 text-center text-xs text-gray-500">
                                By signing in, you agree to our{' '}
                                <a href="/terms" className="text-[#1F6FDB] hover:underline">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="/privacy" className="text-[#1F6FDB] hover:underline">
                                    Privacy Policy
                                </a>
                            </p>
                        </motion.form>
                    </div>
                </div>
            </div>
        </>
    );
}
