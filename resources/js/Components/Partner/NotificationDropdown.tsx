import {
    BellIcon,
    CheckIcon,
    EnvelopeOpenIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export interface PartnerNotificationItem {
    id: string;
    title: string;
    body: string;
    href: string | null;
    read_at: string | null;
    created_at_human: string;
    type: string;
}

interface Props {
    notifications?: PartnerNotificationItem[];
    unreadCount?: number;
}

function resolveHref(item: PartnerNotificationItem): string {
    if (item.href) {
        return item.href;
    }

    return '/partner/notifications';
}

export default function NotificationDropdown({ notifications = [], unreadCount = 0 }: Props) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const page = usePage();
    const shared = page.props as {
        auth?: { user?: { unread_notifications_count?: number; notifications?: PartnerNotificationItem[] } };
        partnerNotifications?: PartnerNotificationItem[];
        partnerUnreadCount?: number;
    };

    const items = notifications.length
        ? notifications
        : (shared.partnerNotifications ?? shared.auth?.user?.notifications ?? []);
    const count = unreadCount || shared.partnerUnreadCount || shared.auth?.user?.unread_notifications_count || 0;

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    function markAsRead(id: string, href: string | null) {
        router.post(
            `/partner/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (href) {
                        router.visit(href);
                    }
                },
            },
        );
    }

    function markAllAsRead() {
        router.post('/partner/notifications/read-all', {}, { preserveScroll: true });
    }

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
                aria-expanded={open}
                aria-haspopup="true"
                className="relative rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
                <BellIcon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10 ring-1 ring-black/[0.04] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40 dark:ring-white/5"
                        role="menu"
                    >
                        <div className="flex items-center justify-between border-b border-stone-100 px-3.5 py-2.5 dark:border-slate-800">
                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Notifications</p>
                            {count > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-500"
                                >
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <EnvelopeOpenIcon className="mx-auto h-8 w-8 text-stone-300 dark:text-slate-600" />
                                    <p className="mt-2 text-[13px] font-medium text-stone-700 dark:text-slate-200">
                                        You&apos;re all caught up
                                    </p>
                                    <p className="mt-1 text-[12px] text-stone-500 dark:text-slate-400">
                                        Estate updates, settlements, and account alerts will appear here.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-stone-100 dark:divide-slate-800">
                                    {items.map((item) => {
                                        const unread = !item.read_at;
                                        const href = resolveHref(item);

                                        return (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={() => {
                                                        setOpen(false);
                                                        if (unread) {
                                                            markAsRead(item.id, href);
                                                        } else {
                                                            router.visit(href);
                                                        }
                                                    }}
                                                    className={`flex w-full gap-3 px-3.5 py-3 text-left transition hover:bg-stone-50 dark:hover:bg-slate-800/60 ${
                                                        unread ? 'bg-primary-50/40 dark:bg-primary-500/5' : ''
                                                    }`}
                                                >
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                            unread ? 'bg-primary-500' : 'bg-transparent'
                                                        }`}
                                                        aria-hidden
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-[13px] font-semibold text-stone-900 dark:text-white">
                                                            {item.title}
                                                        </span>
                                                        <span className="mt-0.5 line-clamp-2 block text-[12px] text-stone-500 dark:text-slate-400">
                                                            {item.body}
                                                        </span>
                                                        <span className="mt-1 block text-[11px] text-stone-400">
                                                            {item.created_at_human}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="border-t border-stone-100 px-3 py-2 dark:border-slate-800">
                            <Link
                                href="/partner/notifications"
                                onClick={() => setOpen(false)}
                                className="block rounded-lg py-1.5 text-center text-[12px] font-semibold text-primary-600 transition hover:bg-primary-50 dark:hover:bg-primary-500/10"
                            >
                                View all notifications
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
