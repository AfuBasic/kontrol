import { Link, Head, useForm } from '@inertiajs/react';
import { 
    Check, 
    ArrowLeft, 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    FileText, 
    AlertCircle,
    Sun,
    Moon
} from 'lucide-react';
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
            }
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
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white">
            <Head>
                <title>Sign up your estate - Kontrol</title>
                <meta name="description" content="Sign up your gated estate or community with Kontrol to make gate operations simple." />
            </Head>

            {/* Top Simple Glass Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 cursor-pointer">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden dark:block h-8 w-auto" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block dark:hidden h-8 w-auto" />
                    </Link>
                    
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="rounded-lg p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <Link href="/" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Stage */}
            <main className="pt-32 pb-24 relative max-w-4xl mx-auto px-6">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4F46E5]/5 rounded-full filter blur-[120px] pointer-events-none"></div>

                <div className="text-center mb-10 flex flex-col gap-3">
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Sign up your estate</h1>
                    <p className="text-sm sm:text-base text-slate-650 dark:text-slate-400 max-w-xl mx-auto">
                        Fill in the details below. We will set up your gate security app and help get your residents registered.
                    </p>
                </div>

                {/* Main Card Container */}
                <div className="bg-slate-50/80 dark:bg-[#0f172a]/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl relative transition-colors duration-305">
                    {flash?.success || wasSuccessful ? (
                        /* Success Confirmation state */
                        <div className="flex flex-col items-center justify-center text-center py-12 gap-5">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Check className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Request sent</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                    Thank you! We have received your request and will get back to you soon.
                                </p>
                            </div>
                            <Link href="/" className="mt-4 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-250 dark:border-slate-805 transition-colors">
                                Back to home page
                            </Link>
                        </div>
                    ) : (
                        /* The Form */
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {/* Grid row 1: Estate Name & Contact Email */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="estate_name" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estate name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="text" 
                                            id="estate_name"
                                            value={data.estate_name}
                                            onChange={e => setData('estate_name', e.target.value)}
                                            placeholder="e.g. Oakwood Heights"
                                            className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]/60 focus:ring-1 focus:ring-[#4F46E5]/30 transition-colors"
                                            required
                                        />
                                    </div>
                                    {errors.estate_name && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.estate_name}</span>}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="email" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Contact email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="email" 
                                            id="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="e.g. manager@oakwood.com"
                                            className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]/60 focus:ring-1 focus:ring-[#4F46E5]/30 transition-colors"
                                            required
                                        />
                                    </div>
                                    {errors.email && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.email}</span>}
                                </div>
                            </div>

                            {/* Grid row 2: Contact Phone & Selected Plan */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="phone" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Contact phone</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="tel" 
                                            id="phone"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            placeholder="e.g. +234 803 123 4567"
                                            className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]/60 focus:ring-1 focus:ring-[#4F46E5]/30 transition-colors"
                                            required
                                        />
                                    </div>
                                    {errors.phone && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.phone}</span>}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="plan_id" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Select plan (Optional)</label>
                                    <div className="relative">
                                        <select 
                                            id="plan_id"
                                            value={data.plan_id}
                                            onChange={e => setData('plan_id', e.target.value)}
                                            className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#4F46E5]/60 transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="">General inquiry / No plan selected</option>
                                            {plans.map(p => (
                                                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                                    {p.name} ({formatInterval(p.billing_interval)})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                            <span className="text-[10px]">▼</span>
                                        </div>
                                    </div>
                                    {errors.plan_id && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.plan_id}</span>}
                                </div>
                            </div>

                            {/* Address Text Area */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="address" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estate address (Optional)</label>
                                <div className="relative">
                                    <div className="absolute top-3.5 left-3.5 text-slate-400 dark:text-slate-500">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <textarea 
                                        id="address"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        placeholder="e.g. Lekki Phase 1, Lagos, Nigeria"
                                        rows={3}
                                        className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]/60 transition-colors resize-none"
                                    />
                                </div>
                                {errors.address && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.address}</span>}
                            </div>

                            {/* Additional Notes Text Area */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="notes" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Additional notes (Optional)</label>
                                <div className="relative">
                                    <div className="absolute top-3.5 left-3.5 text-slate-400 dark:text-slate-500">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <textarea 
                                        id="notes"
                                        value={data.notes}
                                        onChange={e => setData('notes', e.target.value)}
                                        placeholder="Tell us about any special needs, the number of homes in your estate, or any questions you have."
                                        rows={4}
                                        className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#4F46E5]/60 transition-colors resize-none"
                                    />
                                </div>
                                {errors.notes && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.notes}</span>}
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                            >
                                {processing ? 'Sending...' : 'Send request'}
                            </button>
                        </form>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-[#010308] border-t border-slate-200 dark:border-slate-950 py-12 text-slate-500 text-xs">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden dark:block h-6 w-auto" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block dark:hidden h-6 w-auto" />
                        <span className="text-[10px] text-slate-550 dark:text-slate-600 font-medium">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Use</Link>
                        <Link href="/contact" className="hover:text-slate-700 dark:hover:text-slate-300">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

