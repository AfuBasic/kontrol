import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    BellOff,
    CheckCheck,
    CheckCircle2,
    Clock,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface NotificationData {
    title?: string;
    message?: string;
    body?: string;
    action_url?: string;
    url?: string;
    type?: string;
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

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        estate_name: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    notifications: {
        data: Notification[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    unreadCount: number;
    filters: {
        search?: string;
        type?: string;
    };
}

export default function Notifications({
    organization,
    membership,
    notifications,
    unreadCount,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [filterType, setFilterType] = useState(filters.type || 'all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/org/notifications',
            { search, type: filterType !== 'all' ? filterType : undefined },
            { preserveState: true }
        );
    };

    const handleTypeChange = (newType: string) => {
        setFilterType(newType);
        router.get(
            '/org/notifications',
            { search, type: newType !== 'all' ? newType : undefined },
            { preserveState: true }
        );
    };

    const markAsRead = (id: string) => {
        router.post(`/org/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const markAllAsRead = () => {
        router.post('/org/notifications/read-all', {}, { preserveScroll: true });
    };

    const clearAll = () => {
        if (confirm('Are you sure you want to clear all notifications?')) {
            router.post('/org/notifications/clear-all', {}, { preserveScroll: true });
        }
    };

    const formatNotificationTime = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    return (
        <OrganizationLayout title="Notifications" contentClassName="max-w-4xl">
            <Head title={`${organization.name} - Notifications`} />

            <div className="space-y-6">
                {/* Header card */}
                <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#0b4aa2]">
                            <Bell className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                                    Notifications
                                </h1>
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-[#0b4aa2] px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-slate-500">
                                Alerts, visitor arrivals, and updates for {organization.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 active:scale-95"
                            >
                                <CheckCheck className="h-4 w-4 text-[#0b4aa2]" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                        {notifications.data.length > 0 && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200/80 bg-rose-50/50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-xs transition-colors hover:bg-rose-100 active:scale-95"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Clear all</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <div className="relative">
                            <Search className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search notifications..."
                                className="block w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pr-10 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2]"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(
                                            '/org/notifications',
                                            { type: filterType !== 'all' ? filterType : undefined },
                                            { preserveState: true }
                                        );
                                    }}
                                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-xs ring-1 ring-slate-200/80">
                        {['all', 'unread', 'read'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => handleTypeChange(tab)}
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                    filterType === tab
                                        ? 'bg-[#0b4aa2] text-white shadow-xs'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notification Feed */}
                <div className="space-y-3">
                    {notifications.data.length > 0 ? (
                        notifications.data.map((notification) => {
                            const actionUrl =
                                notification.data.action_url ||
                                notification.data.url;
                            const isUnread = !notification.read_at;
                            const title =
                                notification.data.title ||
                                (notification.data.message ? 'Notification' : 'Notice');
                            const message =
                                notification.data.message ||
                                notification.data.body ||
                                'You have a new update.';

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        if (actionUrl) {
                                            router.visit(actionUrl);
                                        }
                                    }}
                                    className={`group relative flex items-start gap-4 rounded-3xl p-4 transition-all sm:p-5 ${
                                        isUnread
                                            ? 'border border-[#0b4aa2]/20 bg-[#f4f8ff] shadow-xs'
                                            : 'border border-slate-200/70 bg-white hover:border-slate-300'
                                    } ${actionUrl ? 'cursor-pointer' : ''}`}
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                            isUnread
                                                ? 'bg-[#0b4aa2] text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <Bell className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 leading-snug">
                                                    {title}
                                                </h3>
                                                <p className="mt-1 text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                                                    {message}
                                                </p>
                                            </div>

                                            {isUnread && (
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0b4aa2] ring-4 ring-[#0b4aa2]/20" />
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                                <Clock className="h-3 w-3" />
                                                <time>{formatNotificationTime(notification.created_at)}</time>
                                            </div>

                                            {isUnread && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0b4aa2] hover:underline"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    <span>Mark as read</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 border-dashed bg-white px-6 py-16 text-center shadow-xs">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <BellOff className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-base font-black text-slate-900">
                                No notifications
                            </h3>
                            <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
                                When alerts or arrival requests occur for your organization, they will appear here.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {notifications.total > notifications.data.length && (
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <span className="text-xs font-medium text-slate-500">
                            Showing {notifications.from} to {notifications.to} of {notifications.total} notifications
                        </span>

                        <div className="flex items-center gap-1">
                            {notifications.links.map((link, idx) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={idx}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className="rounded-xl px-3 py-1.5 text-xs text-slate-300 select-none"
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-[#0b4aa2] text-white shadow-xs'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
