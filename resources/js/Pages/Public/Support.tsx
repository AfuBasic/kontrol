import { Head, usePage } from '@inertiajs/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

export default function Support() {
    const { data, setData, post, processing, errors, reset, setError, clearErrors } = useForm({
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

        clearErrors();
        let hasErrors = false;

        if (!data.name.trim()) {
            setError('name', 'Full name is required');
            hasErrors = true;
        }

        if (!data.email.trim() || !/^\S+@\S+\.\S+$/.test(data.email)) {
            setError('email', 'A valid email address is required');
            hasErrors = true;
        }

        if (!data.message.trim() || data.message.length < 10) {
            setError('message', 'Message must be at least 10 characters long');
            hasErrors = true;
        }

        if (hasErrors) return;

        post('/support', {
            preserveScroll: true,
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
                    <motion.div style={{ y: yBg }} className="absolute inset-x-0 -inset-y-16">
                        <img
                            src="/assets/images/premium-estate-hero.png"
                            alt="Estate Support"
                            className="h-full w-full object-cover opacity-50 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
                    </motion.div>
                </div>

                <motion.div style={{ opacity: opacityHero }} className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-6xl"
                    >
                        How Can We Help?
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mt-6 text-xl leading-8 font-medium text-slate-300 drop-shadow-sm"
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
                            className="mb-16 grid grid-cols-1 gap-8 sm:grid-cols-2"
                        >
                            <a
                                href="mailto:support@usekontrol.com"
                                className="group rounded-3xl bg-white p-8 text-center shadow-xl ring-1 shadow-slate-200/50 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900 dark:shadow-none dark:ring-slate-800 dark:hover:ring-blue-500/50"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 transition-colors group-hover:bg-blue-100 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50">
                                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">Email Us</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">support@usekontrol.com</p>
                            </a>
                            <a
                                href="https://wa.me/2347036481189"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group rounded-3xl bg-white p-8 text-center shadow-xl ring-1 shadow-slate-200/50 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900 dark:shadow-none dark:ring-slate-800 dark:hover:ring-green-500/50"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 transition-colors group-hover:bg-green-100 dark:bg-green-900/30 dark:group-hover:bg-green-900/50">
                                    <svg className="h-8 w-8 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.031 0C5.385 0 .002 5.385.002 12.032c0 2.124.553 4.195 1.603 6.015L.053 24l6.141-1.611a12.035 12.035 0 005.837 1.503c6.645 0 12.029-5.385 12.029-12.033C24.06 5.385 18.675 0 12.031 0zm0 22.016c-1.8 0-3.56-.484-5.11-1.403l-.366-.217-3.799.996.996-3.799-.217-.366A9.988 9.988 0 012.017 12.03c0-5.526 4.498-10.025 10.024-10.025 5.527 0 10.025 4.499 10.025 10.025 0 5.527-4.498 10.025-10.025 10.025zm5.508-7.514c-.302-.151-1.787-.881-2.064-.982-.277-.101-.478-.151-.679.151-.201.302-.781.982-.958 1.183-.176.201-.353.226-.655.075-.302-.151-1.275-.471-2.428-1.503-.896-.803-1.501-1.796-1.678-2.098-.176-.302-.019-.465.132-.616.136-.136.302-.353.453-.529.151-.176.201-.302.302-.503.101-.201.05-.378-.025-.529-.075-.151-.679-1.637-.931-2.241-.245-.589-.494-.509-.679-.518-.176-.008-.378-.008-.579-.008-.201 0-.529.075-.805.378-.277.302-1.057 1.032-1.057 2.517 0 1.485 1.082 2.92 1.233 3.121.151.201 2.128 3.248 5.155 4.555.719.31 1.28.495 1.718.634.721.229 1.378.196 1.896.119.58-.087 1.787-.73 2.039-1.436.252-.705.252-1.309.176-1.436-.075-.127-.277-.202-.579-.353z" />
                                    </svg>
                                </div>
                                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">WhatsApp</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">+234 703 648 1189</p>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="rounded-3xl bg-white p-8 shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100 sm:p-12 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800"
                        >
                            {flash?.success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">Message Sent!</h3>
                                    <p className="text-lg text-slate-600 dark:text-slate-400">{flash.success}</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={submit} className="space-y-8" noValidate>
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300"
                                        >
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700`}
                                            placeholder="John Doe"
                                        />
                                        {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300"
                                        >
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.email ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700`}
                                            placeholder="you@example.com"
                                        />
                                        {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="message"
                                            className="mb-2 block text-sm leading-6 font-semibold text-slate-900 dark:text-slate-300"
                                        >
                                            How can we help?
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={5}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className={`block w-full rounded-xl border-0 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ${errors.message ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-blue-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700`}
                                            placeholder="Tell us what you need..."
                                        ></textarea>
                                        {errors.message && <p className="mt-2 text-sm text-red-500">{errors.message}</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="block w-full rounded-xl bg-blue-600 px-4 py-4 text-center text-base font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-600/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
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
