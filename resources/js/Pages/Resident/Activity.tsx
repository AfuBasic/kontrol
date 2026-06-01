import { Head, router, usePage, InfiniteScroll } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    BellOff,
    Clock,
    User,
    Zap,
    Shield,
    Key,
    LogIn,
    ChevronRight,
    Activity as ActivityIcon,
    Megaphone,
    CheckCircle,
    Trash2,
    Search,
    X,
    Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/Resident/NotificationController';
import ActivityController from '@/actions/App/Http/Controllers/Resident/ActivityController';
import { useDebounce } from '@/Hooks/useDebounce';
import type { ActivityItem } from '@/types/access-code';

type Props = {
    activities: {
        data: ActivityItem[];
        next_page_url: string | null;
        current_page: number;
        last_page: number;
        total: number;
    };
    notifications?: any[];
    unreadCount?: number;
    filters: {
        search?: string;
    };
};

function getActivityIcon(type: ActivityItem['type']) {
    switch (type) {
        case 'created':
            return (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20">
                    <PlusIcon className="h-6 w-6" strokeWidth={2.5} />
                </div>
            );
        case 'used':
            return (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                    <Zap className="h-6 w-6" strokeWidth={2.5} />
                </div>
            );
        case 'expired':
            return (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20">
                    <Clock className="h-6 w-6" strokeWidth={2.5} />
                </div>
            );
        case 'revoked':
            return (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 ring-1 ring-red-500/20">
                    <Shield className="h-6 w-6" strokeWidth={2.5} />
                </div>
            );
        case 'telegram_linked':
        case 'telegram_unlinked':
            return (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.285.011.436z" />
                    </svg>
                </div>
            );
        case 'logged_in':
            return (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
                    <LogIn className="h-6 w-6" strokeWidth={2.5} />
                </div>
            );
        default:
            return (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20">
                    <ActivityIcon className="h-6 w-6" strokeWidth={2.5} />
                </div>
            );
    }
}

function PlusIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth || 2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function groupActivitiesByDate(activities: ActivityItem[]): Record<string, ActivityItem[]> {
    const groups: Record<string, ActivityItem[]> = {};

    activities.forEach((activity) => {
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

export default function Activity({ activities, notifications = [], unreadCount = 0, filters }: Props) {
    const groupedActivities = groupActivitiesByDate(activities?.data || []);
    const dateLabels = Object.keys(groupedActivities);

    const [search, setSearch] = useState(filters?.search || '');
    const debouncedSearch = useDebounce(search, 500);

    const { url } = usePage();
    const [activeTab, setActiveTab] = useState<'feed' | 'notifications'>(() => {
        const params = new URLSearchParams(url.split('?')[1] || '');
        const tab = params.get('tab');
        if (tab === 'feed' || tab === 'notifications') {
            return tab;
        }
        return 'feed';
    });

    useEffect(() => {
        const params = new URLSearchParams(url.split('?')[1] || '');
        const tab = params.get('tab');
        if (tab === 'feed' || tab === 'notifications') {
            setActiveTab(tab);
        }
    }, [url]);

    useEffect(() => {
        if (debouncedSearch !== (filters?.search || '')) {
            router.get(
                ActivityController.url(),
                {
                    search: debouncedSearch,
                    tab: activeTab,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }
    }, [debouncedSearch]);

    return (
        <>
            <Head title="Feed" />

            {/* Premium Header Section */}
            <div className="relative overflow-hidden pt-4 pb-8">
                {/* Background Decor */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
                <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-blue-500/5 blur-[60px]" />

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative z-10">
                    <div className="mb-1 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 shadow-lg">
                            <ActivityIcon className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Updates & Events</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Your Feed</h1>
                </motion.div>

                {/* Glass Tabs */}
                <div className="relative z-10 mt-8 flex rounded-[22px] bg-slate-200/50 p-1.5 ring-1 ring-slate-900/5 backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`relative flex-1 rounded-[18px] py-3 text-[10px] font-black tracking-widest uppercase transition-all ${
                            activeTab === 'feed' ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {activeTab === 'feed' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 rounded-[18px] bg-slate-900 shadow-lg"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">Activity</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`relative flex flex-1 items-center justify-center gap-2 rounded-[18px] py-3 text-[10px] font-black tracking-widest uppercase transition-all ${
                            activeTab === 'notifications' ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {activeTab === 'notifications' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 rounded-[18px] bg-slate-900 shadow-lg"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            Alerts
                            {unreadCount > 0 && (
                                <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${activeTab === 'notifications' ? 'bg-white text-slate-900' : 'bg-red-500 text-white'}`}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="pb-32">
                <AnimatePresence mode="wait">
                    {activeTab === 'feed' && (
                        <motion.div
                            key="feed-tab"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Premium Search Bar */}
                            <div className="mb-6">
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        {search !== debouncedSearch ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                        ) : (
                                            <Search className="h-5 w-5 text-slate-400" />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search activities, codes, or visitors..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="block w-full rounded-2xl border border-slate-100 bg-white py-3.5 pr-12 pl-12 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {activities?.data.length > 0 ? (
                                <InfiniteScroll
                                    data="activities"
                                    className="space-y-10"
                                    loading={
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                        </div>
                                    }
                                >
                                    {dateLabels.map((dateLabel) => (
                                        <div key={dateLabel}>
                                            <div className="mb-5 flex items-center gap-4">
                                                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{dateLabel}</h3>
                                                <div className="h-px flex-1 bg-linear-to-r from-slate-200 to-transparent" />
                                            </div>
                                            <div className="space-y-4">
                                                {groupedActivities[dateLabel].map((activity, index) => (
                                                    <motion.div
                                                        key={`${dateLabel}-${index}`}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.4, delay: index * 0.02 }}
                                                        className="group relative flex gap-5 rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md active:scale-[0.98]"
                                                    >
                                                        {getActivityIcon(activity.type)}
                                                        <div className="flex-1 pt-1">
                                                            <p className="leading-tight font-bold text-slate-900">{activity.message}</p>
                                                            {activity.detail && (
                                                                <p className="mt-1 text-sm font-medium text-slate-400">{activity.detail}</p>
                                                            )}
                                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                <span className="text-[10px] font-black tracking-tighter text-slate-300 uppercase">
                                                                    {activity.time}
                                                                </span>
                                                                {activity.code && (
                                                                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-black tracking-widest text-indigo-600 ring-1 ring-indigo-500/10">
                                                                        {activity.code}
                                                                    </span>
                                                                )}
                                                                {activity.ip_address && (
                                                                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-black text-slate-400 ring-1 ring-slate-200">
                                                                        {activity.ip_address}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <ChevronRight className="h-5 w-5 text-slate-200 transition-colors group-hover:text-slate-400" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </InfiniteScroll>
                            ) : (
                                search ? (
                                    <div className="flex flex-col items-center justify-center rounded-[40px] bg-white p-16 text-center shadow-sm ring-1 ring-slate-100">
                                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-50 text-slate-300">
                                            <Search className="h-10 w-10" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">No matches found</h3>
                                        <p className="mt-2 text-sm font-medium text-slate-400">
                                            We couldn't find any activities matching "{search}".
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-[40px] bg-white p-16 text-center shadow-sm ring-1 ring-slate-100">
                                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-50 text-slate-300">
                                            <ActivityIcon className="h-10 w-10" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">Quiet for now</h3>
                                        <p className="mt-2 text-sm font-medium text-slate-400">Your recent activity will bloom here as things happen.</p>
                                    </div>
                                )
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div
                            key="notif-tab"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Quick Actions */}
                            {notifications && notifications.length > 0 && (
                                <div className="mb-6 flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (unreadCount === 0) return;
                                            router.post(NotificationController.markAllAsRead.url(), {}, { preserveScroll: true });
                                        }}
                                        disabled={unreadCount === 0}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-[22px] py-3.5 text-[10px] font-black tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-40 ${
                                            unreadCount > 0 ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <CheckCircle className="h-3.5 w-3.5" strokeWidth={3} />
                                        Read all
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!confirm('Clear all notifications?')) return;
                                            router.post(NotificationController.clearAll.url(), {}, { preserveScroll: true });
                                        }}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-white py-3.5 text-[10px] font-black tracking-widest text-slate-900 uppercase shadow-sm ring-1 ring-slate-200 transition-all hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-100 active:scale-[0.98]"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
                                        Clear
                                    </button>
                                </div>
                            )}

                            {/* ... same notifications logic as before ... */}
                            {notifications && notifications.length > 0 ? (
                                <div className="space-y-4">
                                    {notifications.map((notification: any, index: number) => {
                                        const isUnread = !notification.read_at;
                                        const notificationType = notification.data?.type || notification.type;

                                        let icon = <Bell className="h-6 w-6" />;
                                        let themeClass = isUnread
                                            ? 'from-indigo-500/10 to-transparent ring-indigo-500/20'
                                            : 'bg-slate-50 ring-slate-200';
                                        let iconColor = isUnread ? 'text-indigo-600' : 'text-slate-400';

                                        if (notificationType?.includes('VisitorArrived') || notification.data?.visitor_name) {
                                            icon = <User className="h-6 w-6" />;
                                            if (isUnread) themeClass = 'from-emerald-500/10 to-transparent ring-emerald-500/20';
                                            if (isUnread) iconColor = 'text-emerald-600';
                                        }

                                        const title = notification.data?.title || 'Notification';
                                        const message = notification.data?.message || 'You have a new update';

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                                className={`group relative cursor-pointer overflow-hidden rounded-[32px] border p-5 transition-all active:scale-[0.98] ${
                                                    isUnread ? 'border-indigo-100 bg-white shadow-md' : 'border-slate-100 bg-white shadow-sm'
                                                }`}
                                                onClick={() => {
                                                    window.dispatchEvent(new CustomEvent('show-notification-detail', { detail: notification }));
                                                }}
                                            >
                                                {isUnread && (
                                                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-linear-to-b from-indigo-500 to-indigo-600" />
                                                )}

                                                <div className="flex gap-5">
                                                    <div
                                                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-linear-to-br ring-1 ${themeClass} ${iconColor}`}
                                                    >
                                                        {icon}
                                                    </div>

                                                    <div className="flex-1 pt-1">
                                                        <div className="flex items-start justify-between">
                                                            <h3
                                                                className={`leading-tight font-bold ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}
                                                            >
                                                                {title}
                                                            </h3>
                                                            {isUnread && (
                                                                <span className="shrink-0 rounded-full bg-indigo-500 px-2 py-0.5 text-[8px] font-black tracking-tighter text-white uppercase">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-400">{message}</p>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                                                            <span className="text-[10px] font-black tracking-tighter text-slate-300 uppercase">
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
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-[40px] bg-white py-20 text-center shadow-sm ring-1 ring-slate-100">
                                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-50 text-slate-300">
                                        <BellOff className="h-10 w-10" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">All Clear</h3>
                                    <p className="mt-2 max-w-[200px] text-sm font-medium text-slate-400">
                                        We'll alert you here when something needs your attention.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
