import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MessageSquare, SlidersHorizontal } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { index } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostCategory, SharedData } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
    filter?: string | null;
    category?: string | null;
    unread_only?: boolean;
    unread_count?: number;
    estateName?: string;
};

const CATEGORY_CONFIG: Record<PostCategory, { label: string }> = {
    general: { label: 'Update' },
    meeting: { label: 'Meeting' },
    maintenance: { label: 'Maintenance' },
    security: { label: 'Security' },
    event: { label: 'Event' },
};

type FilterSheetTab = 'all' | 'unread' | 'category';

function FeedPost({ post, estateName }: { post: EstateBoardPost; estateName: string }) {
    const isUnread = !post.is_read;
    const category = post.category || 'general';
    const categoryLabel = CATEGORY_CONFIG[category]?.label ?? 'Update';

    const authorName = post.property_owner_id
        ? post.author?.name
            ? `Landlord (${post.author.name})`
            : 'Landlord Bulletin'
        : estateName || 'Estate Office';

    const bodyPreview = post.body
        ? post.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : '';

    const timeAgo = post.published_at
        ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
        : formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

    return (
        <article
            className={`group relative py-4 transition-colors duration-150 ${
                isUnread ? 'bg-white' : ''
            }`}
        >
            <Link
                href={`/resident/estate-board/${post.hashid}`}
                className="block text-left focus:outline-hidden"
            >
                {/* Meta: source + time, quiet */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        {isUnread && (
                            <span className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        )}
                        <span className="truncate text-xs font-semibold text-slate-700">{authorName}</span>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-slate-400">{timeAgo}</span>
                </div>

                {/* Title — strong */}
                <h2
                    className={`mt-1 text-[15px] leading-snug font-bold [overflow-wrap:anywhere] break-words transition-colors sm:text-base ${
                        isUnread ? 'text-slate-900' : 'text-slate-800'
                    }`}
                >
                    {post.title || 'Untitled Announcement'}
                </h2>

                {/* Excerpt — quiet */}
                {bodyPreview && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere] break-words">
                        {bodyPreview}
                    </p>
                )}

                {/* Footer: comment count + category */}
                <div className="mt-2.5 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                    {post.comments_count > 0 ? (
                        <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{post.comments_count}</span>
                        </span>
                    ) : (
                        <span>Comment</span>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">{categoryLabel}</span>
                    <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                        <span>View</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </Link>

            {/* Media preview — if present, inline within the stream row */}
            {post.media && post.media.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-xl bg-slate-100">
                    <div className="relative aspect-[21/9] w-full overflow-hidden">
                        <img
                            src={post.media[0].url}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            loading="lazy"
                        />
                        {post.media.length > 1 && (
                            <div className="absolute right-2 bottom-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                                +{post.media.length - 1} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-100" />
        </article>
    );
}

function FilterSheet({
    isOpen,
    onClose,
    category,
    unreadOnly,
    onApply,
}: {
    isOpen: boolean;
    onClose: () => void;
    category: string | null | undefined;
    unreadOnly: boolean | undefined;
    onApply: (category?: string | null, unreadOnly?: boolean) => void;
}) {
    const [localCategory, setLocalCategory] = useState<string | null>(category ?? null);
    const [localUnreadOnly, setLocalUnreadOnly] = useState(unreadOnly ?? false);

    useEffect(() => {
        if (isOpen) {
            setLocalCategory(category);
            setLocalUnreadOnly(unreadOnly);
        }
    }, [isOpen, category, unreadOnly]);

    if (!isOpen) return null;

    const categories: Array<{ id: string | null; label: string }> = [
        { id: null, label: 'All' },
        { id: 'general', label: 'Updates' },
        { id: 'maintenance', label: 'Maintenance' },
        { id: 'security', label: 'Security' },
        { id: 'event', label: 'Events' },
        { id: 'meeting', label: 'Meetings' },
    ];

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-slate-100 bg-white p-5 pb-8 shadow-2xl"
                style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            >
                {/* Handle */}
                <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200" />

                <h3 className="text-sm font-bold text-slate-900">Filter Updates</h3>

                {/* Read Status */}
                <div className="mt-4">
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Status</p>
                    <div className="mt-2 flex gap-2">
                        {[
                            { id: false, label: 'All' },
                            { id: true, label: 'Unread' },
                        ].map((option) => (
                            <button
                                key={String(option.id)}
                                type="button"
                                onClick={() => setLocalUnreadOnly(option.id)}
                                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                    localUnreadOnly === option.id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category */}
                <div className="mt-5">
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Category</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {categories.map((cat) => {
                            const isActive = localCategory === cat.id;
                            return (
                                <button
                                    key={cat.id ?? 'all'}
                                    type="button"
                                    onClick={() => setLocalCategory(isActive ? null : cat.id)}
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        isActive
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Apply */}
                <button
                    type="button"
                    onClick={() => {
                        onApply(localCategory, localUnreadOnly);
                        onClose();
                    }}
                    className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform"
                >
                    Apply Filters
                </button>
            </motion.div>
        </div>
    );
}

export default function EstateBoardIndex({
    posts,
    filter,
    category,
    unread_only = false,
    unread_count = 0,
    estateName: propEstateName,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const estateName = propEstateName || (auth as any)?.estate?.name || 'your community';

    const [showFilterSheet, setShowFilterSheet] = useState(false);

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const loadMore = useCallback(() => {
        if (!posts.next_page_url || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.get(
            posts.next_page_url,
            {
                filter: filter || undefined,
                category: category || undefined,
                unread_only: unread_only ? 1 : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [posts.next_page_url, filter, category, unread_only]);

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

    const handleFilterApply = (newCategory?: string | null, newUnreadOnly?: boolean) => {
        router.get(
            index.url(),
            {
                filter: filter || undefined,
                category: newCategory || undefined,
                unread_only: newUnreadOnly ? 1 : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const hasActiveFilters = Boolean(category || unread_only);

    return (
        <div className="mx-auto max-w-xl pb-24 text-left">
            <Head title="Updates" />

            {/* Compact Header */}
            <div className="mb-3 flex items-end justify-between px-1">
                <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900">Updates</h1>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {estateName}
                    </p>
                </div>

                {typeof unread_count === 'number' && unread_count > 0 && (
                    <button
                        type="button"
                        onClick={() => handleFilterApply(undefined, !unread_only)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black transition-all active:scale-95 ${
                            unread_only
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 hover:bg-indigo-100'
                        }`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${unread_only ? 'bg-white' : 'bg-indigo-600'}`} />
                        <span>{unread_count} new</span>
                    </button>
                )}
            </div>

            {/* Filter button */}
            <div className="mt-3 flex justify-end px-1">
                <button
                    type="button"
                    onClick={() => setShowFilterSheet(true)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                        hasActiveFilters
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Filter</span>
                </button>
            </div>

            {/* Active filter summary */}
            {hasActiveFilters && (
                <div className="mt-2 flex items-center gap-2 px-1">
                    {category && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {(CATEGORY_CONFIG[category as PostCategory]?.label ?? category)}
                            <button
                                type="button"
                                onClick={() => handleFilterApply(null, unread_only)}
                                className="ml-0.5 text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        </span>
                    )}
                    {unread_only && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-200/60">
                            Unread only
                            <button
                                type="button"
                                onClick={() => handleFilterApply(category, false)}
                                className="ml-0.5 text-indigo-400 hover:text-indigo-600"
                            >
                                ×
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Feed Stream */}
            {posts.data.length > 0 ? (
                <div className="mt-1">
                    {posts.data.map((post) => (
                        <FeedPost
                            key={post.id}
                            post={post}
                            estateName={estateName}
                        />
                    ))}

                    {/* Load More */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="flex justify-center py-6">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-400" />
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <div className="mt-12 flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">No updates yet</p>
                    <p className="mt-1 max-w-[240px] text-xs text-slate-500">
                        New notices and announcements from your estate will appear here.
                    </p>
                </div>
            )}

            {/* Filter Bottom Sheet */}
            <FilterSheet
                isOpen={showFilterSheet}
                onClose={() => setShowFilterSheet(false)}
                category={category}
                unreadOnly={unread_only}
                onApply={handleFilterApply}
            />
        </div>
    );
}

EstateBoardIndex.layout = (page: React.ReactNode) => (
    <ResidentLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
