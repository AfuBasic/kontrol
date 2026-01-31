import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/AdminLayout';

export default function Dashboard() {
    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="text-center"
                >
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                        <svg
                            className="h-10 w-10 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                            />
                        </svg>
                    </div>

                    <h1 className="mb-2 text-2xl font-semibold text-gray-900">Dashboard Coming Soon</h1>
                    <p className="mx-auto max-w-md text-gray-500">
                        We're building an insightful dashboard with stats, charts, and activity feeds for your estate.
                    </p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400"
                    >
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                        In Development
                    </motion.div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
