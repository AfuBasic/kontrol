import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import SecurityLayout from '@/Layouts/SecurityLayout';
import ZeusLayout from '@/Layouts/ZeusLayout';
import type { SharedData } from '@/types';

interface Props {
    status: number;
}

export default function Error({ status }: Props) {
    const { props } = usePage<SharedData>();
    const hasLayout = !!props.auth?.user;

    const title =
        {
            503: '503: Service Unavailable',
            500: '500: Internal Server Error',
            404: '404: Page Not Found',
            403: '403: Forbidden',
            419: '419: Page Expired',
        }[status] || 'Error';

    const description =
        {
            503: 'Sorry, we are doing some maintenance. Please check back soon.',
            500: 'Whoops, something went wrong on our servers. We have been notified.',
            404: 'Sorry, the page you are looking for could not be found.',
            403: 'Sorry, you are forbidden from accessing this page.',
            419: 'The page has expired due to inactivity. Please refresh and try again.',
        }[status] || 'An unexpected error occurred.';

    return (
        <div
            className={`flex flex-col items-center justify-center text-center selection:bg-primary-500/30 ${
                hasLayout ? 'min-h-[70vh] px-4 py-12 sm:px-6' : 'min-h-screen bg-slate-950 px-6 py-24'
            }`}
        >
            <Head title={title} />

            {/* Ambient Background Elements (Only for standalone page) */}
            {!hasLayout && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
                    <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[100px]" />
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Icon Circle */}
                <div
                    className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl backdrop-blur-xl ${
                        hasLayout ? 'bg-slate-100/80 shadow-sm ring-1 ring-slate-200' : 'bg-slate-900/50 shadow-2xl ring-1 ring-white/10'
                    }`}
                >
                    <motion.div
                        animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <AlertCircle className={`h-10 w-10 ${hasLayout ? 'text-rose-500' : 'text-primary-500'}`} strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Status Code */}
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`mb-3 inline-block text-xs font-black tracking-[0.3em] uppercase ${hasLayout ? 'text-slate-400' : 'text-primary-500'}`}
                >
                    Status {status}
                </motion.span>

                {/* Heading */}
                <h1 className={`mb-4 text-3xl font-black tracking-tight sm:text-4xl ${hasLayout ? 'text-slate-900' : 'text-white'}`}>
                    {title.split(': ')[1] || title}
                </h1>

                {/* Description */}
                <p className={`mb-10 text-base leading-relaxed ${hasLayout ? 'text-slate-500' : 'text-slate-400'}`}>{description}</p>

                {/* Actions */}
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto ${
                            hasLayout ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-950 hover:bg-slate-100'
                        }`}
                    >
                        <Home className="h-4.5 w-4.5" />
                        Back Home
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold ring-1 transition-all active:scale-[0.98] sm:w-auto ${
                            hasLayout
                                ? 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                                : 'bg-slate-900 text-white ring-white/10 hover:bg-slate-800'
                        }`}
                    >
                        <ArrowLeft className="h-4.5 w-4.5" />
                        Go Back
                    </button>
                </div>
            </motion.div>

            {/* Footer Brand (Only for standalone page) */}
            {!hasLayout && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute right-0 bottom-12 left-0"
                >
                    <img
                        src="/assets/images/kontrol.png"
                        alt="Kontrol"
                        className="mx-auto h-8 w-auto opacity-20 grayscale transition-opacity hover:opacity-40"
                    />
                </motion.div>
            )}
        </div>
    );
}

function ErrorLayout({ children }: { children: React.ReactNode }) {
    const { props } = usePage<SharedData>();
    const roles = props.auth?.user?.roles || [];

    if (roles.includes('resident')) {
        return (
            <ResidentLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </ResidentLayout>
        );
    }
    if (roles.includes('admin')) {
        return (
            <AdminLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </AdminLayout>
        );
    }
    if (roles.includes('security')) {
        return (
            <SecurityLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </SecurityLayout>
        );
    }
    if (roles.includes('zeus')) {
        return (
            <ZeusLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </ZeusLayout>
        );
    }

    return <AnimatedLayout>{children}</AnimatedLayout>;
}

Error.layout = (page: React.ReactNode) => <ErrorLayout>{page}</ErrorLayout>;
