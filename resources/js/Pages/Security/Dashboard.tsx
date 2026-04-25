import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import SecurityLayout from '@/layouts/SecurityLayout';

export default function Dashboard() {
    return (
        <SecurityLayout>
            <Head title="Security Dashboard" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-white">Security Dashboard</h1>
                <p className="mt-1 text-gray-400">Monitor and manage estate security operations.</p>
            </motion.div>

            {/* Status Cards */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Active Visitors</span>
                        <span className="rounded-full bg-green-500/10 p-1.5">
                            <span className="block h-2 w-2 rounded-full bg-green-500"></span>
                        </span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-white">0</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Today's Entries</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-white">0</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Pending Requests</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-amber-400">0</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Alerts</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-white">0</p>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                className="rounded-xl border border-gray-800 bg-gray-800/50 p-6"
            >
                <h2 className="mb-4 text-lg font-medium text-white">Recent Activity</h2>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 rounded-full bg-gray-700 p-3">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-300">No recent security activity.</p>
                    <p className="mt-1 text-sm text-gray-500">Entry logs and alerts will appear here.</p>
                </div>
            </motion.div>
        </SecurityLayout>
    );
}
