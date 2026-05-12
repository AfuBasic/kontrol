import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Home, RefreshCcw } from 'lucide-react';

interface Props {
    status: number;
}

export default function Error({ status }: Props) {
    const title = {
        503: '503: Service Unavailable',
        500: '500: Internal Server Error',
        404: '404: Page Not Found',
        403: '403: Forbidden',
        419: '419: Page Expired',
    }[status] || 'Error';

    const description = {
        503: 'Sorry, we are doing some maintenance. Please check back soon.',
        500: 'Whoops, something went wrong on our servers. We have been notified.',
        404: 'Sorry, the page you are looking for could not be found.',
        403: 'Sorry, you are forbidden from accessing this page.',
        419: 'The page has expired due to inactivity. Please refresh and try again.',
    }[status] || 'An unexpected error occurred.';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-24 text-center selection:bg-primary-500/30">
            <Head title={title} />

            {/* Ambient Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
                <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-lg"
            >
                {/* Icon Circle */}
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900/50 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
                    <motion.div
                        animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <AlertCircle className="h-12 w-12 text-primary-500" strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Status Code */}
                <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4 inline-block text-sm font-black tracking-[0.3em] text-primary-500 uppercase"
                >
                    Status {status}
                </motion.span>

                {/* Heading */}
                <h1 className="mb-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {title.split(': ')[1] || title}
                </h1>

                {/* Description */}
                <p className="mb-12 text-lg leading-relaxed text-slate-400">
                    {description}
                </p>

                {/* Actions */}
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    {status === 419 || status === 500 ? (
                         <button
                            onClick={() => window.location.reload()}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-black text-slate-950 transition-all hover:scale-[1.02] hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
                        >
                            <RefreshCcw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
                            Refresh Page
                        </button>
                    ) : (
                        <Link
                            href="/"
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-black text-slate-950 transition-all hover:scale-[1.02] hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
                        >
                            <Home className="h-5 w-5" />
                            Back Home
                        </Link>
                    )}
                    
                    <button
                        onClick={() => window.history.back()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-black text-white ring-1 ring-white/10 transition-all hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Go Back
                    </button>
                </div>
            </motion.div>

            {/* Footer Brand */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-12 left-0 right-0"
            >
                <img src="/assets/images/kontrol.png" alt="Kontrol" className="mx-auto h-8 w-auto opacity-20 grayscale transition-opacity hover:opacity-40" />
            </motion.div>
        </div>
    );
}
