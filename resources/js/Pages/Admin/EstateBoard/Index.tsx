import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, X, Pin, FileText, Globe } from 'lucide-react';

import { index as boardIndex } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import type { CursorPaginatedPosts, PostCategory } from '@/types';
import { useDebounce } from '@/Hooks/useDebounce';

import QuickComposer from '@/Components/Admin/EstateBoard/QuickComposer';
import PinnedSection from '@/Components/Admin/EstateBoard/PinnedSection';
import FeedGroup from '@/Components/Admin/EstateBoard/FeedGroup';
import EmptyState from '@/Components/Admin/EstateBoard/EmptyState';

type Props = {
    posts: CursorPaginatedPosts;
    metrics: {
        total: number;
        this_month: number;
        last_broadcast: string | null;
    };
    filters: {
        search: string;
        audience: string;
        category: string;
        priority: string;
        status?: string;
    };
    zones?: Array<{ id: number; name: string }>;
};

const CATEGORIES: { value: PostCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'security', label: 'Security' },
    { value: 'event', label: 'Event' },
];

export default function EstateBoardIndex({ posts, metrics, filters, zones = [] }: Props) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(
                boardIndex.url(),
                {
                    search: debouncedSearch,
                    audience: filters.audience,
                    category: filters.category,
                    priority: filters.priority,
                    status: filters.status,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }
    }, [debouncedSearch, filters.audience, filters.category, filters.priority, filters.status]);

    const setFilter = (key: string, value: string) => {
        const currentVal = filters[key as keyof typeof filters] || '';
        const newVal = value === currentVal || value === 'all' ? '' : value;
        const newFilters = { ...filters, [key]: newVal };

        router.get(boardIndex.url(), newFilters, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        router.get(boardIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

    const loadMore = useCallback(() => {
        if (!posts.next_page_url || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.get(
            posts.next_page_url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [posts.next_page_url]);

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

    const handleFocusComposer = () => {
        if (composerRef.current) {
            composerRef.current.scrollIntoView({ behavior: 'smooth' });
            const textarea = composerRef.current.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    };

    const hasActiveFilters = Boolean(search || (filters.audience && filters.audience !== 'all') || filters.category || filters.priority);

    // Separate Pinned / High Priority posts from general chronological feed
    const pinnedPosts = posts.data.filter((post) => post.priority === 'important' || post.priority === 'critical');

    // Feed posts excluding pinned (or including if filters active)
    const regularPosts = hasActiveFilters ? posts.data : posts.data.filter((post) => post.priority !== 'important' && post.priority !== 'critical');

    return (
        <div className="w-full space-y-6 pb-32">
            <Head title="Estate Board" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Estate Board</h1>
                    <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                        Broadcast announcements, critical alerts, and community updates to residents and estate staff.
                    </p>
                </div>
            </div>

            {/* Quick Composer Surface */}
            <div ref={composerRef}>
                <QuickComposer lastBroadcastNote={metrics.last_broadcast} zones={zones} />
            </div>

            {/* Search & Category Filter Toolbar */}
            <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search title, content, or author..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-xs font-semibold text-slate-900 shadow-2xs transition placeholder:font-normal placeholder:text-slate-400 focus:border-primary-500 focus:outline-hidden"
                        />
                    </div>

                    {/* Audience, Status & Category Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={filters.status || 'all'}
                                onChange={(e) => setFilter('status', e.target.value)}
                                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:border-primary-500 focus:outline-hidden"
                            >
                                <option value="all">All Posts</option>
                                <option value="published">Published</option>
                                <option value="draft">Drafts</option>
                            </select>
                        </div>

                        {/* Category Dropdown */}
                        <div className="relative">
                            <select
                                value={filters.category || 'all'}
                                onChange={(e) => setFilter('category', e.target.value)}
                                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:border-primary-500 focus:outline-hidden"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Audience Filter */}
                        <div className="relative">
                            <select
                                value={filters.audience || 'all'}
                                onChange={(e) => setFilter('audience', e.target.value)}
                                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:border-primary-500 focus:outline-hidden"
                            >
                                <option value="all">All Audiences</option>
                                <option value="residents">Residents Only</option>
                                <option value="security">Security Only</option>
                            </select>
                        </div>

                        {/* Priority / Important Filter */}
                        <button
                            onClick={() => setFilter('priority', 'important')}
                            className={`inline-flex shrink-0 items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold shadow-2xs transition ${
                                filters.priority === 'important'
                                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Pin className="h-3.5 w-3.5 text-amber-600" />
                            <span>Pinned</span>
                        </button>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Chips Bar (Quick 1-tap filter) */}
                <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-1">
                    {CATEGORIES.map((cat) => {
                        const isActive = (filters.category || 'all') === cat.value;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setFilter('category', cat.value)}
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide transition ${
                                    isActive
                                        ? 'bg-slate-950 text-white shadow-2xs'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Feed Content Area */}
            {posts.data.length === 0 ? (
                <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} onFocusComposer={handleFocusComposer} />
            ) : (
                <div className="space-y-8">
                    {/* Dedicated Pinned Section */}
                    {!hasActiveFilters && pinnedPosts.length > 0 && <PinnedSection pinnedPosts={pinnedPosts} />}

                    {/* Chronological Feed (Grouped by Today / Yesterday / This Week / Earlier) */}
                    <FeedGroup posts={regularPosts} hasActiveFilters={hasActiveFilters} />
                </div>
            )}

            {/* Infinite Scroll Loader */}
            {posts.next_page_url && (
                <div ref={loadMoreRef} className="mt-8 flex justify-center pb-12">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                        <span>Loading more announcements...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
