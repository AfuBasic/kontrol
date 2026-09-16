import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    Bell,
    BellOff,
    Check,
    CheckCheck,
    CheckCircle2,
    ChevronDown,
    Clock,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import MobileSheet from '@/Components/MobileSheet';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
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
        read_status?: 'all' | 'unread' | 'read';
        sort?: 'latest' | 'oldest';
    };
}

const READ_STATUSES: { value: 'all' | 'unread' | 'read'; label: string; description: string }[] = [
    { value: 'all', label: 'All notifications', description: 'Show both read and unread alerts' },
    { value: 'unread', label: 'Unread only', description: 'Show alerts needing your review' },
    { value: 'read', label: 'Read only', description: 'Show previously viewed notifications' },
];

export default function Notifications({
    organization,
    membership,
    notifications,
    unreadCount,
    filters = {},
}: Props) {
    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedReadStatus, setSelectedReadStatus] = useState<'all' | 'unread' | 'read'>(
        filters.read_status || 'all'
    );
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>(filters.sort || 'latest');

    // UI overlays
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

    // Sheet draft state
    const [draftReadStatus, setDraftReadStatus] = useState(selectedReadStatus);

    const sortMenuRef = useRef<HTMLDivElement>(null);

    // Close sort menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
                setIsSortMenuOpen(false);
            }
        };
        if (isSortMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSortMenuOpen]);

    // Apply filters through Inertia
    const applyFilters = (
        newSearch: string,
        newReadStatus: 'all' | 'unread' | 'read',
        newSort: 'latest' | 'oldest'
    ) => {
        router.get(
            '/org/notifications',
            {
                search: newSearch || undefined,
                read_status: newReadStatus !== 'all' ? newReadStatus : undefined,
                sort: newSort !== 'latest' ? newSort : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            applyFilters(search, selectedReadStatus, sortOrder);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        applyFilters('', selectedReadStatus, sortOrder);
    };

    // Quick filter: Toggle Unread state directly from toolbar
    const handleQuickUnreadToggle = () => {
        const nextStatus = selectedReadStatus === 'unread' ? 'all' : 'unread';
        setSelectedReadStatus(nextStatus);
        setDraftReadStatus(nextStatus);
        applyFilters(search, nextStatus, sortOrder);
    };

    // Open Bottom Sheet
    const openFilterSheet = () => {
        setDraftReadStatus(selectedReadStatus);
        setIsFilterSheetOpen(true);
    };

    // Apply choices from Bottom Sheet
    const handleApplySheetFilters = () => {
        setSelectedReadStatus(draftReadStatus);
        setIsFilterSheetOpen(false);
        applyFilters(search, draftReadStatus, sortOrder);
    };

    // Reset within Bottom Sheet
    const handleResetSheetFilters = () => {
        setDraftReadStatus('all');
    };

    // Clear all filters
    const handleClearAll = () => {
        setSearch('');
        setSelectedReadStatus('all');
        setDraftReadStatus('all');
        setSortOrder('latest');
        applyFilters('', 'all', 'latest');
    };

    // Handle Sort change
    const handleSelectSort = (newSort: 'latest' | 'oldest') => {
        setSortOrder(newSort);
        setIsSortMenuOpen(false);
        applyFilters(search, selectedReadStatus, newSort);
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

    // Derived flags
    const isUnreadQuickActive = selectedReadStatus === 'unread';
    const activeSheetFilterCount = selectedReadStatus === 'read' ? 1 : 0;
    const hasActiveFilters = Boolean(search || selectedReadStatus !== 'all' || sortOrder !== 'latest');

    return (
        <OrganizationLayout title="Notifications" contentClassName="max-w-4xl">
            <Head title={`${organization.name} - Notifications`} />

            <div className="space-y-5">
                {/* 1. Header Card with Title & Actions */}
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

                {/* 2. Compact Mobile-First Filter Toolbar */}
                <div className="space-y-2.5">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search notifications..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:outline-none focus:ring-1 focus:ring-[#0b4aa2]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Clear search"
                                aria-label="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Controls Row: Quick Filter [Unread] + [Filter] + [Sort] */}
                    <div className="flex items-center gap-2">
                        {/* Quick Filter: Unread toggle */}
                        <button
                            type="button"
                            onClick={handleQuickUnreadToggle}
                            aria-pressed={isUnreadQuickActive}
                            className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                                isUnreadQuickActive
                                    ? 'bg-[#0b4aa2] text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                    isUnreadQuickActive ? 'bg-white' : 'bg-[#0b4aa2]'
                                }`}
                            />
                            <span>Unread</span>
                        </button>

                        {/* Filter Button (Opens Sheet) */}
                        <button
                            type="button"
                            onClick={openFilterSheet}
                            className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                                activeSheetFilterCount > 0
                                    ? 'border-[#0b4aa2]/40 bg-[#eaf2ff] text-[#0b4aa2]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            aria-label={`Open filters${activeSheetFilterCount > 0 ? `, ${activeSheetFilterCount} active` : ''}`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                            <span>Filter</span>
                            {activeSheetFilterCount > 0 && (
                                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0b4aa2] px-1 text-[10px] font-bold text-white leading-none">
                                    {activeSheetFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Sort Dropdown Anchor */}
                        <div className="relative ml-auto" ref={sortMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                aria-haspopup="true"
                                aria-expanded={isSortMenuOpen}
                            >
                                <ArrowDown
                                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                                        sortOrder === 'oldest' ? 'rotate-180' : ''
                                    }`}
                                />
                                <span>{sortOrder === 'latest' ? 'Newest' : 'Oldest'}</span>
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                            </button>

                            {/* Sort Menu Sheet */}
                            <ResponsiveSheet isOpen={isSortMenuOpen} onClose={() => setIsSortMenuOpen(false)} maxWidth="sm">
                                <div className="p-4 sm:p-6 pb-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Sort By</h3>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectSort('latest')}
                                            className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                                        >
                                            <span>Newest first</span>
                                            {sortOrder === 'latest' && <Check className="h-5 w-5 text-[#0b4aa2]" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectSort('oldest')}
                                            className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                                        >
                                            <span>Oldest first</span>
                                            {sortOrder === 'oldest' && <Check className="h-5 w-5 text-[#0b4aa2]" />}
                                        </button>
                                    </div>
                                </div>
                            </ResponsiveSheet>
                        </div>
                    </div>

                    {/* Active Filter Removable Summary Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {search && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                                    <span>"{search}"</span>
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="text-slate-400 hover:text-slate-700"
                                        aria-label="Remove search filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            {selectedReadStatus === 'read' && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                                    <span>Read only</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedReadStatus('all');
                                            setDraftReadStatus('all');
                                            applyFilters(search, 'all', sortOrder);
                                        }}
                                        className="text-slate-400 hover:text-slate-700"
                                        aria-label="Remove read filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-[11px] font-medium text-[#0b4aa2] hover:text-[#082f6e] ml-1"
                            >
                                Reset all
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. Notifications Feed */}
                <div className="space-y-3">
                    {notifications.data.length > 0 ? (
                        notifications.data.map((notification) => {
                            const actionUrl =
                                notification.data.action_url || notification.data.url;
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
                                {hasActiveFilters
                                    ? 'No notifications match your current filter criteria.'
                                    : 'When alerts or arrival requests occur for your organization, they will appear here.'}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="mt-4 inline-flex items-center rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
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

            {/* Filter Mobile Bottom Sheet */}
            <MobileSheet
                isOpen={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filter Notifications"
            >
                <div className="space-y-5 px-6 pb-6 pt-2">
                    {/* Read Status Group */}
                    <div>
                        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Read Status
                        </label>
                        <div className="mt-2.5 space-y-1.5">
                            {READ_STATUSES.map((status) => {
                                const isSelected = draftReadStatus === status.value;
                                return (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => setDraftReadStatus(status.value)}
                                        className={`w-full min-h-[44px] flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                                            isSelected
                                                ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-200'
                                                : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-xs font-semibold">{status.label}</p>
                                            <p className="text-[11px] text-slate-500 font-normal">
                                                {status.description}
                                            </p>
                                        </div>
                                        <div
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                isSelected
                                                    ? 'border-[#0b4aa2] bg-[#0b4aa2] text-white'
                                                    : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sheet Footer Action Buttons */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleResetSheetFilters}
                            className="min-h-[44px] flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleApplySheetFilters}
                            className="min-h-[44px] flex-2 rounded-xl bg-[#0b4aa2] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#082f6e] transition-colors"
                        >
                            Show results
                        </button>
                    </div>
                </div>
            </MobileSheet>
        </OrganizationLayout>
    );
}
