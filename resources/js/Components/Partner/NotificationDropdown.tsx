import { BellIcon, CheckIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
    const [isMobile, setIsMobile] = useState(false);
    const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const page = usePage();
    const shared = page.props as {
        auth?: { user?: { unread_notifications_count?: number; notifications?: PartnerNotificationItem[] } };
        partnerNotifications?: PartnerNotificationItem[];
        partnerUnreadCount?: number;
    };

    const items = notifications.length ? notifications : (shared.partnerNotifications ?? shared.auth?.user?.notifications ?? []);
    const count = unreadCount || shared.partnerUnreadCount || shared.auth?.user?.unread_notifications_count || 0;

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const sync = () => setIsMobile(mq.matches);
        sync();
        mq.addEventListener('change', sync);

        return () => mq.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        function positionPanel() {
            if (!buttonRef.current) {
                return;
            }

            const rect = buttonRef.current.getBoundingClientRect();
            const mobile = window.matchMedia('(max-width: 639px)').matches;

            if (mobile) {
                // Full-width sheet under the sticky header, inset from edges
                setPanelStyle({
                    position: 'fixed',
                    top: Math.max(rect.bottom + 8, 64),
                    left: 12,
                    right: 12,
                    width: 'auto',
                    maxHeight: `min(70vh, ${window.innerHeight - rect.bottom - 24}px)`,
                });
            } else {
                // Desktop: right-align to the trigger, keep inside viewport
                const width = Math.min(352, window.innerWidth - 24);
                let left = rect.right - width;
                left = Math.max(12, Math.min(left, window.innerWidth - width - 12));

                setPanelStyle({
                    position: 'fixed',
                    top: rect.bottom + 10,
                    left,
                    width,
                    maxHeight: `min(24rem, ${window.innerHeight - rect.bottom - 24}px)`,
                });
            }
        }

        positionPanel();
        window.addEventListener('resize', positionPanel);
        window.addEventListener('scroll', positionPanel, true);

        return () => {
            window.removeEventListener('resize', positionPanel);
            window.removeEventListener('scroll', positionPanel, true);
        };
    }, [open]);

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            const target = event.target as Node;
            if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }
            setOpen(false);
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener('mousedown', onPointerDown);
            document.addEventListener('keydown', onKeyDown);
            // Prevent body scroll bleed on mobile sheet
            if (isMobile) {
                const prev = document.body.style.overflow;
                document.body.style.overflow = 'hidden';

                return () => {
                    document.removeEventListener('mousedown', onPointerDown);
                    document.removeEventListener('keydown', onKeyDown);
                    document.body.style.overflow = prev;
                };
            }
        }

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, isMobile]);

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

    const panel = open && (
        <>
            {/* Mobile scrim so placement and focus are obvious */}
            {isMobile && (
                <motion.div
                    key="notif-scrim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-40 bg-stone-950/25 backdrop-blur-[2px] dark:bg-black/40"
                    aria-hidden
                    onClick={() => setOpen(false)}
                />
            )}
            <motion.div
                key="notif-panel"
                ref={panelRef}
                id={menuId}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={panelStyle}
                className="z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_-16px_rgba(28,25,23,0.32)] ring-1 ring-stone-900/10 dark:bg-slate-900 dark:shadow-black/50 dark:ring-white/10"
                role="menu"
                aria-label="Notifications"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-3.5 py-2.5 dark:border-slate-800">
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

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="px-4 py-8 text-center sm:py-10">
                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 ring-1 ring-stone-900/5 dark:bg-white/5 dark:ring-white/10">
                                <EnvelopeOpenIcon className="h-5 w-5 text-stone-400 dark:text-slate-500" />
                            </div>
                            <p className="mt-3 text-[13px] font-medium text-stone-800 dark:text-slate-200">You&apos;re all caught up</p>
                            <p className="mx-auto mt-1 max-w-[220px] text-[12px] leading-relaxed text-stone-500 dark:text-slate-400">
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
                                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-primary-500' : 'bg-transparent'}`}
                                                aria-hidden
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-semibold text-stone-900 dark:text-white">
                                                    {item.title}
                                                </span>
                                                <span className="mt-0.5 line-clamp-2 block text-[12px] text-stone-500 dark:text-slate-400">
                                                    {item.body}
                                                </span>
                                                <span className="mt-1 block text-[11px] text-stone-400">{item.created_at_human}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="shrink-0 border-t border-stone-100 px-3 py-2 dark:border-slate-800">
                    <Link
                        href="/partner/notifications"
                        onClick={() => setOpen(false)}
                        className="block rounded-lg py-1.5 text-center text-[12px] font-semibold text-primary-600 transition hover:bg-primary-50 dark:hover:bg-primary-500/10"
                    >
                        View all notifications
                    </Link>
                </div>
            </motion.div>
        </>
    );

    return (
        <div className="relative" ref={rootRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
                aria-expanded={open}
                aria-haspopup="true"
                aria-controls={open ? menuId : undefined}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-800 hover:shadow-sm dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
                <BellIcon className="h-4 w-4" />
                {count > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {typeof document !== 'undefined' && createPortal(<AnimatePresence>{panel}</AnimatePresence>, document.body)}
        </div>
    );
}
