import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, User, AlertTriangle, Info, Check, BellOff } from 'lucide-react';
import { useState } from 'react';
import SecurityLayout from '@/layouts/SecurityLayout';
import NotificationController from '@/actions/App/Http/Controllers/Security/NotificationController';

interface Notification {
    id: string;
    type: 'validation' | 'denied' | 'visitor' | 'alert' | 'system' | 'info';
    title: string;
    message: string;
    icon: string;
    read: boolean;
    created_at: string;
    created_at_human: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    notifications: Notification[];
    pagination: Pagination;
    unreadCount: number;
}

function getIcon(type: Notification['type']) {
    switch (type) {
        case 'validation':
            return <CheckCircle className="h-5 w-5 text-emerald-500" />;
        case 'denied':
            return <XCircle className="h-5 w-5 text-red-500" />;
        case 'visitor':
            return <User className="h-5 w-5 text-blue-500" />;
        case 'alert':
            return <AlertTriangle className="h-5 w-5 text-warning-500" />;
        case 'system':
            return <Info className="h-5 w-5 text-slate-500" />;
        default:
            return <Bell className="h-5 w-5 text-slate-400" />;
    }
}

function NotificationItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: (id: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all ${
                !notification.read ? 'bg-primary-50/50 ring-primary-100' : ''
            }`}
        >
            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-primary-500 to-primary-700" />
            )}

            <div className="flex gap-3">
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                        </h3>
                        <span className="shrink-0 text-[10px] text-slate-400">
                            {notification.created_at_human}
                        </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{notification.message}</p>

                    {/* Mark as read button */}
                    {!notification.read && (
                        <button
                            onClick={() => onMarkRead(notification.id)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
                        >
                            <Check className="h-3 w-3" />
                            Mark as read
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function NotificationsIndex({ notifications, pagination, unreadCount }: Props) {
    const [items, setItems] = useState(notifications);
    const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    function handleMarkRead(id: string) {
        // Optimistic update
        setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setLocalUnreadCount(prev => Math.max(0, prev - 1));

        // Send to server
        router.post(
            NotificationController.markAsRead.url({ notification: id }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    }

    function handleMarkAllRead() {
        if (localUnreadCount === 0) return;

        setMarkingAllRead(true);

        // Optimistic update
        setItems(prev => prev.map(n => ({ ...n, read: true })));
        setLocalUnreadCount(0);

        // Send to server
        router.post(
            NotificationController.markAllAsRead.url(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setMarkingAllRead(false),
            }
        );
    }

    function handleLoadMore() {
        if (pagination.current_page >= pagination.last_page) return;

        router.get(
            NotificationController.index.url(),
            { page: pagination.current_page + 1 },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['notifications', 'pagination'],
            }
        );
    }

    return (
        <SecurityLayout>
            <Head title="Notifications" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-5 flex items-center justify-between"
            >
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {localUnreadCount > 0 ? `${localUnreadCount} unread` : 'All caught up'}
                    </p>
                </div>

                {localUnreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingAllRead}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {markingAllRead ? 'Marking...' : 'Mark all read'}
                    </button>
                )}
            </motion.div>

            {/* Notifications List */}
            {items.length > 0 ? (
                <div className="space-y-3">
                    <AnimatePresence>
                        {items.map((notification, idx) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.03 }}
                            >
                                <NotificationItem
                                    notification={notification}
                                    onMarkRead={handleMarkRead}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Load More */}
                    {pagination.current_page < pagination.last_page && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="pt-4"
                        >
                            <button
                                onClick={handleLoadMore}
                                className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                            >
                                Load more
                            </button>
                        </motion.div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-100"
                >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                        <BellOff className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">No notifications</h3>
                    <p className="mt-1 max-w-xs px-4 text-sm text-slate-500">
                        You're all caught up! New alerts will appear here.
                    </p>
                </motion.div>
            )}
        </SecurityLayout>
    );
}
