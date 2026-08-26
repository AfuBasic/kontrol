import { BellIcon, CheckCircleIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import {
    index,
    markAllAsRead as markAllAsReadAction,
    markAsRead as markAsReadAction,
    clearAll as clearAllAction,
} from '@/actions/App/Http/Controllers/Admin/NotificationController';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';

import type { SharedData } from '@/types';

interface NotificationData {
    message?: string;
    action_url?: string;
    [key: string]: unknown;
}

interface Notification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    notifications: {
        data: Notification[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filters: {
        search?: string;
        type?: string;
    };
}

export default function NotificationsIndex({ notifications, filters }: Props) {
    const { confirm } = useAdminConfirmation();
    const { name } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(index.url(), { search, type: type !== 'all' ? type : undefined }, { preserveState: true });
    };

    const handleTypeChange = (newType: string) => {
        setType(newType);
        router.get(index.url(), { search, type: newType !== 'all' ? newType : undefined }, { preserveState: true });
    };

    const markAsRead = (id: string) => {
        router.patch(markAsReadAction.url({ id }));
    };

    const markAllAsRead = () => {
        router.post(markAllAsReadAction.url());
    };

    const clearAll = () => {
        confirm({
            title: 'Clear notifications',
            message: 'Are you sure you want to delete all notifications?',
            confirmLabel: 'Clear all',
            onConfirm: () => router.post(clearAllAction.url()),
        });
    };

    return (
        <>
            <Head title={`Notifications - ${name}`} />

            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                {/* Header with Title and Quick Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
                            Notifications
                        </h1>
                        <p className="mt-1 text-slate-500 text-sm dark:text-slate-400">
                            View and manage your system notifications.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-xs text-slate-700 shadow-xs transition-colors hover:bg-slate-50 sm:flex-none sm:text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Mark all read</span>
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 font-medium text-rose-600 text-xs shadow-xs transition-colors hover:bg-rose-50 sm:flex-none sm:text-sm dark:border-rose-900/40 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                            <TrashIcon className="h-4 w-4 text-rose-500" />
                            <span>Clear all</span>
                        </button>
                    </div>
                </div>

                {/* Search & Tabs */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative flex-1" noValidate>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            </div>
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search notifications..."
                                className="block w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-10 text-slate-900 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-100 dark:focus:ring-slate-100"
                            />
                        </div>
                    </form>

                    {/* Filter Tabs */}
                    <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
                        {['all', 'unread', 'read'].map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => handleTypeChange(f)}
                                className={`inline-flex shrink-0 items-center justify-center rounded-xl px-3.5 py-1.5 font-medium text-xs transition-all select-none ${
                                    type === f
                                        ? 'bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                                        : 'border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="mt-5 space-y-2.5">
                    {notifications.data.length > 0 ? (
                        notifications.data.map((notification) => {
                            const url = notification.data.action_url || (notification.data as any).url;

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        if (url) {
                                            router.visit(url);
                                        }
                                    }}
                                    className={`group relative flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
                                        !notification.read_at
                                            ? 'border-indigo-200/80 bg-indigo-50/20 hover:border-indigo-300 dark:border-indigo-900/40 dark:bg-indigo-950/20'
                                            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                                    } ${url ? 'cursor-pointer' : ''}`}
                                >
                                    {/* Icon Badge */}
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                                            !notification.read_at
                                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                        <BellIcon className="h-5 w-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-slate-900 text-sm leading-snug break-words dark:text-slate-100">
                                                {notification.data.message || 'New notification'}
                                            </p>
                                            {!notification.read_at && (
                                                <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600 ring-4 ring-indigo-100 dark:bg-indigo-400 dark:ring-indigo-950/60" />
                                            )}
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <time className="text-slate-400 text-xs dark:text-slate-500">
                                                {new Date(notification.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </time>

                                            {!notification.read_at && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="font-medium text-indigo-600 text-xs hover:text-indigo-500 hover:underline dark:text-indigo-400"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 border-dashed bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <BellIcon className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 font-semibold text-base text-slate-900 dark:text-slate-100">
                                No notifications found
                            </h3>
                            <p className="mt-1 max-w-sm text-slate-500 text-sm dark:text-slate-400">
                                Try adjusting your search keywords or switching filters.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination Component */}
                {notifications.total > notifications.data.length && (
                    <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-1 justify-between sm:hidden">
                            {notifications.links[0]?.url ? (
                                <Link
                                    href={notifications.links[0].url}
                                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 text-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    Previous
                                </Link>
                            ) : (
                                <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 font-medium text-slate-400 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600">
                                    Previous
                                </span>
                            )}
                            {notifications.links[notifications.links.length - 1]?.url ? (
                                <Link
                                    href={notifications.links[notifications.links.length - 1].url!}
                                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 text-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    Next
                                </Link>
                            ) : (
                                <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 font-medium text-slate-400 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600">
                                    Next
                                </span>
                            )}
                        </div>

                        {/* Desktop Pagination */}
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-slate-500 text-xs dark:text-slate-400">
                                    Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{notifications.from}</span> to{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{notifications.to}</span> of{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{notifications.total}</span> notifications
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-lg shadow-xs" aria-label="Pagination">
                                    {notifications.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url || '#'}
                                            className={`relative inline-flex items-center px-3 py-1.5 font-semibold text-xs ${
                                                link.active
                                                    ? 'z-10 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                                    : 'bg-white text-slate-700 ring-1 ring-slate-200 ring-inset hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
                                            } ${i === 0 ? 'rounded-l-lg' : ''} ${
                                                i === notifications.links.length - 1 ? 'rounded-r-lg' : ''
                                            } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
