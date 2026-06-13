import { Head, Link } from '@inertiajs/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Smartphone, Users, Bell, Clock, FileText, CheckCircle2, ChevronRight, Home as HomeIcon } from 'lucide-react';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';
import PublicLayout from '@/Layouts/PublicLayout';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

export default function Home() {
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 200]);

    return (
        <PublicLayout>
            <Head>
                <title>Modern Estate Access Control</title>
            </Head>

            {/* HERO SECTION */}
            <section className="relative min-h-[90vh] overflow-hidden pt-20">
                {/* Background Image (Light/Dark via CSS classes) */}
                <div className="absolute inset-0 z-0">
                    <motion.div style={{ y: yHero }} className="h-full w-full">
                        <img 
                            src="/assets/images/estate-light.png" 
                            alt="Aethewood Estate" 
                            className="h-full w-full object-cover dark:hidden" 
                        />
                        <img 
                            src="/assets/images/estate-dark.png" 
                            alt="Aethewood Estate Night" 
                            className="hidden h-full w-full object-cover dark:block" 
                        />
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] dark:bg-slate-950/60" />
                    </motion.div>
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="max-w-4xl rounded-3xl bg-white/40 p-8 backdrop-blur-xl dark:bg-slate-900/40 md:p-12"
                        >
                            <motion.h1 variants={fadeInUp} className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                                Everything Your Estate Needs, <br className="hidden sm:block" />
                                In One Place.
                            </motion.h1>
                            <motion.p variants={fadeInUp} className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
                                Manage visitors, payments, announcements, and resident complaints from one simple platform. Apply for your estate and try Kontrol before making any commitment.
                            </motion.p>
                            <motion.div variants={fadeInUp} className="mt-10 flex items-center justify-center gap-x-6">
                                <Link
                                    href="/apply"
                                    className="rounded-xl bg-blue-600 px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30"
                                >
                                    Bring Kontrol To Your Estate
                                </Link>
                                <a href={LoginController.show.url()} className="text-base font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                                    Sign In <span aria-hidden="true">→</span>
                                </a>
                            </motion.div>
                        </motion.div>

                        {/* Floating Activity Cards */}
                        <div className="absolute left-10 top-1/3 hidden md:block">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur-md dark:bg-slate-900/80"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Visitor Arrived</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Just now</p>
                                </div>
                            </motion.div>
                        </div>
                        
                        <div className="absolute right-10 bottom-1/3 hidden md:block">
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-xl backdrop-blur-md dark:bg-slate-900/80"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Estate Due Paid</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">2 mins ago</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* THE PROBLEM SECTION */}
            <section className="bg-slate-50 py-24 sm:py-32 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                        >
                            Most Estates Still Run On Calls, Chats, And Paper.
                        </motion.h2>
                    </div>
                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3"
                    >
                        {[
                            { icon: Smartphone, title: 'Visitor approvals through phone calls' },
                            { icon: FileText, title: 'Manual visitor logs' },
                            { icon: Users, title: 'Scattered WhatsApp groups' },
                            { icon: Bell, title: 'Missed announcements' },
                            { icon: Clock, title: 'Untracked resident complaints' },
                            { icon: ShieldCheck, title: 'Difficult collection processes' },
                        ].map((item, index) => (
                            <motion.div 
                                key={index} 
                                variants={fadeInUp}
                                className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md dark:bg-slate-900 dark:ring-slate-800"
                            >
                                <item.icon className="mb-4 h-8 w-8 text-slate-400 dark:text-slate-500" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{item.title}</h3>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FEATURE SHOWCASE */}
            <section className="py-24 sm:py-32 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="space-y-24">
                        {[
                            { title: 'Manage Visitors', desc: 'Generate visitor passes and know when guests arrive.', reverse: false },
                            { title: 'Collect Estate Dues', desc: 'Keep community payments organized and transparent.', reverse: true },
                            { title: 'Send Announcements', desc: 'Keep residents informed about important updates.', reverse: false },
                            { title: 'Track Resident Complaints', desc: 'Residents can report issues while management tracks progress.', reverse: true },
                        ].map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className={`flex flex-col gap-12 lg:flex-row lg:items-center ${feature.reverse ? 'lg:flex-row-reverse' : ''}`}
                            >
                                <div className="lg:w-1/2">
                                    <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{feature.title}</h3>
                                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{feature.desc}</p>
                                </div>
                                <div className="lg:w-1/2">
                                    <div className="aspect-[4/3] rounded-2xl bg-slate-100 p-2 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                        <div className="h-full w-full rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center">
                                            <span className="text-slate-400 dark:text-slate-500">Screenshot Placeholder</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* A DAY WITH KONTROL */}
            <section className="bg-slate-50 py-24 sm:py-32 dark:bg-slate-950">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">A Day With Kontrol</h2>
                    </div>
                    <div className="space-y-8">
                        {[
                            { time: 'Morning', event: 'Visitor pass generated.' },
                            { time: 'Midday', event: 'Guest arrives.' },
                            { time: 'Afternoon', event: 'Announcement sent.' },
                            { time: 'Evening', event: 'Complaint reported.' },
                            { time: 'Shortly After', event: 'Complaint acknowledged.' },
                        ].map((item, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex gap-6 items-center"
                            >
                                <div className="w-32 flex-shrink-0 text-right">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{item.time}</span>
                                </div>
                                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                                </div>
                                <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">{item.event}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHO IT'S FOR */}
            <section className="py-24 sm:py-32 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Who It's For</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {['Residents', 'Property Owners', 'Estate Managers', 'Security Teams'].map((role, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="rounded-2xl bg-slate-50 p-8 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700"
                            >
                                <HomeIcon className="mb-4 h-8 w-8 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-xl font-medium text-slate-900 dark:text-white">{role}</h3>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FREE TRIAL */}
            <section className="bg-blue-600 py-24 sm:py-32 dark:bg-blue-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Try Kontrol In Your Estate First.</h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg text-blue-100">
                        We'll help you set it up and your community can test it before making any commitment.
                    </p>
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                        <div className="flex flex-col items-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white font-bold text-lg">1</span>
                            <span className="mt-4 text-white font-medium">Apply</span>
                        </div>
                        <ChevronRight className="hidden sm:block h-6 w-6 text-blue-300" />
                        <div className="flex flex-col items-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white font-bold text-lg">2</span>
                            <span className="mt-4 text-white font-medium">Get Approved</span>
                        </div>
                        <ChevronRight className="hidden sm:block h-6 w-6 text-blue-300" />
                        <div className="flex flex-col items-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white font-bold text-lg">3</span>
                            <span className="mt-4 text-white font-medium">Start Your Trial</span>
                        </div>
                    </div>
                    <div className="mt-12">
                        <Link
                            href="/apply"
                            className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-sm transition-all hover:bg-slate-50 hover:scale-105"
                        >
                            Apply Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section className="py-24 sm:py-32 bg-white dark:bg-slate-900" id="pricing">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Simple Pricing</h2>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">One platform for your entire community.</p>
                    </div>
                    
                    <div className="mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-3">
                        {/* Quarterly */}
                        <div className="rounded-3xl p-8 ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Quarterly</h3>
                            <p className="mt-4 flex items-baseline gap-x-2">
                                <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">₦15,000</span>
                            </p>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Per Resident<br/>Per Quarter</p>
                            <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Visitor Management</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Estate Payments</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Announcements</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Resident Complaints</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Platform Updates</li>
                            </ul>
                        </div>

                        {/* Semi-Annual */}
                        <div className="rounded-3xl p-8 ring-2 ring-blue-600 bg-slate-50 dark:bg-slate-800 relative">
                            <span className="absolute -top-4 right-8 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold leading-5 text-white">Most Popular</span>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Semi-Annual</h3>
                            <p className="mt-4 flex items-baseline gap-x-2">
                                <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">₦27,000</span>
                            </p>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Per Resident<br/>Every 6 Months</p>
                            <div className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Save 10%</div>
                            <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Visitor Management</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Estate Payments</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Announcements</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Resident Complaints</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Platform Updates</li>
                            </ul>
                        </div>

                        {/* Annual */}
                        <div className="rounded-3xl p-8 ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Annual</h3>
                            <p className="mt-4 flex items-baseline gap-x-2">
                                <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">₦48,000</span>
                            </p>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Per Resident<br/>Per Year</p>
                            <div className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Save 20% - Best Value</div>
                            <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Visitor Management</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Estate Payments</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Announcements</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Resident Complaints</li>
                                <li className="flex gap-x-3"><CheckCircle2 className="h-6 w-5 flex-none text-blue-600" /> Platform Updates</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
