import { Head, usePage } from '@inertiajs/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

export default function Support() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        message: '',
    });

    const { flash } = usePage().props as unknown as { flash: { success?: string } };

    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });

    const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
    const opacityHero = useTransform(scrollYProgress, [0, 1], [1, 0]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/support', {
            onSuccess: () => reset(),
        });
    };

    return (
        <PublicLayout>
            <Head>
                <title>Support - Kontrol</title>
            </Head>

            {/* Parallax Hero Section */}
            <section ref={heroRef} className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-slate-950 pt-24 pb-16">
                <div className="absolute inset-0 z-0">
                    <motion.div style={{ y: yBg }} className="absolute -inset-y-16 inset-x-0">
                        <img 
                            src="/assets/images/premium-estate-hero.png" 
                            alt="Estate Support" 
                            className="h-full w-full object-cover opacity-50 mix-blend-overlay" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
                    </motion.div>
                </div>

                <motion.div 
                    style={{ opacity: opacityHero }}
                    className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8"
                >
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl drop-shadow-md"
                    >
                        How Can We Help?
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mt-6 text-xl leading-8 text-slate-300 drop-shadow-sm font-medium"
                    >
                        Our team is here to assist you with any questions about setting up or managing your estate.
                    </motion.p>
                </motion.div>
            </section>

            {/* Support Content Section */}
            <div className="bg-slate-50 py-24 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl">
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-1 gap-8 sm:grid-cols-2 mb-16"
                        >
                            <div className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
                                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="mt-6 font-bold text-slate-900 dark:text-white text-xl">Email Us</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">support@usekontrol.com</p>
                            </div>
                            <div className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/30">
                                    <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="mt-6 font-bold text-slate-900 dark:text-white text-xl">WhatsApp</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">+234 703 648 1189</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800 sm:p-12"
                        >
                            {flash?.success ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Message Sent!</h3>
                                    <p className="text-lg text-slate-600 dark:text-slate-400">
                                        {flash.success}
                                    </p>
                                </motion.div>
                            ) : (
                                <form onSubmit={submit} className="space-y-8" noValidate>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6`}
                                            placeholder="John Doe"
                                        />
                                        {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-300 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.email ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6`}
                                            placeholder="you@example.com"
                                        />
                                        {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-300 mb-2">How can we help?</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={5}
                                            value={data.message}
                                            onChange={e => setData('message', e.target.value)}
                                            className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.message ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6`}
                                            placeholder="Tell us what you need..."
                                        ></textarea>
                                        {errors.message && <p className="mt-2 text-sm text-red-500">{errors.message}</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="block w-full rounded-xl bg-blue-600 px-4 py-4 text-center text-base font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-600/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
