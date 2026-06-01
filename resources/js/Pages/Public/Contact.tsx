import { Link, Head, useForm, usePage } from '@inertiajs/react';
import { Mail, Send, CheckCircle, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import React, { useEffect } from 'react';
import Header from '@/Components/Public/Header';
import type { SharedData } from '@/types';

export default function Contact() {
    const { props } = usePage<SharedData>();
    const { flash } = props;

    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    useEffect(() => {
        if (wasSuccessful || flash?.success) {
            reset();
        }
    }, [wasSuccessful, flash?.success, reset]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contact', {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-white pb-12 font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>Contact Support - Kontrol Gated Access</title>
                <meta
                    name="description"
                    content="Get in touch with the Kontrol support team for estate setups, guard terminal training, or technical assistance."
                />
            </Head>

            {/* Persistent Header */}
            <Header hideCta={false} />

            {/* Main Layout Grid */}
            <main className="mx-auto max-w-7xl px-6 pt-40 pb-20">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
                    {/* Left Column: Contact Cards & Copy */}
                    <div className="flex flex-col justify-start space-y-8 lg:col-span-5">
                        <div className="space-y-4">
                            <span className="font-mono text-xs font-bold tracking-widest text-[#FF7E67] uppercase">Connect With Us</span>
                            <h1 className="text-4xl leading-[1.1] font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                                How can we <br />
                                help your estate?
                            </h1>
                            <p className="max-w-md text-sm leading-relaxed font-medium text-slate-600 sm:text-base dark:text-slate-400">
                                Have questions about setting up Kontrol for your community, requesting training for gate security guards, or reporting
                                a technical issue? Send us a message and our team will assist you.
                            </p>
                        </div>

                        {/* Cards */}
                        <div className="space-y-4">
                            {/* Email Card */}
                            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 backdrop-blur-md dark:border-slate-900 dark:bg-[#0f172a]/20">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#5c54f2]">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">Email Address</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        <a href="mailto:support@usekontrol.com" className="hover:underline">
                                            support@usekontrol.com
                                        </a>
                                    </p>
                                </div>
                            </div>

                            {/* Phone Card */}
                            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 backdrop-blur-md dark:border-slate-900 dark:bg-[#0f172a]/20">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">Phone Call</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        <a href="tel:+2347036481189" className="hover:underline">
                                            +234 703 648 1189
                                        </a>
                                    </p>
                                </div>
                            </div>

                            {/* WhatsApp Card */}
                            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 backdrop-blur-md dark:border-slate-900 dark:bg-[#0f172a]/20">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <MessageCircle className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">WhatsApp Chat</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        <a href="https://wa.me/2347036481189" target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            Chat on WhatsApp
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form Container */}
                    <div className="lg:col-span-7">
                        <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl backdrop-blur-sm sm:p-10 dark:border-slate-900 dark:bg-[#080d1a]/50">
                            {/* Flash Success Notification */}
                            {flash?.success && (
                                <div className="animate-pulse-slow mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-800 dark:text-emerald-400">
                                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                    <div>
                                        <p className="font-extrabold">Message Sent Successfully</p>
                                        <p className="mt-0.5 text-xs font-medium opacity-90">{flash.success}</p>
                                    </div>
                                </div>
                            )}

                            {/* General Errors Banner */}
                            {Object.keys(errors).length > 0 && !flash?.success && (
                                <div className="text-rose-850 mb-6 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold dark:text-rose-400">
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                    <div>
                                        <p className="font-extrabold">Please correct the errors below</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Input */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`h-12 w-full rounded-xl border-2 bg-slate-50/50 px-4 text-sm font-semibold transition-all outline-none focus:border-[#4F46E5] focus:bg-white focus:ring-4 focus:ring-[#4F46E5]/10 dark:bg-[#020617]/50 dark:focus:bg-[#020617] ${
                                            errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-900'
                                        }`}
                                        placeholder="John Doe"
                                        required
                                    />
                                    {errors.name && <p className="text-xs font-semibold text-rose-500">{errors.name}</p>}
                                </div>

                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={`h-12 w-full rounded-xl border-2 bg-slate-50/50 px-4 text-sm font-semibold transition-all outline-none focus:border-[#4F46E5] focus:bg-white focus:ring-4 focus:ring-[#4F46E5]/10 dark:bg-[#020617]/50 dark:focus:bg-[#020617] ${
                                            errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-900'
                                        }`}
                                        placeholder="john@example.com"
                                        required
                                    />
                                    {errors.email && <p className="text-xs font-semibold text-rose-500">{errors.email}</p>}
                                </div>

                                {/* Subject Input */}
                                <div className="space-y-2">
                                    <label htmlFor="subject" className="block font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        className={`h-12 w-full rounded-xl border-2 bg-slate-50/50 px-4 text-sm font-semibold transition-all outline-none focus:border-[#4F46E5] focus:bg-white focus:ring-4 focus:ring-[#4F46E5]/10 dark:bg-[#020617]/50 dark:focus:bg-[#020617] ${
                                            errors.subject ? 'border-rose-500' : 'border-slate-200 dark:border-slate-900'
                                        }`}
                                        placeholder="Estate setup inquiry / general support"
                                        required
                                    />
                                    {errors.subject && <p className="text-xs font-semibold text-rose-500">{errors.subject}</p>}
                                </div>

                                {/* Message Textarea */}
                                <div className="space-y-2">
                                    <label htmlFor="message" className="block font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Your Message
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        className={`w-full resize-none rounded-xl border-2 bg-slate-50/50 p-4 text-sm font-semibold transition-all outline-none focus:border-[#4F46E5] focus:bg-white focus:ring-4 focus:ring-[#4F46E5]/10 dark:bg-[#020617]/50 dark:focus:bg-[#020617] ${
                                            errors.message ? 'border-rose-500' : 'border-slate-200 dark:border-slate-900'
                                        }`}
                                        placeholder="Hi Kontrol, I would like to set up access controls for my estate of 200 units..."
                                        required
                                    />
                                    {errors.message && <p className="text-xs font-semibold text-rose-500">{errors.message}</p>}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-xs font-extrabold tracking-widest text-white uppercase shadow-xl shadow-[#4F46E5]/20 transition-all hover:bg-[#5c54f2] active:scale-[0.98] disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                    {processing ? 'Sending Inquiry...' : 'Submit Form'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12 text-xs text-slate-500 dark:border-slate-900 dark:bg-[#020617]">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden h-6 w-auto dark:block" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block h-6 w-auto dark:hidden" />
                        <span className="text-slate-650 text-[10px] font-medium dark:text-slate-600">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Terms of Use
                        </Link>
                        <Link href="/contact" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
