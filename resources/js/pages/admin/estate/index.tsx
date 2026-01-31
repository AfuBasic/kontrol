import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/AdminLayout';

export default function EstateBoard() {
    return (
        <AdminLayout>
            <Head title="Estate Board" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-gray-900">Estate Board</h1>
                <p className="mt-1 text-gray-500">Overview and activity for your estate.</p>
            </motion.div>

            {/* Content Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="rounded-xl border border-gray-200 bg-white p-6"
            >
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 rounded-full bg-gray-100 p-3">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-500">Estate overview coming soon.</p>
                    <p className="mt-1 text-sm text-gray-400">This page will display estate-level information and activity.</p>
                </div>
            </motion.div>
        </AdminLayout>
    );
}
