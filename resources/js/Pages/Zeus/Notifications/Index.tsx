import { BellIcon, CheckCircleIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface ZeusNotificationItem {
    id: number;
    type: string;
    title: string;
    body: string;
    action_url: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string | null;
    created_at_human: string | null;
    is_unread: boolean;
}

interface Props {
    notifications: {
        data: ZeusNotificationItem[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: {
        search?: string;
        type?: string;
    };
    unreadCount: number;
}

export default function ZeusNotificationsIndex({ notifications, filters, unreadCount }: Props) {
    const { confirm } = useAdminConfirmation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? 'all');

    function applyFilters(next: { search?: string; type?: string }) {
        router.get(
            '/zeus/notifications',
            {
                search: next.search || undefined,
                type: next.type && next.type !== 'all' ? next.type : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    }

    function markAsRead(id: number, actionUrl: string | null) {
        router.post(
            `/zeus/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (actionUrl) {
                        router.visit(actionUrl);
                    }
                },
            },
        );
    }

    return (
        <ZeusLayout>
            <Head title="Notifications – Zeus" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notifications</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Platform alerts for partner requests and other Zeus activity.
                            {unreadCount > 0 && <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">{unreadCount} unread</span>}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => router.post('/zeus/notifications/read-all', {}, { preserveScroll: true })}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <CheckCircleIcon className="h-4 w-4" />
                                Mark all read
                            </button>
                        )}
                        {notifications.total > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    confirm({
                                        title: 'Clear notifications',
                                        message: 'Clear all Zeus notifications?',
                                        confirmLabel: 'Clear all',
                                        onConfirm: () => router.post('/zeus/notifications/clear-all', {}, { preserveScroll: true }),
                                    })
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0f1219]">
                    <form
                        className="relative min-w-[200px] flex-1"
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters({ search, type });
                        }}
                    >
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search notifications…"
                            aria-label="Search notifications"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                    </form>
                    <div
                        className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/5"
                        role="group"
                    >
                        {['all', 'unread', 'read'].map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setType(key);
                                    applyFilters({ search, type: key });
                                }}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                                    type === key
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
                                        : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f1219]">
                    {notifications.data.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <BellIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No notifications</p>
                            <p className="mt-1 text-sm text-slate-500">Partner estate submissions and other platform alerts will show up here.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                            {notifications.data.map((item) => (
                                <li key={item.id}>
                                    <div
                                        className={`flex gap-3 px-4 py-4 transition sm:px-5 ${
                                            item.is_unread ? 'bg-blue-50/40 dark:bg-blue-500/[0.04]' : ''
                                        }`}
                                    >
                                        <span
                                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.is_unread ? 'bg-blue-500' : 'bg-transparent'}`}
                                            aria-hidden
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                                                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{item.body}</p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {item.created_at_human}
                                                        <span className="mx-1.5">·</span>
                                                        <span className="font-medium tracking-wide uppercase">{item.type.replace(/_/g, ' ')}</span>
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 gap-2">
                                                    {item.is_unread && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.post(`/zeus/notifications/${item.id}/read`, {}, { preserveScroll: true })
                                                            }
                                                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                                                        >
                                                            Mark read
                                                        </button>
                                                    )}
                                                    {item.action_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (item.is_unread) {
                                                                    markAsRead(item.id, item.action_url);
                                                                } else {
                                                                    router.visit(item.action_url!);
                                                                }
                                                            }}
                                                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                                                        >
                                                            Open
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => router.delete(`/zeus/notifications/${item.id}`, { preserveScroll: true })}
                                                        className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                        aria-label="Delete notification"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {notifications.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-white/5">
                            <p className="text-xs text-slate-500">
                                Page {notifications.current_page} of {notifications.last_page}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={!notifications.prev_page_url}
                                    onClick={() => notifications.prev_page_url && router.visit(notifications.prev_page_url)}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold disabled:opacity-40 dark:border-white/10"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={!notifications.next_page_url}
                                    onClick={() => notifications.next_page_url && router.visit(notifications.next_page_url)}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold disabled:opacity-40 dark:border-white/10"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ZeusLayout>
    );
}
