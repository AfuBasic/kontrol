import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff, CheckCircle2, Clock, Megaphone, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { ActivityItem } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';
import ActivityController from '@/actions/App/Http/Controllers/Resident/ActivityController';

type Props = {
    activities: ActivityItem[];
    unreadCount?: number;
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
        case 'telegram_linked':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.285.011.436z" />
                    </svg>
                </div>
            );
        case 'telegram_unlinked':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.285.011.436z" />
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

export default function Activity({ activities, notifications = [], unreadCount = 0 }: Props & { notifications?: any[] }) {
    const groupedActivities = groupActivitiesByDate(activities);
    const dateLabels = Object.keys(groupedActivities);
    const [activeTab, setActiveTab] = useState<'feed' | 'notifications'>('feed');

    return (
        <ResidentLayout>
            <Head title="Feed" />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Feed</h1>
                <p className="mt-1 text-gray-500">Updates and activity</p>

                {/* Tabs */}
                <div className="mt-4 flex rounded-xl bg-gray-100 p-1">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                            activeTab === 'feed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Activity
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                            activeTab === 'notifications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Notifications
                        {unreadCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Feed Tab */}
            {activeTab === 'feed' && (
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
                                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                                                                {activity.code}
                                                            </span>
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
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                    {notifications && notifications.length > 0 ? (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {notifications.map((notification, index) => {
                                    const isUnread = !notification.read_at;
                                    const notificationType = notification.data?.type || notification.type;

                                    // Determine icon and colors based on notification type
                                    let IconComponent = Bell;
                                    let iconBgColor = 'bg-gray-100';
                                    let iconColor = 'text-gray-500';

                                    if (notificationType?.includes('VisitorArrived') || notification.data?.visitor_name) {
                                        IconComponent = User;
                                        iconBgColor = isUnread ? 'bg-emerald-100' : 'bg-gray-100';
                                        iconColor = isUnread ? 'text-emerald-600' : 'text-gray-500';
                                    } else if (notificationType?.includes('NewPost') || notification.data?.type === 'new_post') {
                                        IconComponent = Megaphone;
                                        iconBgColor = isUnread ? 'bg-indigo-100' : 'bg-gray-100';
                                        iconColor = isUnread ? 'text-indigo-600' : 'text-gray-500';
                                    }

                                    const title = notification.data?.title || 'Notification';
                                    const message = notification.data?.message
                                        || (notification.data?.visitor_name
                                            ? `${notification.data.visitor_name} has arrived`
                                            : 'You have a new notification');

                                    return (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.3, delay: index * 0.03 }}
                                            className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all ${
                                                isUnread
                                                    ? 'border-indigo-100 bg-linear-to-r from-indigo-50/80 to-white'
                                                    : 'border-gray-100 bg-white'
                                            }`}
                                        >
                                            {/* Unread indicator bar */}
                                            {isUnread && (
                                                <div className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-indigo-500 to-indigo-600" />
                                            )}

                                            <div className="flex gap-4">
                                                {/* Icon */}
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBgColor}`}>
                                                    <IconComponent className={`h-6 w-6 ${iconColor}`} strokeWidth={1.5} />
                                                </div>

                                                {/* Content */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                            {title}
                                                        </h3>
                                                        {isUnread && (
                                                            <span className="shrink-0 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{message}</p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(notification.created_at).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-gray-100 to-gray-50">
                                <BellOff className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900">All caught up!</h3>
                            <p className="mt-1 max-w-xs px-4 text-sm text-gray-500">
                                You have no new notifications. We'll let you know when something happens.
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </ResidentLayout>
    );
}
