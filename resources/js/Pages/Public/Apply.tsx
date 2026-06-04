import { Link, Head, useForm } from '@inertiajs/react';
import { Check, ArrowLeft, Building2, Mail, Phone, MapPin, FileText, AlertCircle, Sun, Moon } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface Plan {
    id: number;
    name: string;
    slug: string;
    price: number;
    billing_interval: 'quarterly' | 'semi-annually' | 'annually';
}

interface Props {
    plans: Plan[];
    flash?: {
        success: string | null;
    };
}

export default function Apply({ plans, flash }: Props) {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Get pre-selected plan from URL if any
    const getInitialPlanId = () => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const planId = urlParams.get('plan_id');
            if (planId) return planId;
        }
        return '';
    };

    const { data, setData, post, processing, errors, wasSuccessful, reset } = useForm({
        estate_name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        plan_id: getInitialPlanId(),
    });

    useEffect(() => {
        const currentTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
        setTheme(currentTheme);
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/apply', {
            onSuccess: () => {
                reset();
            },
        });
    };

    // Format interval names nicely
    const formatInterval = (interval: string) => {
        if (interval === 'quarterly') return 'Quarterly';
        if (interval === 'semi-annually') return 'Semi-Annually';
        if (interval === 'annually') return 'Annually';
        return interval;
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>Sign up your estate - Kontrol</title>
                <meta name="description" content="Sign up your gated estate or community with Kontrol to make gate operations simple." />
            </Head>

            {/* Top Simple Glass Header */}
            <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-xl dark:border-slate-900 dark:bg-[#020617]/70">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <Link href="/" className="inline-flex cursor-pointer items-center gap-2">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden h-8 w-auto dark:block" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block h-8 w-auto dark:hidden" />
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="cursor-pointer rounded-lg p-2 text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Stage */}
            <main className="relative mx-auto max-w-4xl px-6 pt-32 pb-24">
                <div className="pointer-events-none absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F46E5]/5 blur-[120px] filter"></div>

                <div className="mb-10 flex flex-col gap-3 text-center">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">Sign up your estate</h1>
                    <p className="text-slate-650 mx-auto max-w-xl text-sm sm:text-base dark:text-slate-400">
                        Fill in the details below. We will set up your gate security app and help get your residents registered.
                    </p>
                </div>

                {/* Main Card Container */}
                <div className="relative rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-2xl transition-colors duration-305 sm:p-10 dark:border-slate-900 dark:bg-[#0f172a]/20">
                    {flash?.success || wasSuccessful ? (
                        /* Success Confirmation state */
                        <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <Check className="h-8 w-8" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Request sent</h3>
                                <p className="mx-auto max-w-md text-sm text-slate-600 dark:text-slate-400">
                                    Thank you! We have received your request and will get back to you soon.
                                </p>
                            </div>
                            <Link
                                href="/"
                                className="text-slate-750 border-slate-250 dark:border-slate-805 mt-4 rounded-xl border bg-slate-100 px-6 py-3 text-xs font-bold transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Back to home page
                            </Link>
                        </div>
                    ) : (
                        /* The Form */
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {/* Grid row 1: Estate Name & Contact Email */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <label
                                        htmlFor="estate_name"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300"
                                    >
                                        Estate name
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            id="estate_name"
                                            value={data.estate_name}
                                            onChange={(e) => setData('estate_name', e.target.value)}
                                            placeholder="e.g. Oakwood Heights"
                                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#4F46E5]/60 focus:ring-1 focus:ring-[#4F46E5]/30 focus:outline-none dark:border-slate-900 dark:bg-[#020617] dark:text-slate-200 dark:placeholder-slate-600"
                                            required
                                        />
                                    </div>
                                    {errors.estate_name && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                            <AlertCircle className="h-3.5 w-3.5" /> {errors.estate_name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="email" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                        Contact email
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="e.g. manager@oakwood.com"
                                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#4F46E5]/60 focus:ring-1 focus:ring-[#4F46E5]/30 focus:outline-none dark:border-slate-900 dark:bg-[#020617] dark:text-slate-200 dark:placeholder-slate-600"
                                            required
                                        />
                                    </div>
                                    {errors.email && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                            <AlertCircle className="h-3.5 w-3.5" /> {errors.email}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Grid row 2: Contact Phone & Selected Plan */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="phone" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                        Contact phone
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="tel"
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="e.g. +234 803 123 4567"
                                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#4F46E5]/60 focus:ring-1 focus:ring-[#4F46E5]/30 focus:outline-none dark:border-slate-900 dark:bg-[#020617] dark:text-slate-200 dark:placeholder-slate-600"
                                            required
                                        />
                                    </div>
                                    {errors.phone && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                            <AlertCircle className="h-3.5 w-3.5" /> {errors.phone}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label
                                        htmlFor="plan_id"
                                        className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300"
                                    >
                                        Select plan (Optional)
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="plan_id"
                                            value={data.plan_id}
                                            onChange={(e) => setData('plan_id', e.target.value)}
                                            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 transition-colors focus:border-[#4F46E5]/60 focus:outline-none dark:border-slate-900 dark:bg-[#020617] dark:text-slate-200"
                                        >
                                            <option value="">General inquiry / No plan selected</option>
                                            {plans.map((p) => (
                                                <option
                                                    key={p.id}
                                                    value={p.id}
                                                    className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                                >
                                                    {p.name} ({formatInterval(p.billing_interval)})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                                            <span className="text-[10px]">▼</span>
                                        </div>
                                    </div>
                                    {errors.plan_id && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                            <AlertCircle className="h-3.5 w-3.5" /> {errors.plan_id}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Address Text Area */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="address" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                    Estate address (Optional)
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3.5 left-3.5 text-slate-400 dark:text-slate-500">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="e.g. Lekki Phase 1, Lagos, Nigeria"
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#4F46E5]/60 focus:outline-none dark:border-slate-900 dark:bg-[#020617] dark:text-slate-200 dark:placeholder-slate-600"
                                    />
                                </div>
                                {errors.address && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                        <AlertCircle className="h-3.5 w-3.5" /> {errors.address}
                                    </span>
                                )}
                            </div>

                            {/* Additional Notes Text Area */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="notes" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                    Additional notes (Optional)
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3.5 left-3.5 text-slate-400 dark:text-slate-500">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Tell us about any special needs, the number of homes in your estate, or any questions you have."
                                        rows={4}
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#4F46E5]/60 focus:outline-none dark:border-slate-900 dark:bg-[#020617] dark:text-slate-200 dark:placeholder-slate-600"
                                    />
                                </div>
                                {errors.notes && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                        <AlertCircle className="h-3.5 w-3.5" /> {errors.notes}
                                    </span>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7E67] py-4 text-sm font-extrabold text-white shadow-lg transition-all hover:bg-[#ff8f7a] disabled:opacity-50"
                            >
                                {processing ? 'Sending...' : 'Send request'}
                            </button>
                        </form>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12 text-xs text-slate-500 dark:border-slate-950 dark:bg-[#010308]">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden h-6 w-auto dark:block" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block h-6 w-auto dark:hidden" />
                        <span className="text-slate-550 text-[10px] font-medium dark:text-slate-600">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">
                            Terms of Use
                        </Link>
                        <Link href="/contact" className="hover:text-slate-700 dark:hover:text-slate-300">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
