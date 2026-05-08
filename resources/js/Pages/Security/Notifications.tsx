import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BellOff, Check, CheckCircle, ChevronDown, Info, ShieldX, Trash2, User as UserIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/Security/NotificationController';

type NotificationType = 'validation' | 'denied' | 'visitor' | 'alert' | 'system' | 'info';
type Severity = 'critical' | 'warning' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
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
    notifications?: Notification[];
    pagination?: Pagination;
    unreadCount?: number;
}

const EMPTY_PAGINATION: Pagination = { current_page: 1, last_page: 1, per_page: 10, total: 0 };

const SEVERITY_OF: Record<NotificationType, Severity> = {
    denied: 'critical',
    alert: 'critical',
    system: 'warning',
    validation: 'info',
    visitor: 'info',
    info: 'info',
};

const SEVERITY_META: Record<Severity, { label: string; tone: string; pill: string; rule: string }> = {
    critical: {
        label: 'Critical',
        tone: 'text-rose-600',
        pill: 'bg-rose-50 text-rose-700 ring-rose-200',
        rule: 'border-rose-200/70',
    },
    warning: {
        label: 'Warning',
        tone: 'text-amber-600',
        pill: 'bg-amber-50 text-amber-700 ring-amber-200',
        rule: 'border-amber-200/70',
    },
    info: {
        label: 'Info',
        tone: 'text-slate-600',
        pill: 'bg-slate-100 text-slate-700 ring-slate-200',
        rule: 'border-slate-200',
    },
};

function iconFor(type: NotificationType) {
    switch (type) {
        case 'validation':
            return CheckCircle;
        case 'denied':
            return ShieldX;
        case 'visitor':
            return UserIcon;
        case 'alert':
            return AlertTriangle;
        case 'system':
            return Info;
        default:
            return Info;
    }
}

export default function NotificationsIndex({ notifications, pagination, unreadCount }: Props) {
    const safePagination = pagination ?? EMPTY_PAGINATION;
    const [items, setItems] = useState<Notification[]>(notifications ?? []);
    const [localUnread, setLocalUnread] = useState(unreadCount ?? 0);
    const [markingAll, setMarkingAll] = useState(false);

    const grouped = useMemo(() => {
        const buckets: Record<Severity, Notification[]> = { critical: [], warning: [], info: [] };
        for (const n of items) {
            buckets[SEVERITY_OF[n.type] ?? 'info'].push(n);
        }
        return buckets;
    }, [items]);

    const handleMarkRead = (id: string) => {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setLocalUnread((prev) => Math.max(0, prev - 1));
        router.post(NotificationController.markAsRead.url({ notification: id }), {}, { preserveScroll: true, preserveState: true });
    };

    const handleMarkAll = () => {
        if (localUnread === 0) return;
        setMarkingAll(true);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setLocalUnread(0);
        router.post(
            NotificationController.markAllAsRead.url(),
            {},
            { preserveScroll: true, preserveState: true, onFinish: () => setMarkingAll(false) },
        );
    };

    const handleClearAll = () => {
        if (items.length === 0) return;
        if (!confirm('Are you sure you want to delete all notifications? This cannot be undone.')) return;
        setItems([]);
        setLocalUnread(0);
        router.post(NotificationController.clearAll.url(), {}, { preserveScroll: true, preserveState: true });
    };

    const handleLoadMore = () => {
        if (safePagination.current_page >= safePagination.last_page) return;
        router.get(
            NotificationController.index.url(),
            { page: safePagination.current_page + 1 },
            { preserveScroll: true, preserveState: true, only: ['notifications', 'pagination'] },
        );
    };

    const sections: Severity[] = ['critical', 'warning', 'info'];

    return (
        <>
            <Head title="Alerts · Security" />

            {/* Header */}
            <header className="mb-6">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Alerts</p>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                            {localUnread > 0 ? `${localUnread} unread` : 'Notifications'}
                        </h1>
                    </div>
                </div>

                {/* Quick Actions Card */}
                {items.length > 0 && (
                    <div className="mt-5 flex gap-2.5">
                        <button
                            onClick={handleMarkAll}
                            disabled={markingAll || localUnread === 0}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-40 ${
                                localUnread > 0 ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-400'
                            }`}
                        >
                            <CheckCircle className="h-4 w-4" strokeWidth={2.2} />
                            {markingAll ? 'Marking…' : 'Read all'}
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]"
                        >
                            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                            Clear all
                        </button>
                    </div>
                )}
            </header>

            {items.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-6">
                    {sections.map((severity) => {
                        const list = grouped[severity];
                        if (list.length === 0) return null;
                        return <SeveritySection key={severity} severity={severity} items={list} onMarkRead={handleMarkRead} />;
                    })}

                    {safePagination.current_page < safePagination.last_page && (
                        <button
                            onClick={handleLoadMore}
                            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Load more
                            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </button>
                    )}
                </div>
            )}
        </>
    );
}

function SeveritySection({ severity, items, onMarkRead }: { severity: Severity; items: Notification[]; onMarkRead: (id: string) => void }) {
    const meta = SEVERITY_META[severity];
    const unread = items.filter((n) => !n.read).length;

    return (
        <section>
            <header className={`flex items-center gap-2 border-b ${meta.rule} pb-2`}>
                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ring-1 ring-inset ${meta.pill}`}
                >
                    {meta.label}
                </span>
                <span className="text-[11px] text-slate-500">
                    {items.length} {items.length === 1 ? 'alert' : 'alerts'}
                </span>
                {unread > 0 && <span className={`ml-auto text-[11px] font-semibold ${meta.tone}`}>{unread} unread</span>}
            </header>

            <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <AnimatePresence initial={false}>
                    {items.map((notification) => (
                        <NotificationRow key={notification.id} notification={notification} severity={severity} onMarkRead={onMarkRead} />
                    ))}
                </AnimatePresence>
            </ul>
        </section>
    );
}

function NotificationRow({
    notification,
    severity,
    onMarkRead,
}: {
    notification: Notification;
    severity: Severity;
    onMarkRead: (id: string) => void;
}) {
    const Icon = iconFor(notification.type);
    const tone = SEVERITY_META[severity].tone;

    return (
        <motion.li
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex items-start gap-3 bg-white px-4 py-3 ${notification.read ? 'opacity-70' : ''}`}
        >
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 ${tone}`}>
                <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <p className={`truncate text-sm ${notification.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                        {notification.title}
                    </p>
                    <span className="ml-auto shrink-0 font-mono text-[10px] tracking-wider text-slate-400">{notification.created_at_human}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{notification.message}</p>

                {!notification.read && (
                    <button
                        onClick={() => onMarkRead(notification.id)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 transition hover:text-emerald-800"
                    >
                        <Check className="h-3 w-3" strokeWidth={2.4} />
                        Acknowledge
                    </button>
                )}
            </div>
            {!notification.read && (
                <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        severity === 'critical' ? 'bg-rose-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    aria-label="Unread"
                />
            )}
        </motion.li>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BellOff className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">No alerts</p>
            <p className="mt-1 max-w-xs px-4 text-xs text-slate-500">
                You're all caught up. New incidents and system alerts will appear here as they happen.
            </p>
        </div>
    );
}
