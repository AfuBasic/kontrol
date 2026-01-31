import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/AdminLayout';

const quickActions = [
    {
        name: 'Manage Roles',
        description: 'Create and configure user roles for your estate',
        href: '/admin/roles',
        icon: ShieldIcon,
        color: 'bg-blue-50 text-blue-600',
    },
    {
        name: 'Manage Permissions',
        description: 'Define what actions users can perform',
        href: '/admin/permissions',
        icon: KeyIcon,
        color: 'bg-emerald-50 text-emerald-600',
    },
];

function ShieldIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
        </svg>
    );
}

function KeyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
            />
        </svg>
    );
}

export default function Dashboard() {
    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-gray-500">Welcome to your estate administration panel.</p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="mb-8"
            >
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.name}
                            href={action.href}
                            className="group relative rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-md"
                        >
                            <div className={`mb-4 inline-flex rounded-lg p-2.5 ${action.color}`}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <h3 className="mb-1 font-medium text-gray-900 group-hover:text-gray-700">{action.name}</h3>
                            <p className="text-sm text-gray-500">{action.description}</p>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform group-hover:translate-x-1">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* Activity Section Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                className="rounded-xl border border-gray-200 bg-white p-6"
            >
                <h2 className="mb-4 text-lg font-medium text-gray-900">Recent Activity</h2>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 rounded-full bg-gray-100 p-3">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-500">No recent activity to display.</p>
                    <p className="mt-1 text-sm text-gray-400">Activity from your estate will appear here.</p>
                </div>
            </motion.div>
        </AdminLayout>
    );
}
