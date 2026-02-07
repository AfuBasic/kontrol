import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ApplicationModal from '@/components/Public/ApplicationModal';
import PublicLayout from '@/layouts/PublicLayout';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';

// Icon components
function ShieldIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
        </svg>
    );
}

function QrCodeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
            />
        </svg>
    );
}

function BoltIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
    );
}

function BellIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
        </svg>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
        </svg>
    );
}

function ClipboardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
        </svg>
    );
}

function DevicePhoneMobileIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            />
        </svg>
    );
}

function LockClosedIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
        </svg>
    );
}

function ChatBubbleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
        </svg>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function PhoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
        </svg>
    );
}

function DocumentTextIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
        </svg>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function ExclamationTriangleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
        </svg>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
    );
}

function HeartHandshakeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
        </svg>
    );
}

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const problemPoints = [
    {
        icon: PhoneIcon,
        title: 'Constant phone calls',
        description: 'Calling security every time a visitor arrives',
    },
    {
        icon: DocumentTextIcon,
        title: 'Paper-based logs',
        description: 'Visitor logs that get lost or damaged',
    },
    {
        icon: ClockIcon,
        title: 'Long wait times',
        description: 'Delays at the gate frustrate everyone',
    },
    {
        icon: ExclamationTriangleIcon,
        title: 'No accountability',
        description: 'No way to track who entered and when',
    },
];

const features = [
    {
        icon: QrCodeIcon,
        title: 'Instant Access Codes',
        description: 'Generate secure, time-limited access codes for visitors in seconds.',
    },
    {
        icon: BoltIcon,
        title: 'Real-time Validation',
        description: 'Security validates codes instantly at the gate. No delays.',
    },
    {
        icon: UsersIcon,
        title: 'Role-based Access',
        description: 'Separate apps for residents, security, and admins.',
    },
    {
        icon: ClipboardIcon,
        title: 'Estate Announcements',
        description: 'Keep everyone informed with estate-wide updates.',
    },
    {
        icon: BellIcon,
        title: 'Smart Notifications',
        description: 'Get notified when visitors arrive at the gate.',
    },
    {
        icon: ChatBubbleIcon,
        title: 'Telegram Integration',
        description: 'Receive codes directly in your Telegram chat.',
    },
    {
        icon: DevicePhoneMobileIcon,
        title: 'Works Offline',
        description: 'Install as a PWA on any device.',
    },
    {
        icon: LockClosedIcon,
        title: 'Privacy First',
        description: 'Minimal data collection, full audit logs.',
    },
];

const solutionFeatures = [
    {
        icon: QrCodeIcon,
        title: 'Digital Access Codes',
        description: 'Generate unique codes that expire automatically after use or time limit.',
    },
    {
        icon: BoltIcon,
        title: 'Instant Validation',
        description: 'Security validates codes in seconds. No waiting, no confusion.',
    },
    {
        icon: BellIcon,
        title: 'Real-time Notifications',
        description: 'Get notified the moment your visitor arrives at the gate.',
    },
    {
        icon: ChatBubbleIcon,
        title: 'Telegram Bot',
        description: 'Manage codes and updates directly in your Telegram chat.',
    },
    {
        icon: DevicePhoneMobileIcon,
        title: 'PWA App',
        description: 'Install on any device. Faster access for when you need it.',
    },
    {
        icon: ShieldIcon,
        title: 'Complete Audit Trail',
        description: 'Track every entry with detailed logs for security.',
    },
];

const steps = [
    {
        step: '01',
        title: 'Apply for access',
        description: 'Submit your estate details. We review every application personally.',
    },
    {
        step: '02',
        title: 'We reach out',
        description: 'Our team contacts you to understand your needs and schedule setup.',
    },
    {
        step: '03',
        title: 'Get set up',
        description: 'We help you onboard residents and security personnel.',
    },
    {
        step: '04',
        title: 'Go live',
        description: 'Start generating access codes and securing your estate.',
    },
];

const trustPoints = [
    'End-to-end encryption for all data',
    'Privacy-first design principles',
    'Minimal data collection policy',
    'Complete audit trail for all actions',
    'Google OAuth for secure authentication',
    'Regular security assessments',
];

