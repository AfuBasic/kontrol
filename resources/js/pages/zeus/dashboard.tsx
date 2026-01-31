import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AnimatedLayout from '@/layouts/AnimatedLayout';

export default function Dashboard() {
    function handleLogout() {
        router.post('/zeus/logout');
    }

    return (
        <AnimatedLayout>
            <Head title="Zeus Dashboard" />

            <div className="min-h-screen bg-gray-50">
                <motion.nav
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="border-b border-gray-200 bg-white"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-24 overflow-hidden">
                                    <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-12" />
                                </div>
                                <span className="text-lg font-semibold text-gray-900">Zeus</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </motion.nav>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        className="mb-8"
                    >
                        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                        <p className="mt-1 text-gray-500">Welcome to the Zeus admin panel.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                        className="rounded-lg border border-gray-200 bg-white p-6"
                    >
                        <p className="text-gray-500">Your admin content goes here.</p>
                    </motion.div>
                </main>
            </div>
        </AnimatedLayout>
    );
}
