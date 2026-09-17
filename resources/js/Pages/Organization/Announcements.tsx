import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDown,
    Building2,
    Check,
    ChevronDown,
    ChevronRight,
    FileText,
    MessageSquare,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import MobileSheet from '@/Components/MobileSheet';
import ResponsiveSheet from '@/Components/Organization/ResponsiveSheet';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { PostMedia } from '@/types';
import { extractAnnouncementPreview } from '@/Utils/announcementPreview';

interface Post {
    id: number;
    hashid?: string;
    title: string | null;
    body: string;
    category: string;
    priority: string;
    is_read: boolean;
    read_at: string | null;
    published_at: string | null;
    published_at_human: string;
    publisher_name: string;
    publisher_role: string;
    author_name: string | null;
    comments_count: number;
    media_count: number;
    media?: PostMedia[];
}

interface CursorPaginatedPosts {
    data: Post[];
    next_cursor: string | null;
    prev_cursor: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    per_page: number;
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        estate_name?: string;
    };
    estate?: {
        id: number;
        name: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    unread_count?: number;
    filters?: {
        search?: string;
        category?: string;
        read_status?: 'all' | 'unread' | 'read';
        sort?: 'latest' | 'oldest';
    };
    posts: CursorPaginatedPosts;
}

const CATEGORY_META: Record<string, { label: string; tone: string }> = {
    general: { label: 'Notice', tone: 'text-slate-700 bg-slate-100 border-slate-200/60' },
    meeting: { label: 'Meeting', tone: 'text-sky-700 bg-sky-50 border-sky-200/60' },
    maintenance: { label: 'Maintenance', tone: 'text-amber-800 bg-amber-50 border-amber-200/60' },
    security: { label: 'Security', tone: 'text-rose-700 bg-rose-50 border-rose-200/60' },
    event: { label: 'Community Event', tone: 'text-indigo-700 bg-indigo-50 border-indigo-200/60' },
};

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'Notices' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'security', label: 'Security' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'event', label: 'Events' },
];

const READ_STATUSES: { value: 'all' | 'unread' | 'read'; label: string; description: string }[] = [
    { value: 'all', label: 'All announcements', description: 'Show both read and unread notices' },
    { value: 'unread', label: 'Unread only', description: 'Show updates you have not opened yet' },
    { value: 'read', label: 'Read only', description: 'Show previously viewed updates' },
];

function formatFeedTimestamp(publishedAt: string | null, humanFallback: string): string {
    if (!publishedAt) return humanFallback;
    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) return humanFallback;

    const now = new Date();
    const timeString = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const dateString = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    return `${dateString} · ${timeString}`;
}

