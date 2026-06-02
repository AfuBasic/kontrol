import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import SocialLoginController from '@/actions/App/Http/Controllers/Auth/SocialLoginController';
import AuthErrorSheet from '@/Components/AuthErrorSheet';
import Toast from '@/Components/Toast';

interface LoginFlash {
    success?: string;
    error?: string;
}

export default function Login() {
    const page = usePage<{ flash: LoginFlash }>();
    const { flash } = page.props;
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [googleError, setGoogleError] = useState('');
    const [showGoogleError, setShowGoogleError] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const [loginError, setLoginError] = useState<string | null>(null);

    // Sync external errors to local state
    useEffect(() => {
        const extError = flash?.error || errors?.email || null;
        if (extError) {
            setLoginError(extError);
        }
    }, [flash?.error, errors?.email]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoginError(null);
        clearErrors();
        post('/login');
    }

    async function handleGoogleSignIn() {
        if (!Capacitor.isNativePlatform()) {
            // Web flow: Use standard Laravel Socialite redirect
            window.location.href = '/auth/google';
            return;
        }

        setGoogleLoading(true);
        setGoogleError('');

        try {
            // Force sign out first to clear any ghost sessions/partially logged in states
            await FirebaseAuthentication.signOut().catch(() => {});

            const result = await FirebaseAuthentication.signInWithGoogle({
                useCredentialManager: false,
            });

            const idToken = result.credential?.idToken;

            if (idToken) {
                router.post(
                    SocialLoginController.handleGoogleMobileToken.url(),
                    { token: idToken },
                    {
                        onFinish: () => setGoogleLoading(false),
                        onError: (errs) => {
                            console.error('Google Backend Errors:', errs);
                            setGoogleLoading(false);
                        },
                    },
                );
            } else {
                setGoogleLoading(false);
                throw new Error('No ID token returned from Google sign-in');
            }
        } catch (err: unknown) {
            let errorMessage = 'Google sign-in failed. Please try again.';
            let errorStr = '';

            if (err instanceof Error) {
                errorMessage = err.message;
                errorStr = err.toString();
            } else if (typeof err === 'object' && err !== null) {
                if ('message' in err) {
                    errorMessage = String((err as Record<string, unknown>).message);
                }
                errorStr = JSON.stringify(err);
            } else if (typeof err === 'string') {
                errorMessage = err;
                errorStr = err;
            }

            if (
                errorStr.includes('cancelled') ||
                errorStr.includes('cancelled_by_user') ||
                errorStr.includes('DEVELOPER_ERROR') ||
                errorStr.includes('user_cancelled')
            ) {
                setGoogleLoading(false);
                return;
            }

            if (errorStr.includes('network') || errorStr.includes('timeout')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            setGoogleError(errorMessage);
            setShowGoogleError(true);
            setGoogleLoading(false);
        }
    }

    return (
        <>
            <Head title="Sign in" />

            <div className="min-h-screen bg-white lg:flex">
                {/* Branded panel — full-width hero on mobile, left side on desktop */}
                <div className="relative overflow-hidden bg-slate-950 lg:flex lg:w-1/2 lg:flex-col">
                    <div className="absolute inset-0">
                        <div className="absolute -top-24 -right-16 h-[420px] w-[420px] rounded-full bg-linear-to-br from-primary-500/40 via-indigo-500/25 to-transparent blur-[100px] lg:-top-32 lg:-right-24 lg:h-[520px] lg:w-[520px] lg:blur-[120px]" />
                        <div className="absolute -bottom-28 -left-16 h-[360px] w-[360px] rounded-full bg-linear-to-tr from-indigo-500/30 via-primary-500/15 to-transparent blur-[90px] lg:-bottom-24 lg:-left-24 lg:h-[420px] lg:w-[420px] lg:blur-[100px]" />
                        <div
                            className="absolute inset-0 opacity-[0.15] lg:opacity-[0.08]"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                                backgroundSize: '28px 28px',
                            }}
                        />
                    </div>

                    <div className="relative z-10 flex flex-1 flex-col px-6 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-24 sm:px-8 lg:p-12">
                        {/* Logo */}
                        <Link href="/" className="inline-flex items-center gap-2.5">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-10 w-10 rounded-xl lg:h-9 lg:w-9" />
                            <span className="text-xl font-semibold tracking-tight text-white lg:text-lg">Kontrol</span>
                        </Link>

                        {/* Mobile welcome heading (desktop has it in the form) */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mt-12 lg:hidden"
                        >
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-300 backdrop-blur">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Estate access, simplified
                            </span>
                            <h1 className="mt-4 text-[2rem] leading-tight font-semibold tracking-tight text-white">Welcome back.</h1>
                            <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-slate-400">
                                Sign in to manage visitor codes, residents, and gate activity across your estate.
                            </p>
                        </motion.div>

                        {/* Desktop: product mock */}
                        <div className="hidden flex-1 items-center justify-center py-12 lg:flex">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="w-full max-w-sm"
                            >
                                <AccessCodePreview />
                            </motion.div>
                        </div>

                        {/* Desktop: tagline */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                            className="hidden max-w-md lg:block"
                        >
                            <h2 className="text-2xl font-semibold tracking-tight text-white">Access control your residents actually use.</h2>
                            <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                Residents generate visitor codes in seconds. Security validates them at the gate. Admins see every entry as it
                                happens.
                            </p>
                        </motion.div>

                        <p className="mt-10 hidden text-xs text-slate-500 lg:block">
                            &copy; {new Date().getFullYear()} Kontrol. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* Form panel — floating card on mobile, side panel on desktop */}
                <div className="relative -mt-12 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pt-8 pb-10 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.35)] sm:px-10 sm:pt-10 lg:mt-0 lg:w-1/2 lg:justify-center lg:rounded-none lg:px-16 lg:py-12 lg:shadow-none xl:px-24">
                    <div className="mx-auto w-full max-w-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="hidden lg:block"
                        >
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
                            <p className="mt-2 text-sm text-slate-500">Sign in to manage your estate.</p>
                        </motion.div>

                        {flash?.success && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 lg:mt-6"
                            >
                                {flash.success}
                            </motion.div>
                        )}

                        {loginError && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 lg:mt-6 lg:block"
                            >
                                {loginError}
                            </motion.div>
                        )}

                        <AuthErrorSheet
                            error={loginError}
                            onClose={() => {
                                setLoginError(null);
                                clearErrors();
                                if (page.props.flash) {
                                    page.props.flash.error = undefined;
                                }
                            }}
                        />

                        <motion.form
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            onSubmit={submit}
                            className="space-y-5 lg:mt-8"
                        >
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                                        Password
                                    </label>
                                    <Link
                                        href="/forgot-password"
                                        university-logo-link="true"
                                        className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <label className="flex cursor-pointer items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-slate-600">Keep me signed in</span>
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </button>

                            <div className="relative py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-3 text-xs font-medium tracking-wide text-slate-400 uppercase">or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-900/5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {googleLoading ? (
                                    <Spinner />
                                ) : (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                                )}
                                {googleLoading ? 'Signing in...' : 'Continue with Google'}
                            </button>
                        </motion.form>

                        <p className="mt-8 text-center text-xs text-slate-500">
                            By signing in, you agree to our{' '}
                            <a href="/terms" className="font-medium text-slate-700 hover:text-slate-900">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy" className="font-medium text-slate-700 hover:text-slate-900">
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>

            <Toast show={showGoogleError} message={googleError} type="error" onClose={() => setShowGoogleError(false)} />
        </>
    );
}

