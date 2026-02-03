import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ActivityItem } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';

type Props = {
    activities: ActivityItem[];
};

function getActivityIcon(type: ActivityItem['type']) {
    switch (type) {
        case 'created':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
            );
        case 'used':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
            );
        case 'expired':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
            );
        case 'revoked':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </div>
            );
    }
}

function groupActivitiesByDate(activities: ActivityItem[]): Record<string, ActivityItem[]> {
    const groups: Record<string, ActivityItem[]> = {};

    activities.forEach((activity) => {
        // Parse the time_full to get the date
        const date = new Date(activity.time_full);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label: string;
        if (date.toDateString() === today.toDateString()) {
            label = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            label = 'Yesterday';
        } else {
            label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }

        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(activity);
    });

    return groups;
}

export default function Activity({ activities }: Props) {
    const groupedActivities = groupActivitiesByDate(activities);
    const dateLabels = Object.keys(groupedActivities);

    return (
        <ResidentLayout>
            <Head title="Activity" />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Activity</h1>
                <p className="mt-1 text-gray-500">Your visitor history</p>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                {activities.length > 0 ? (
                    <div className="space-y-6">
                        {dateLabels.map((dateLabel, groupIndex) => (
                            <div key={dateLabel}>
                                <h3 className="mb-3 text-sm font-semibold text-gray-500">{dateLabel}</h3>
                                <div className="space-y-3">
                                    {groupedActivities[dateLabel].map((activity, index) => (
                                        <motion.div
                                            key={`${dateLabel}-${index}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: groupIndex * 0.1 + index * 0.05 }}
                                            className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                                        >
                                            {getActivityIcon(activity.type)}
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{activity.message}</p>
                                                <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                                    <span>{activity.time}</span>
                                                    {activity.code && (
                                                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{activity.code}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <h3 className="mb-1 font-medium text-gray-900">No activity yet</h3>
                        <p className="text-sm text-gray-500">Your visitor activity will appear here</p>
                    </div>
                )}
            </motion.div>
        </ResidentLayout>
    );
}
