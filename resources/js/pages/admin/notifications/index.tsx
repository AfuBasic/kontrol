import { BellIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import AdminLayout from '@/layouts/AdminLayout';
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
        filter?: string;
    };
}

export default function NotificationsIndex({ notifications, filters }: Props) {
    const { name } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [filter, setFilter] = useState(filters.filter || 'all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            // @ts-ignore - route helper available via global or ziggy
            window.route('admin.notifications.index'),
            { search, filter: filter !== 'all' ? filter : undefined },
            { preserveState: true },
        );
    };

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        router.get(
            // @ts-ignore
            window.route('admin.notifications.index'),
            { search, filter: newFilter !== 'all' ? newFilter : undefined },
            { preserveState: true },
        );
    };

    const markAsRead = (id: string) => {
        // @ts-ignore
        router.patch(window.route('admin.notifications.read', id));
    };

    const markAllAsRead = () => {
        // @ts-ignore
        router.post(window.route('admin.notifications.read-all'));
    };

    return (
        <AdminLayout>
            <Head title={`Notifications - ${name}`} />

            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    <p className="mt-1 text-sm text-slate-500">View and manage your system notifications.</p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        onClick={markAllAsRead}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
                    >
                        <CheckCircleIcon className="h-5 w-5 text-slate-400" />
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <form onSubmit={handleSearch} className="relative max-w-sm flex-1">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search notifications..."
                        className="w-full rounded-lg border-slate-200 py-2 pr-10 pl-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </form>

                {/* Filters */}
                <div className="flex gap-2">
                    {['all', 'unread', 'read'].map((f) => (
                        <button
                            key={f}
                            onClick={() => handleFilterChange(f)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                filter === f
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="ring-opacity-5 overflow-hidden shadow ring-1 ring-black sm:rounded-lg">
                            {notifications.data.length > 0 ? (
                                <ul role="list" className="divide-y divide-slate-100 bg-white">
                                    {notifications.data.map((notification) => (
                                        <li
                                            key={notification.id}
                                            className={`relative flex justify-between gap-x-6 px-4 py-5 hover:bg-slate-50 sm:px-6 ${
                                                !notification.read_at ? 'bg-blue-50/50' : ''
                                            }`}
                                        >
                                            <div className="flex min-w-0 gap-x-4">
                                                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-blue-100">
                                                    <BellIcon className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-auto">
                                                    <p className="text-sm leading-6 font-semibold text-slate-900">
                                                        {notification.data.message || 'New notification'}
                                                    </p>
                                                    <p className="mt-1 flex text-xs leading-5 text-slate-500">
                                                        <time dateTime={notification.created_at}>
                                                            {new Date(notification.created_at).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </time>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-x-4">
                                                {!notification.read_at && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                                {/* <ChevronRightIcon className="h-5 w-5 flex-none text-slate-400" aria-hidden="true" /> */}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center bg-white py-12 text-center">
                                    <BellIcon className="h-12 w-12 text-slate-300" />
                                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No notifications found</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Try adjusting your search or filter to find what you're looking for.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination Component would go here - using simple links for now if custom one not available */}
            {notifications.total > notifications.data.length && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        {notifications.links[0].url && (
                            <Link
                                href={notifications.links[0].url}
                                className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Previous
                            </Link>
                        )}
                        {notifications.links[notifications.links.length - 1].url && (
                            <Link
                                href={notifications.links[notifications.links.length - 1].url!}
                                className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                    {/* Simplified Desktop Pagination */}
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                Showing <span className="font-medium">{notifications.from}</span> to{' '}
                                <span className="font-medium">{notifications.to}</span> of <span className="font-medium">{notifications.total}</span>{' '}
                                results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                {notifications.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                            link.active
                                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : 'text-slate-900 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus:z-20 focus:outline-offset-0'
                                        } ${i === 0 ? 'rounded-l-md' : ''} ${
                                            i === notifications.links.length - 1 ? 'rounded-r-md' : ''
                                        } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
