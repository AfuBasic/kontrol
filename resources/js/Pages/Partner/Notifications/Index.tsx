import { BellIcon, CheckIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import EmptyState from '@/Components/Partner/EmptyState';
import PageHeader from '@/Components/Partner/PageHeader';
import Surface from '@/Components/Partner/Surface';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface NotificationItem {
    id: string;
    title: string;
    body: string;
    href: string | null;
    read_at: string | null;
    created_at_human: string;
    type: string;
}

interface Props {
    notifications: {
        data: NotificationItem[];
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

export default function PartnerNotificationsIndex({ notifications, filters, unreadCount }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? 'all');
    const [clearing, setClearing] = useState(false);
    const hasNotifications = notifications.total > 0;

    function applyFilters(next: { search?: string; type?: string }) {
        router.get(
            '/partner/notifications',
            {
                search: next.search || undefined,
                type: next.type && next.type !== 'all' ? next.type : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    }

    function markAsRead(id: string, href: string | null) {
        router.post(
            `/partner/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (href) router.visit(href);
                },
            },
        );
    }

    function clearAllNotifications() {
        if (clearing || !hasNotifications) {
            return;
        }

        if (!window.confirm('Clear all notifications? This cannot be undone.')) {
            return;
        }

        setClearing(true);
        router.post(
            '/partner/notifications/clear-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setClearing(false),
            },
        );
    }

    return (
        <PartnerLayout>
            <Head title="Notifications" />

            <div className="space-y-4">
                <PageHeader
                    title="Notifications"
                    description="Estate updates, settlements, and account alerts."
                    actions={
                        hasNotifications || unreadCount > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {unreadCount > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post('/partner/notifications/read-all', {}, { preserveScroll: true })
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        Mark all read
                                    </button>
                                ) : null}
                                {hasNotifications ? (
                                    <button
                                        type="button"
                                        onClick={clearAllNotifications}
                                        disabled={clearing}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                        {clearing ? 'Clearing…' : 'Clear all'}
                                    </button>
                                ) : null}
                            </div>
                        ) : undefined
                    }
                />

                <Surface padding="sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <form
                            className="relative min-w-[180px] flex-1"
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilters({ search, type });
                            }}
                        >
                            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search notifications…"
                                aria-label="Search notifications"
                                className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pr-3 pl-8 text-[13px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                        </form>
                        <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60" role="group">
                            {['all', 'unread', 'read'].map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        setType(key);
                                        applyFilters({ search, type: key });
                                    }}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                                        type === key
                                            ? 'bg-white text-stone-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                            : 'text-stone-500 dark:text-slate-400'
                                    }`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                </Surface>

                <Surface padding="none">
                    {notifications.data.length === 0 ? (
                        <EmptyState
                            icon={BellIcon}
                            title="No notifications"
                            description={
                                type === 'unread'
                                    ? 'You have no unread alerts right now.'
                                    : 'When estates move status or settlements process, you will see them here.'
                            }
                            nextStep="Submit estates and track commissions to generate activity."
                            action={{ label: 'Go to workspace', href: '/partner/dashboard' }}
                        />
                    ) : (
                        <ul className="divide-y divide-stone-100 dark:divide-slate-800">
                            {notifications.data.map((item) => {
                                const unread = !item.read_at;

                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (unread) {
                                                    markAsRead(item.id, item.href);
                                                } else if (item.href) {
                                                    router.visit(item.href);
                                                }
                                            }}
                                            className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-stone-50 dark:hover:bg-slate-800/50 ${
                                                unread ? 'bg-primary-50/30 dark:bg-primary-500/[0.04]' : ''
                                            }`}
                                        >
                                            <span
                                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-primary-500' : 'bg-transparent'}`}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-[10px] text-stone-400">{item.created_at_human}</span>
                                                </span>
                                                <span className="mt-0.5 block text-[12px] text-stone-500 dark:text-slate-400">
                                                    {item.body}
                                                </span>
                                                {item.href && (
                                                    <span className="mt-1 inline-block text-[11px] font-semibold text-primary-600">
                                                        Open →
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {notifications.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5 dark:border-slate-800">
                            <p className="text-[11px] text-stone-500">
                                Page {notifications.current_page} of {notifications.last_page}
                            </p>
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    disabled={!notifications.prev_page_url}
                                    onClick={() => notifications.prev_page_url && router.visit(notifications.prev_page_url)}
                                    className="rounded-md border border-stone-200 px-2.5 py-1 text-[11px] font-semibold disabled:opacity-40 dark:border-slate-700"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={!notifications.next_page_url}
                                    onClick={() => notifications.next_page_url && router.visit(notifications.next_page_url)}
                                    className="rounded-md border border-stone-200 px-2.5 py-1 text-[11px] font-semibold disabled:opacity-40 dark:border-slate-700"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </Surface>
            </div>
        </PartnerLayout>
    );
}
