import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Head, Link, router, InfiniteScroll } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { FileText } from 'lucide-react';
import FilterBar, { FilterChips } from '@/Components/UI/FilterBar';

import { edit, index as boardIndex } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
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
    const composerRef = useRef<HTMLDivElement>(null);

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

    const handleFocusComposer = () => {
        if (composerRef.current) {
            composerRef.current.scrollIntoView({ behavior: 'smooth' });
            const textarea = composerRef.current.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    };

    const statusValue = filters.status && filters.status !== 'all' ? filters.status : '';
    const audienceValue = filters.audience && filters.audience !== 'all' ? filters.audience : '';
    const hasActiveFilters = Boolean(search || audienceValue || filters.category || filters.priority || statusValue);

    // Separate Pinned / High Priority posts from general chronological feed
    const pinnedPosts = posts.data.filter((post) => (post.priority === 'important' || post.priority === 'critical') && post.status !== 'draft');

    // Unpublished drafts get their own strip, unless the viewer is already filtering to drafts
    const draftPosts = hasActiveFilters ? [] : posts.data.filter((post) => post.status === 'draft');

    // Feed posts excluding pinned (or including if filters active) and drafts
    const regularPosts = hasActiveFilters
        ? posts.data
        : posts.data.filter((post) => post.priority !== 'important' && post.priority !== 'critical' && post.status !== 'draft');

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6 pb-32">
            <Head title="Estate Board" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Estate Board</h1>
                    <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                        Broadcast announcements, critical alerts, and community updates to residents and estate staff.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/estate-board/create"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 dark:bg-primary-600 dark:hover:bg-primary-700"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Full Editor</span>
                    </Link>
                </div>
            </div>

            {/* Quick Composer Surface */}
            <div ref={composerRef}>
                <QuickComposer lastBroadcastNote={metrics.last_broadcast} zones={zones} />
            </div>

            <FilterBar
                search={search}
                onSearch={setSearch}
                placeholder="Search announcements"
                searchLabel="Search announcements by title, content or author"
                activeCount={[statusValue, filters.category, audienceValue, filters.priority].filter((v) => v && v !== 'all').length}
                hasActive={hasActiveFilters}
                onReset={clearFilters}
            >
                <FilterChips
                    label="Show"
                    value={statusValue || 'all'}
                    onChange={(val) => setFilter('status', val)}
                    options={[
                        { value: 'all', label: 'All' },
                        { value: 'published', label: 'Published' },
                        { value: 'draft', label: 'Drafts' },
                    ]}
                />
                <FilterChips
                    label="Category"
                    value={filters.category || 'all'}
                    onChange={(val) => setFilter('category', val)}
                    options={CATEGORIES.map((cat) => ({ value: cat.value, label: cat.value === 'all' ? 'All' : cat.label }))}
                />
                <FilterChips
                    label="Audience"
                    value={audienceValue || 'all'}
                    onChange={(val) => setFilter('audience', val)}
                    options={[
                        { value: 'all', label: 'Everyone' },
                        { value: 'residents', label: 'Residents' },
                        { value: 'security', label: 'Security' },
                    ]}
                />
                <FilterChips
                    label="Priority"
                    value={filters.priority || 'all'}
                    onChange={(val) => setFilter('priority', val)}
                    options={[
                        { value: 'all', label: 'Any' },
                        { value: 'important', label: 'Pinned' },
                    ]}
                />
            </FilterBar>

            {/* Drafts are unpublished: keep them out of the live feed and show them as their own strip */}
            {draftPosts.length > 0 && (
                <section aria-label="Drafts" className="space-y-2">
                    <h2 className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                        Drafts
                        <span className="font-semibold text-slate-400">{draftPosts.length}</span>
                    </h2>
                    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white">
                        {draftPosts.map((post) => (
                            <li key={post.id} className="flex items-center gap-3 px-4 py-3">
                                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800">{post.title || 'Untitled announcement'}</p>
                                    <p className="text-[11px] text-slate-500">
                                        Saved {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <Link
                                    href={edit.url({ post: post.hashid })}
                                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                                >
                                    Continue editing
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Main Feed Content Area */}
            {posts.data.length === 0 ? (
                <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} onFocusComposer={handleFocusComposer} />
            ) : (
                <InfiniteScroll
                    data="posts"
                    className="space-y-8"
                    loading={
                        <div className="mt-8 flex justify-center pb-12">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                                <span>Loading more announcements...</span>
                            </div>
                        </div>
                    }
                >
                    {/* Dedicated Pinned Section */}
                    {!hasActiveFilters && pinnedPosts.length > 0 && <PinnedSection pinnedPosts={pinnedPosts} />}

                    {/* Chronological Feed (Grouped by Today / Yesterday / This Week / Earlier) */}
                    <FeedGroup posts={regularPosts} hasActiveFilters={hasActiveFilters} />
                </InfiniteScroll>
            )}
        </div>
    );
}
