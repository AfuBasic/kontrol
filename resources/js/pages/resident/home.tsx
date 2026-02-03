import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { AccessCode, ActivityItem, HomeStats } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';

type Props = {
    stats: HomeStats;
    activeCodes: AccessCode[];
    recentActivity: ActivityItem[];
    estateName: string;
};

type PageProps = {
    auth: {
        user: {
            name: string;
        };
    };
};

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function getActivityIcon(type: ActivityItem['type']) {
    switch (type) {
        case 'created':
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
            );
        case 'used':
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
            );
        case 'expired':
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
            );
        case 'revoked':
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </div>
            );
    }
}

export default function Home({ stats, activeCodes, recentActivity, estateName }: Props) {
    const { auth } = usePage<PageProps>().props;
    const firstName = auth?.user?.name?.split(' ')[0] || 'there';

    return (
        <ResidentLayout>
            <Head title="Home" />

            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="mt-1 text-gray-500">{estateName}</p>
            </motion.div>

            {/* Hero Card - Primary CTA */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mb-8">
                <div className="overflow-hidden rounded-3xl bg-linear-to-br from-indigo-500 via-indigo-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/25">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                            />
                        </svg>
                    </div>
                    <h2 className="mb-1 text-xl font-semibold">Create Access Code</h2>
                    <p className="mb-5 text-sm text-white/80">Generate a one-time code for your visitor</p>
                    <Link
                        href="/resident/visitors/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm transition-all hover:bg-white/90 active:scale-[0.98]"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Generate Code
                    </Link>
                </div>
            </motion.div>

            {/* Active Codes Section */}
            {activeCodes.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Active Codes</h3>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{activeCodes.length} active</span>
                    </div>
                    <div className="space-y-3">
                        {activeCodes.slice(0, 3).map((code, index) => (
                            <motion.div
                                key={code.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                            >
                                <Link
                                    href={`/resident/visitors/${code.id}`}
                                    className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md active:scale-[0.99]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{code.visitor_name || 'Visitor'}</p>
                                                <p className="text-sm text-gray-500">Code: {code.code}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-amber-600">{code.time_remaining}</p>
                                            <p className="text-xs text-gray-400">remaining</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                    {activeCodes.length > 3 && (
                        <Link href="/resident/visitors" className="mt-3 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
                            View all {activeCodes.length} codes
                        </Link>
                    )}
                </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mb-8">
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                        <p className="text-2xl font-semibold text-gray-900">{stats.active_codes}</p>
                        <p className="text-xs text-gray-500">Active</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                        <p className="text-2xl font-semibold text-gray-900">{stats.codes_today}</p>
                        <p className="text-xs text-gray-500">Created today</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                        <p className="text-2xl font-semibold text-gray-900">{stats.visitors_today}</p>
                        <p className="text-xs text-gray-500">Arrived today</p>
                    </div>
                </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <Link href="/resident/activity" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        View all
                    </Link>
                </div>
                {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                        {recentActivity.slice(0, 5).map((activity, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                            >
                                {getActivityIcon(activity.type)}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">No recent activity</p>
                        <p className="mt-1 text-xs text-gray-400">Create an access code to get started</p>
                    </div>
                )}
            </motion.div>
        </ResidentLayout>
    );
}