function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

function AccessCodePreview() {
    return (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-700 text-white">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[11px] font-medium text-slate-400">Visitor access code</p>
                        <p className="text-sm font-semibold text-white">For Chidi, driver</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30 ring-inset">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                </span>
            </div>

            <div className="mt-5 rounded-2xl bg-linear-to-br from-white to-slate-100 p-5 text-center">
                <p className="text-[11px] font-medium tracking-[0.2em] text-slate-500 uppercase">Show at gate</p>
                <p className="mt-1.5 font-mono text-3xl font-bold tracking-[0.35em] text-slate-900 blur-md select-none" aria-hidden="true">
                    K7M2XQ
                </p>
                <p className="mt-2 text-xs text-slate-500">Expires in 2h 14m · Single use</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/5 py-2.5 ring-1 ring-white/10 ring-inset">
                    <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Visitor</p>
                    <p className="text-xs font-semibold text-white">Musa</p>
                </div>
                <div className="rounded-xl bg-white/5 py-2.5 ring-1 ring-white/10 ring-inset">
                    <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Arrives</p>
                    <p className="text-xs font-semibold text-white">Today</p>
                </div>
                <div className="rounded-xl bg-white/5 py-2.5 ring-1 ring-white/10 ring-inset">
                    <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Vehicle</p>
                    <p className="text-xs font-semibold text-white">LAG-284</p>
                </div>
            </div>
        </div>
    );
}