export default function Announcements({ organization, estate, membership, unread_count = 0, filters = {}, posts }: Props) {
    const estateName = estate?.name || organization.estate_name || 'Golden Heights';
    const [items, setItems] = useState<Post[]>(posts.data);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(posts.next_page_url);

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedReadStatus, setSelectedReadStatus] = useState<'all' | 'unread' | 'read'>(filters.read_status || 'all');
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>(filters.sort || 'latest');

    // UI overlays
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

    // Sheet draft states (to allow deliberate "Show results" apply)
    const [draftCategory, setDraftCategory] = useState(selectedCategory);
    const [draftReadStatus, setDraftReadStatus] = useState(selectedReadStatus);

    const sortMenuRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    // Sync when fresh props arrive from initial page navigation or filter visits
    useEffect(() => {
        setItems(posts.data);
        setNextPageUrl(posts.next_page_url);
    }, [posts]);

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

    // Apply filters through Inertia (backend authoritative)
    const applyFilters = (newSearch: string, newCategory: string, newReadStatus: 'all' | 'unread' | 'read', newSort: 'latest' | 'oldest') => {
        router.get(
            '/org/announcements',
            {
                search: newSearch || undefined,
                category: newCategory !== 'all' ? newCategory : undefined,
                read_status: newReadStatus !== 'all' ? newReadStatus : undefined,
                sort: newSort !== 'latest' ? newSort : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            applyFilters(search, selectedCategory, selectedReadStatus, sortOrder);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        applyFilters('', selectedCategory, selectedReadStatus, sortOrder);
    };

    // Quick filter: Toggle Unread state directly from toolbar
    const handleQuickUnreadToggle = () => {
        const nextStatus = selectedReadStatus === 'unread' ? 'all' : 'unread';
        setSelectedReadStatus(nextStatus);
        setDraftReadStatus(nextStatus);
        applyFilters(search, selectedCategory, nextStatus, sortOrder);
    };

    // Open Bottom Sheet with fresh draft state
    const openFilterSheet = () => {
        setDraftCategory(selectedCategory);
        setDraftReadStatus(selectedReadStatus);
        setIsFilterSheetOpen(true);
    };

    // Apply choices from Bottom Sheet
    const handleApplySheetFilters = () => {
        setSelectedCategory(draftCategory);
        setSelectedReadStatus(draftReadStatus);
        setIsFilterSheetOpen(false);
        applyFilters(search, draftCategory, draftReadStatus, sortOrder);
    };

    // Reset within Bottom Sheet
    const handleResetSheetFilters = () => {
        setDraftCategory('all');
        setDraftReadStatus('all');
    };

    // Clear all filters from toolbar/empty state
    const handleClearAll = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedReadStatus('all');
        setDraftCategory('all');
        setDraftReadStatus('all');
        setSortOrder('latest');
        applyFilters('', 'all', 'all', 'latest');
    };

    // Handle Sort change from menu
    const handleSelectSort = (newSort: 'latest' | 'oldest') => {
        setSortOrder(newSort);
        setIsSortMenuOpen(false);
        applyFilters(search, selectedCategory, selectedReadStatus, newSort);
    };

    const loadMore = useCallback(() => {
        if (!nextPageUrl || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.get(
            nextPageUrl,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onSuccess: (page) => {
                    const newPosts = (page.props as any).posts as CursorPaginatedPosts;
                    setItems((prev) => {
                        const existingIds = new Set(prev.map((p) => p.id));
                        const uniqueNew = newPosts.data.filter((p) => !existingIds.has(p.id));
                        return [...prev, ...uniqueNew];
                    });
                    setNextPageUrl(newPosts.next_page_url);
                },
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [nextPageUrl]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 },
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore]);

    // Active sheet filter count (excluding default 'all')
    const activeSheetFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedReadStatus === 'read' ? 1 : 0);

    const hasActiveFilters = Boolean(
        filters.search ||
        (filters.category && filters.category !== 'all') ||
        (filters.read_status && filters.read_status !== 'all') ||
        (filters.sort && filters.sort !== 'latest'),
    );

    const isUnreadQuickActive = selectedReadStatus === 'unread';

    return (
        <OrganizationLayout title="Announcements" contentClassName="max-w-xl">
            <Head title={`Updates - ${estateName}`} />

            <div className="pb-16 text-left">
                {/* 1. Page Header */}
                <header className="flex items-baseline justify-between px-1 py-3 sm:py-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Updates</h1>
                        <p className="text-xs font-medium text-slate-500">{estateName}</p>
                    </div>

                    {unread_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            {unread_count} new
                        </span>
                    )}
                </header>

                {/* 2. Mobile Search & Filter Toolbar */}
                <div className="mb-3 space-y-2">
                    {/* Search Field */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search updates..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-9 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                                isUnreadQuickActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${isUnreadQuickActive ? 'bg-white' : 'bg-blue-600'}`} />
                            <span>Unread</span>
                        </button>

                        {/* Filter Button (Opens Sheet) */}
                        <button
                            type="button"
                            onClick={openFilterSheet}
                            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                                activeSheetFilterCount > 0
                                    ? 'border-blue-300 bg-blue-50/80 text-blue-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            aria-label={`Open filters${activeSheetFilterCount > 0 ? `, ${activeSheetFilterCount} active` : ''}`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                            <span>Filter</span>
                            {activeSheetFilterCount > 0 && (
                                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] leading-none font-bold text-white">
                                    {activeSheetFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Sort Dropdown Anchor */}
                        <div className="relative ml-auto" ref={sortMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                aria-haspopup="true"
                                aria-expanded={isSortMenuOpen}
                            >
                                <ArrowDown
                                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${sortOrder === 'oldest' ? 'rotate-180' : ''}`}
                                />
                                <span>{sortOrder === 'latest' ? 'Newest' : 'Oldest'}</span>
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                            </button>

                            {/* Sort Menu Sheet */}
                            <ResponsiveSheet isOpen={isSortMenuOpen} onClose={() => setIsSortMenuOpen(false)} maxWidth="sm">
                                <div className="p-4 pb-6 sm:p-6">
                                    <h3 className="mb-4 px-2 text-lg font-bold text-slate-900">Sort By</h3>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectSort('latest')}
                                            className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                                        >
                                            <span>Newest first</span>
                                            {sortOrder === 'latest' && <Check className="h-5 w-5 text-[#0b4aa2]" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectSort('oldest')}
                                            className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                                        >
                                            <span>Oldest first</span>
                                            {sortOrder === 'oldest' && <Check className="h-5 w-5 text-[#0b4aa2]" />}
                                        </button>
                                    </div>
                                </div>
                            </ResponsiveSheet>
                        </div>
                    </div>

                    {/* Active Filter Removable Summary Chips (Only when filters are active) */}
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

                            {selectedCategory !== 'all' && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                                    <span>{CATEGORY_META[selectedCategory]?.label || selectedCategory}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory('all');
                                            setDraftCategory('all');
                                            applyFilters(search, 'all', selectedReadStatus, sortOrder);
                                        }}
                                        className="text-slate-400 hover:text-slate-700"
                                        aria-label="Remove category filter"
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
                                            applyFilters(search, selectedCategory, 'all', sortOrder);
                                        }}
                                        className="text-slate-400 hover:text-slate-700"
                                        aria-label="Remove read filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            <button type="button" onClick={handleClearAll} className="ml-1 text-[11px] font-medium text-blue-600 hover:text-blue-800">
                                Reset all
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. Community Stream Feed or Empty State */}
                {items.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-16 text-center shadow-xs sm:py-20">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Building2 className="h-6 w-6 stroke-[1.5]" />
                        </div>
                        <h2 className="mt-4 text-base font-semibold text-slate-900">
                            {hasActiveFilters ? 'No matching updates' : "You're all caught up"}
                        </h2>
                        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed font-normal text-slate-500 sm:text-sm">
                            {hasActiveFilters
                                ? 'Try changing your search terms or filter criteria to find what you are looking for.'
                                : `There aren't any estate updates yet. New announcements from ${estateName} will appear here.`}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="mt-4 inline-flex items-center rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-2 space-y-3">
                        {items.map((post) => {
                            const isUnread = !post.is_read;
                            const isCritical = post.priority === 'critical';
                            const isImportant = post.priority === 'important';
                            const preview = extractAnnouncementPreview(post.body, 220);
                            const category = CATEGORY_META[post.category] || {
                                label: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Notice',
                                tone: 'text-slate-600 bg-slate-100/80',
                            };
                            const timeLabel = formatFeedTimestamp(post.published_at, post.published_at_human);

                            const images = post.media?.filter((m) => m.mime_type?.startsWith('image/')) || [];
                            const nonImageMedia = post.media?.filter((m) => !m.mime_type?.startsWith('image/')) || [];
                            const postDetailUrl = `/org/announcements/${post.hashid || post.id}`;

                            const initial = (estateName || 'E').charAt(0).toUpperCase();

                            return (
                                <article
                                    key={post.id}
                                    className={`relative rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-slate-300 hover:shadow-xs sm:rounded-2xl ${
                                        isCritical
                                            ? 'border-rose-200/90'
                                            : isUnread
                                              ? 'border-slate-200/90 ring-1 ring-blue-500/15'
                                              : 'border-slate-200/80'
                                    }`}
                                >
                                    {/* Critical Advisory Top Strip */}
                                    {isCritical && (
                                        <div className="flex items-center gap-1.5 rounded-t-xl border-b border-rose-100 bg-rose-50/80 px-3.5 py-1.5 text-[11px] font-semibold text-rose-700 sm:rounded-t-2xl sm:px-4">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                                            <span>Urgent Estate Advisory</span>
                                        </div>
                                    )}

                                    <div className="p-3.5 sm:p-4">
                                        {/* 1. Header: Publisher & Context */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                {/* Compact Avatar with restrained unread indicator */}
                                                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                                                    <span>{initial}</span>
                                                    {isUnread && (
                                                        <span
                                                            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"
                                                            title="Unread notice"
                                                        />
                                                    )}
                                                </div>

                                                {/* Publisher Identity & Meta */}
                                                <div className="min-w-0 flex-1 leading-tight">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate text-[13px] font-semibold text-slate-900">
                                                            {post.publisher_name || estateName}
                                                        </span>
                                                        {isUnread && (
                                                            <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 ring-1 ring-blue-100">
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                                        {post.publisher_role || 'Estate Management'} · {timeLabel}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Restrained Urgent/Important Pill or Quiet Category */}
                                            <div className="flex shrink-0 items-center gap-1.5">
                                                {isImportant && !isCritical && (
                                                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200/60">
                                                        Important
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 2. Content Area */}
                                        <div className="mt-2.5">
                                            {/* Headline / Title */}
                                            {post.title && (
                                                <h2 className="text-[15px] leading-snug font-semibold tracking-tight text-slate-950 sm:text-base">
                                                    <Link href={postDetailUrl} className="transition-colors hover:text-blue-600">
                                                        {post.title}
                                                    </Link>
                                                </h2>
                                            )}

                                            {/* Clean Body Preview */}
                                            {preview && (
                                                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed font-normal text-slate-600 sm:line-clamp-3">
                                                    {preview}
                                                </p>
                                            )}
                                        </div>

                                        {/* Media Preview (Compact & Clean) */}
                                        {images.length > 0 && (
                                            <div className="mt-2.5 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                                <Link href={postDetailUrl} className="group/img block">
                                                    {images.length === 1 ? (
                                                        <div className="aspect-16/9 w-full overflow-hidden bg-slate-100 sm:aspect-2/1">
                                                            <img
                                                                src={images[0].url}
                                                                alt={post.title || 'Notice attachment'}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-[1.01]"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-1 bg-slate-100">
                                                            {images.slice(0, 2).map((img, idx) => (
                                                                <div key={img.id || idx} className="relative aspect-4/3 overflow-hidden bg-slate-200">
                                                                    <img
                                                                        src={img.url}
                                                                        alt={post.title || 'Notice attachment'}
                                                                        className="h-full w-full object-cover"
                                                                        loading="lazy"
                                                                    />
                                                                    {idx === 1 && images.length > 2 && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-xs font-semibold text-white backdrop-blur-xs">
                                                                            +{images.length - 2} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Link>
                                            </div>
                                        )}

                                        {/* Document Attachments indicator */}
                                        {nonImageMedia.length > 0 && (
                                            <Link
                                                href={postDetailUrl}
                                                className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                            >
                                                <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                <span className="truncate">
                                                    {nonImageMedia.length} document attachment{nonImageMedia.length > 1 ? 's' : ''}
                                                </span>
                                                <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-slate-400" />
                                            </Link>
                                        )}

                                        {/* 3. Footer: Engagement & Category Context */}
                                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                                            {/* Discussion / Comment Affordance */}
                                            <Link
                                                href={`${postDetailUrl}#discussion`}
                                                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                                <span>
                                                    {post.comments_count > 0
                                                        ? `${post.comments_count} ${post.comments_count === 1 ? 'comment' : 'comments'}`
                                                        : 'Comment'}
                                                </span>
                                            </Link>

                                            {/* Quiet Category Pill */}
                                            <span className="text-[11px] font-medium text-slate-500">{category.label}</span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                        {/* Infinite Scroll Trigger Indicator */}
                        {nextPageUrl && (
                            <div ref={loadMoreRef} className="flex justify-center py-6">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Filter Sheet */}
            <MobileSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter updates">
                <div className="space-y-6 pt-1">
                    {/* Status Group */}
                    <div>
                        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Read Status</label>
                        <div className="mt-2.5 space-y-1.5">
                            {READ_STATUSES.map((status) => {
                                const isSelected = draftReadStatus === status.value;
                                return (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => setDraftReadStatus(status.value)}
                                        className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                                            isSelected
                                                ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-200'
                                                : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-xs font-semibold">{status.label}</p>
                                            <p className="text-[11px] font-normal text-slate-500">{status.description}</p>
                                        </div>
                                        <div
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Group */}
                    <div>
                        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Category</label>
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                            {CATEGORIES.map((cat) => {
                                const isSelected = draftCategory === cat.value;
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setDraftCategory(cat.value)}
                                        className={`flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                                            isSelected
                                                ? 'bg-blue-50 font-semibold text-blue-900 ring-1 ring-blue-200'
                                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="truncate">{cat.label}</span>
                                        {isSelected && <Check className="ml-1 h-3.5 w-3.5 shrink-0 text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sheet Footer Action Buttons */}
                    <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={handleResetSheetFilters}
                            className="min-h-[44px] flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleApplySheetFilters}
                            className="min-h-[44px] flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
                        >
                            Show results
                        </button>
                    </div>
                </div>
            </MobileSheet>
        </OrganizationLayout>
    );
}