const whyApplyPoints = [
    {
        title: 'Quality assurance',
        description: 'We personally verify each estate to maintain platform quality.',
    },
    {
        title: 'Dedicated support',
        description: 'Our team helps you set up and onboard your estate.',
    },
    {
        title: 'Completely free',
        description: 'No payment or fees will ever be requested during signup.',
    },
    {
        title: 'Personal touch',
        description: 'We reach out to understand your specific needs.',
    },
];

export default function Landing() {
    const [modalOpen, setModalOpen] = useState(false);

    // Sync modal state with URL hash
    useEffect(() => {
        // Check hash on mount
        if (window.location.hash === '#apply') {
            setModalOpen(true);
        }

        // Listen for hash changes
        function handleHashChange() {
            setModalOpen(window.location.hash === '#apply');
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    function openModal() {
        window.location.hash = 'apply';
        setModalOpen(true);
    }

    function closeModal() {
        // Remove hash without scrolling
        history.pushState('', document.title, window.location.pathname + window.location.search);
        setModalOpen(false);
    }

    return (
        <PublicLayout>
            <Head title="Kontrol - Modern Estate Access Control">
                {/* Primary Meta Tags */}
                <meta
                    name="description"
                    content="Kontrol is the modern estate access management platform. Generate digital access codes for visitors, validate instantly at the gate, and track every entry with complete audit trails."
                />
                <meta
                    name="keywords"
                    content="estate access control, visitor management, gate access, digital access codes, estate security, residential security, gated community, access management, Nigeria, Africa"
                />
                <meta name="author" content="Kontrol" />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://usekontrol.com/" />
                <meta property="og:title" content="Kontrol - Modern Estate Access Control" />
                <meta
                    property="og:description"
                    content="Replace outdated phone calls and paper logs with instant digital access codes. Security validates visitors in seconds, not minutes."
                />
                <meta property="og:image" content="https://usekontrol.com/assets/images/og-image.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="Kontrol - Estate Access Reimagined" />
                <meta property="og:site_name" content="Kontrol" />
                <meta property="og:locale" content="en_US" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://usekontrol.com/" />
                <meta name="twitter:title" content="Kontrol - Modern Estate Access Control" />
                <meta
                    name="twitter:description"
                    content="Replace outdated phone calls and paper logs with instant digital access codes. Security validates visitors in seconds, not minutes."
                />
                <meta name="twitter:image" content="https://usekontrol.com/assets/images/og-image.png" />
                <meta name="twitter:image:alt" content="Kontrol - Estate Access Reimagined" />

                {/* Additional Meta Tags */}
                <meta name="application-name" content="Kontrol" />
                <meta name="apple-mobile-web-app-title" content="Kontrol" />
                <meta name="theme-color" content="#0f172a" />
                <meta name="msapplication-TileColor" content="#0f172a" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://usekontrol.com/" />
            </Head>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-linear-to-b from-slate-50 via-white to-slate-50/50">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-linear-to-br from-blue-100/60 to-indigo-100/60 blur-3xl"
                    />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.3 }}
                        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-linear-to-tr from-slate-100/80 to-blue-100/60 blur-3xl"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f910_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f910_1px,transparent_1px)] bg-size-[4rem_4rem]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 lg:px-8 lg:pt-28 lg:pb-36">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="mx-auto max-w-4xl text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-medium text-emerald-700 backdrop-blur-sm"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                            <span>100% Free, No payment ever required</span>
                        </motion.div>

                        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                            <span className="block">Estate Access</span>
                            <span className="mt-2 block bg-linear-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                Reimagined
                            </span>
                        </h1>

                        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                            Replace outdated phone calls and paper logs with instant digital access codes. Security validates visitors in seconds, not
                            minutes.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                        >
                            <button
                                onClick={openModal}
                                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-slate-900/10 transition-all duration-300 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20 sm:w-auto"
                            >
                                Apply for Access
                                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </button>
                            <a
                                href={LoginController.show.url()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-8 py-4 text-base font-semibold text-slate-700 backdrop-blur-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                            >
                                Sign In
                            </a>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Why Apply Section - NEW */}
            <section className="relative overflow-hidden bg-white py-20 lg:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25"
                        >
                            <HeartHandshakeIcon className="h-8 w-8 text-white" />
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-slate-900 sm:text-4xl">
                            Why we review applications
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-4 text-lg leading-relaxed text-slate-600">
                            Kontrol is currently onboarding estates personally to ensure quality and security. Submit your details and we'll reach out
                            to get you started.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2"
                    >
                        {whyApplyPoints.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-6"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                    <CheckCircleIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="mt-10 text-center"
                    >
                        <button
                            onClick={openModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800"
                        >
                            Apply for Access
                            <ArrowRightIcon className="h-4 w-4" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="relative overflow-hidden bg-slate-900 py-24 lg:py-32">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem]" />
                <div className="absolute inset-0 bg-linear-to-b from-slate-900/0 via-slate-900 to-slate-900/0" />

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400"
                        >
                            The Problem
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                            Gate access is stuck in the past
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-6 text-lg leading-relaxed text-slate-400">
                            Every day, residents and security personnel waste time with outdated processes that create frustration and security gaps.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {problemPoints.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-linear-to-b from-slate-800/80 to-slate-800/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:bg-slate-800/60"
                            >
                                <div className="mb-4 inline-flex rounded-xl bg-red-500/10 p-3 text-red-400 transition-colors duration-300 group-hover:bg-red-500/20">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Solution Section */}
            <section className="relative overflow-hidden py-24 lg:py-32">
                {/* Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-blue-50/80 to-indigo-50/80 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700"
                        >
                            The Solution
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
                            Access control, simplified
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-6 text-lg leading-relaxed text-slate-600">
                            Kontrol replaces phone calls and paper logs with a seamless digital experience. Generate codes, validate instantly, track
                            everything.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {solutionFeatures.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50"
                            >
                                <div className="mb-5 inline-flex rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 p-3.5 text-white shadow-lg shadow-blue-500/25 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/30">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative overflow-hidden bg-slate-50 py-24 lg:py-32">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f010_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f010_1px,transparent_1px)] bg-size-[4rem_4rem]" />

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
                        >
                            Features
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
                            Everything you need
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-6 text-lg leading-relaxed text-slate-600">
                            A complete platform for modern estate access management.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                            >
                                <div className="mb-4 inline-flex rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 p-3 text-white shadow-lg shadow-blue-500/25">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 lg:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
                        >
                            How It Works
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
                            Four simple steps
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-6 text-lg leading-relaxed text-slate-600">
                            From application to live in days, not weeks.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-20 max-w-5xl"
                    >
                        <div className="grid gap-12 lg:grid-cols-4 lg:gap-8">
                            {steps.map((step, index) => (
                                <motion.div key={index} variants={fadeInUp} className="relative text-center">
                                    {index < steps.length - 1 && (
                                        <div className="absolute top-10 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] bg-linear-to-r from-blue-300 via-blue-200 to-blue-100 lg:block" />
                                    )}
                                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-xl shadow-blue-500/25">
                                        {step.step}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Trust & Security Section */}
            <section className="relative overflow-hidden bg-linear-to-b from-slate-900 to-slate-800 py-24 lg:py-32">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem]" />

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm"
                        >
                            <ShieldIcon className="h-10 w-10 text-blue-400" />
                        </motion.div>
                        <motion.div
                            variants={fadeInUp}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400"
                        >
                            Security & Privacy
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                            Built on trust
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-6 text-lg leading-relaxed text-slate-400">
                            Your data is protected with industry-standard security. We collect only what's necessary and never share your information
                            with third parties.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-2"
                    >
                        {trustPoints.map((point, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="flex items-center gap-3.5 rounded-xl border border-slate-700/50 bg-slate-800/50 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50 hover:bg-slate-800/70"
                            >
                                <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" />
                                <span className="text-sm font-medium text-slate-300">{point}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-24 lg:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-20 text-center shadow-2xl lg:px-16 lg:py-28"
                    >
                        {/* Background decoration */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
                            <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b40_1px,transparent_1px),linear-gradient(to_bottom,#1e293b40_1px,transparent_1px)] bg-size-[4rem_4rem]" />
                        </div>

                        <div className="relative">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                                Completely free — No fees, no commitments
                            </div>
                            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                                Ready to modernize your
                                <span className="mt-2 block bg-linear-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                                    estate access?
                                </span>
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
                                Submit your application and our team will reach out to get you started. No fees. No commitments.
                            </p>
                            <div className="mt-10">
                                <button
                                    onClick={openModal}
                                    className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-slate-100 hover:shadow-2xl"
                                >
                                    Apply for Access
                                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Application Modal */}
            <ApplicationModal isOpen={modalOpen} onClose={closeModal} />
        </PublicLayout>
    );
}
