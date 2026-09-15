import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, Building2, ChevronRight, FileText, Image as ImageIcon, MessageSquare } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    { value: 'all', label: 'All' },
    { value: 'general', label: 'Notices' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'security', label: 'Security' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'event', label: 'Events' },
];

const READ_STATUSES: { value: 'all' | 'unread' | 'read'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
];

function formatFeedTimestamp(publishedAt: string | null, humanFallback: string): string {
    if (!publishedAt) return humanFallback;
    const date = new Date(publishedAt);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
        return humanFallback;
    }

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

export default function Announcements({
    organization,
    estate,
    membership,
    unread_count = 0,
    filters = {},
    posts,
}: Props) {
    const estateName = estate?.name || organization.estate_name || 'Golden Heights';
    const [items, setItems] = useState<Post[]>(posts.data);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(posts.next_page_url);

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedReadStatus, setSelectedReadStatus] = useState<'all' | 'unread' | 'read'>(filters.read_status || 'all');
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>(filters.sort || 'latest');

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    // Sync when fresh props arrive from initial page navigation or filter visits
    useEffect(() => {
        setItems(posts.data);
        setNextPageUrl(posts.next_page_url);
    }, [posts]);

    // Handle filter application
    const applyFilters = (
        newSearch: string,
        newCategory: string,
        newReadStatus: 'all' | 'unread' | 'read',
        newSort: 'latest' | 'oldest',
    ) => {
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

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        applyFilters(search, category, selectedReadStatus, sortOrder);
    };

    const handleReadStatusChange = (status: 'all' | 'unread' | 'read') => {
        setSelectedReadStatus(status);
        applyFilters(search, selectedCategory, status, sortOrder);
    };

    const handleSortToggle = () => {
        const nextSort = sortOrder === 'latest' ? 'oldest' : 'latest';
        setSortOrder(nextSort);
        applyFilters(search, selectedCategory, selectedReadStatus, nextSort);
    };

    const handleClearSearch = () => {
        setSearch('');
        applyFilters('', selectedCategory, selectedReadStatus, sortOrder);
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

    const hasActiveFilters = Boolean(
        filters.search ||
            (filters.category && filters.category !== 'all') ||
            (filters.read_status && filters.read_status !== 'all') ||
            (filters.sort && filters.sort !== 'latest'),
    );

    return (
        <OrganizationLayout title="Announcements" contentClassName="max-w-xl px-3 sm:px-4">
            <Head title={`Updates - ${estateName}`} />

            <div className="text-left pb-16">
                {/* 1. Page Header */}
                <header className="px-1 py-3 sm:py-4 flex items-baseline justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Updates
                        </h1>
                        <p className="text-xs font-medium text-slate-500">
                            {estateName}
                        </p>
                    </div>

                    {unread_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            {unread_count} new
                        </span>
                    )}
                </header>

                {/* 2. Search and Filter Bar */}
                <div className="mb-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search updates..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <svg
                                className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                    title="Clear search"
                                >
                                    <span className="text-xs font-bold leading-none">✕</span>
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleSortToggle}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                                sortOrder === 'oldest'
                                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            title={`Sorted by ${sortOrder === 'latest' ? 'newest first' : 'oldest first'}. Click to toggle.`}
                        >
                            <span>{sortOrder === 'latest' ? 'Newest' : 'Oldest'}</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                        </button>
                    </div>

                    {/* Read / Unread Status Filter & Category Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {/* Status Chips */}
                        <div className="flex items-center gap-1 shrink-0 pr-1.5 border-r border-slate-200">
                            {READ_STATUSES.map((status) => {
                                const isSelected = selectedReadStatus === status.value;
                                return (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => handleReadStatusChange(status.value)}
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                            isSelected
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Category Filter Pills */}
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => handleCategoryChange(cat.value)}
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Community Stream Feed or Empty State */}
                {items.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-16 text-center sm:py-20 shadow-xs">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Building2 className="h-6 w-6 stroke-[1.5]" />
                        </div>
                        <h2 className="mt-4 text-base font-semibold text-slate-900">
                            {hasActiveFilters ? 'No updates match your filters' : "You're all caught up"}
                        </h2>
                        <p className="mt-1 mx-auto max-w-xs text-xs sm:text-sm font-normal text-slate-500 leading-relaxed">
                            {hasActiveFilters
                                ? 'Try adjusting your search terms, read status, or filter category to find what you are looking for.'
                                : `There aren't any estate updates yet. New announcements from ${estateName} will appear here.`}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setSelectedCategory('all');
                                    setSelectedReadStatus('all');
                                    setSortOrder('latest');
                                    applyFilters('', 'all', 'all', 'latest');
                                }}
                                className="mt-4 inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-2 space-y-4">
                        {items.map((post) => {
                            const isUnread = !post.is_read;
                            const isCritical = post.priority === 'critical';
                            const isImportant = post.priority === 'important';
                            const preview = extractAnnouncementPreview(post.body, 220);
                            const category = CATEGORY_META[post.category] || {
                                label: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Notice',
                                tone: 'text-slate-700 bg-slate-100 border-slate-200/60',
                            };
                            const timeLabel = formatFeedTimestamp(post.published_at, post.published_at_human);

                            const images = post.media?.filter((m) => m.mime_type?.startsWith('image/')) || [];
                            const nonImageMedia = post.media?.filter((m) => !m.mime_type?.startsWith('image/')) || [];
                            const postDetailUrl = `/org/announcements/${post.hashid || post.id}`;

                            return (
                                <article
                                    key={post.id}
                                    className={`group rounded-2xl border bg-white shadow-xs transition-all duration-150 hover:border-slate-300 hover:shadow-sm ${
                                        isCritical
                                            ? 'border-rose-200/90'
                                            : isUnread
                                            ? 'border-blue-200/90 ring-1 ring-blue-500/10'
                                            : 'border-slate-200/80'
                                    }`}
                                >
                                    {/* Critical Advisory Banner */}
                                    {isCritical && (
                                        <div className="flex items-center gap-2 rounded-t-2xl border-b border-rose-100 bg-rose-50/90 px-4 py-2 text-[11px] font-semibold text-rose-800">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                                            <span>Urgent Estate Advisory</span>
                                        </div>
                                    )}

                                    {/* Card Body */}
                                    <div className="p-4 sm:p-5">
                                        {/* Publisher Metadata Bar */}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {/* Monogram */}
                                                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-xs">
                                                    <span>{estateName.charAt(0).toUpperCase()}</span>
                                                    {isUnread && (
                                                        <span
                                                            className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                                                            title="Unread notice"
                                                        />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-bold text-slate-900 truncate">
                                                            {post.publisher_name || estateName}
                                                        </span>
                                                        {isImportant && !isCritical && (
                                                            <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-800 border border-amber-200/50">
                                                                Important
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-normal">
                                                        <span>{post.publisher_role}</span>
                                                        <span>·</span>
                                                        <time dateTime={post.published_at || undefined} className="text-slate-400">
                                                            {timeLabel}
                                                        </time>
                                                        {post.author_name && (
                                                            <>
                                                                <span className="text-slate-300">·</span>
                                                                <span className="text-slate-400 truncate max-w-[120px]">
                                                                    by {post.author_name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Category Tag Top-Right */}
                                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium shrink-0 ${category.tone}`}>
                                                {category.label}
                                            </span>
                                        </div>

                                        {/* Announcement Title & Prose Area */}
                                        <div className="mt-3">
                                            {post.title && (
                                                <h2 className="text-[15px] font-bold leading-snug tracking-tight text-slate-950 sm:text-base">
                                                    <Link
                                                        href={postDetailUrl}
                                                        className="hover:text-blue-600 transition-colors"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                </h2>
                                            )}

                                            {/* Preview Excerpt */}
                                            {preview && (
                                                <div className="mt-1.5 text-xs sm:text-sm font-normal leading-relaxed text-slate-600">
                                                    <p className="whitespace-pre-line line-clamp-3">
                                                        {preview}
                                                    </p>
                                                    <Link
                                                        href={postDetailUrl}
                                                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                                    >
                                                        <span>Read full notice</span>
                                                        <ChevronRight className="h-3 w-3 stroke-[2.5]" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Optional Media Preview */}
                                        {images.length > 0 && (
                                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                                <Link href={postDetailUrl} className="block group/img">
                                                    {images.length === 1 ? (
                                                        <div className="aspect-16/9 sm:aspect-2/1 w-full overflow-hidden bg-slate-100">
                                                            <img
                                                                src={images[0].url}
                                                                alt={post.title || 'Notice attachment'}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-[1.02]"
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
                                                className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    {nonImageMedia.length} document attachment{nonImageMedia.length > 1 ? 's' : ''}
                                                </span>
                                                <ChevronRight className="h-3 w-3 text-slate-400 ml-auto shrink-0" />
                                            </Link>
                                        )}

                                        {/* Bottom Bar: Discussion & Comment affordance */}
                                        <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                                            <Link
                                                href={`${postDetailUrl}#discussion`}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                                <span>
                                                    {post.comments_count > 0 ? (
                                                        <span>
                                                            {post.comments_count}{' '}
                                                            <span>
                                                                {post.comments_count === 1 ? 'comment' : 'comments'}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span>Comment</span>
                                                    )}
                                                </span>
                                            </Link>

                                            <Link
                                                href={postDetailUrl}
                                                className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                                            >
                                                View notice
                                            </Link>
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
        </OrganizationLayout>
    );
}
