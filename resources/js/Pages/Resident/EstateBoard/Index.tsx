import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Check,
    Home,
    MessageSquare,
    Megaphone,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';

import { index, show } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostCategory, SharedData } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
    filter: string | null;
    category?: string | null;
    unread_only?: boolean;
    unread_count?: number;
};

const CATEGORY_FILTERS: Array<{ id: string | null; label: string }> = [
    { id: null, label: 'All' },
    { id: 'general', label: 'Updates' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'security', label: 'Security' },
    { id: 'event', label: 'Events' },
    { id: 'meeting', label: 'Meetings' },
];

const CATEGORY_LABELS: Record<PostCategory, string> = {
    general: 'Update',
    meeting: 'Meeting',
    maintenance: 'Maintenance',
    security: 'Security',
    event: 'Event',
};

function AnnouncementFeedItem({ post, index: idx, estateName }: { post: EstateBoardPost; index: number; estateName: string }) {
    const isUnread = !post.is_read;
    const hasMedia = post.media && post.media.length > 0;
    const category = post.category || 'general';
    const categoryLabel = CATEGORY_LABELS[category] || 'Update';

    const authorName = post.property_owner_id
        ? (post.author?.name ? `Landlord (${post.author.name})` : 'Landlord Bulletin')
        : (estateName || 'Estate Office');

    // Clean plain text excerpt (up to 3 lines)
    const bodyPreview = post.body
        ? post.body
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
        : '';

    const timeAgo = post.published_at
        ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
        : formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.25), ease: 'easeOut' }}
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                isUnread
                    ? 'border-indigo-100/90 bg-white shadow-xs hover:border-indigo-200 hover:shadow-sm'
                    : 'border-slate-200/60 bg-slate-50/50 hover:border-slate-300/80 hover:bg-white'
            }`}
        >
            <Link
                href={show.url({ post: post.hashid })}
                className="block p-4 sm:p-5 text-left focus:outline-hidden"
            >
                {/* Meta Header: Read Status + Author + Category */}
                <div className="flex items-center justify-between gap-2">
                    {/* Left: Author + Time + Read Dot */}
                    <div className="flex min-w-0 items-center gap-2">
                        {isUnread ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                                <span>Unread</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                                <Check className="h-3 w-3 text-slate-500" strokeWidth={2.5} />
                                <span>Read</span>
                            </span>
                        )}

                        <span className="text-slate-300">·</span>

                        <div className="flex min-w-0 items-center gap-1.5 truncate">
                            <span
                                className="truncate text-xs font-bold text-slate-800 max-w-[130px] sm:max-w-[200px]"
                                title={authorName}
                            >
                                {authorName}
                            </span>
                            <span className="shrink-0 text-[11px] font-medium text-slate-600">
                                {timeAgo}
                            </span>
                        </div>
                    </div>

                    {/* Right: Category Label */}
                    <div className="shrink-0 flex items-center gap-1.5">
                        {post.property_owner_id ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-purple-700 uppercase ring-1 ring-purple-100">
                                <Home className="h-2.5 w-2.5" /> House
                            </span>
                        ) : (
                            <span className="rounded-md bg-slate-100/80 px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-600 uppercase">
                                {categoryLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h2
                    className={`mt-2.5 text-base sm:text-lg font-bold leading-snug [overflow-wrap:anywhere] break-words transition-colors ${
                        isUnread
                            ? 'text-slate-900 group-hover:text-indigo-600'
                            : 'text-slate-700 group-hover:text-slate-900'
                    }`}
                >
                    {post.title || 'Untitled Announcement'}
                </h2>

                {/* Excerpt */}
                {bodyPreview && (
                    <p
                        className={`mt-1.5 line-clamp-2 text-xs sm:text-sm leading-relaxed [overflow-wrap:anywhere] break-words ${
                            isUnread ? 'text-slate-600' : 'text-slate-600'
                        }`}
                    >
                        {bodyPreview}
                    </p>
                )}

                {/* Compact Media Preview (if present) */}
                {hasMedia && (
                    <div className="mt-3 overflow-hidden rounded-xl bg-slate-100/80">
                        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden">
                            <img
                                src={post.media[0].url}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            {post.media.length > 1 && (
                                <div className="absolute bottom-2 right-2 rounded-lg bg-slate-900/70 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-xs">
                                    +{post.media.length - 1} more
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer: Discussion Count & Quiet Tap Affordance */}
                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100/80 pt-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="font-semibold tabular-nums">
                            {post.comments_count > 0 ? `${post.comments_count} ${post.comments_count === 1 ? 'comment' : 'comments'}` : 'No comments'}
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 group-hover:text-indigo-600">
                        <span>View</span>
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                </div>
            </Link>
        </motion.article>
    );
}

export default function EstateBoardIndex({ posts, filter, category, unread_only = false, unread_count }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isPropertyOwner = auth?.user?.roles?.includes('property_owner') ?? false;
    const hasLandlord = Boolean(auth?.user?.property_owner_id);
    const showTabs = isPropertyOwner || hasLandlord;
    const estateName = (auth as any)?.estate?.name || 'your community';

    const tabs = [
        { id: 'estate', label: 'Estate' },
        { id: 'property_owner', label: 'My House' },
    ];

    const handleFilterChange = (newFilter?: string | null, newCategory?: string | null, newUnreadOnly?: boolean) => {
        router.get(
            index.url(),
            {
                filter: newFilter !== undefined ? (newFilter || undefined) : (filter || undefined),
                category: newCategory !== undefined ? (newCategory || undefined) : (category || undefined),
                unread_only: newUnreadOnly !== undefined ? (newUnreadOnly ? 1 : undefined) : (unread_only ? 1 : undefined),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

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

    return (
        <div className="mx-auto max-w-xl pb-24 text-left">
            <Head title="Estate Updates" />

            {/* Compact Header */}
            <div className="mb-4 flex items-end justify-between px-1">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        Estate Updates
                    </h1>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                        Notices and announcements from {estateName}
                    </p>
                </div>

                {typeof unread_count === 'number' && unread_count > 0 && (
                    <button
                        type="button"
                        onClick={() => handleFilterChange(undefined, undefined, !unread_only)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black transition-all active:scale-95 ${
                            unread_only
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 hover:bg-indigo-100'
                        }`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${unread_only ? 'bg-white' : 'bg-indigo-600'}`} />
                        <span>{unread_count} unread</span>
                    </button>
                )}
            </div>

            {/* Filter Tabs - only for property owners and residents with a landlord */}
            {showTabs && (
                <div className="mb-3">
                    <div className="flex max-w-xs rounded-xl bg-slate-100 p-1">
                        {tabs.map((tab) => {
                            const isActive =
                                filter === tab.id || (filter === null && tab.id === 'estate');
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleFilterChange(tab.id, undefined, undefined)}
                                    className={`relative flex flex-1 items-center justify-center rounded-lg py-1.5 text-xs font-bold transition-all ${
                                        isActive
                                            ? 'text-slate-900'
                                            : 'text-slate-600 hover:text-slate-700'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeFeedFilter"
                                            className="absolute inset-0 rounded-lg bg-white shadow-xs"
                                            transition={{
                                                type: 'spring',
                                                bounce: 0.15,
                                                duration: 0.5,
                                            }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Simple Category Filter Pills */}
            <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORY_FILTERS.map((cat) => {
                    const isCatActive = (category || null) === cat.id;
                    return (
                        <button
                            key={cat.id ?? 'all'}
                            type="button"
                            onClick={() => handleFilterChange(undefined, cat.id, undefined)}
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                                isCatActive
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                            }`}
                        >
                            {cat.label}
                        </button>
                    );
                })}

                {/* Unread Pill Toggle (Quick filter) */}
                <button
                    type="button"
                    onClick={() => handleFilterChange(undefined, undefined, !unread_only)}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                        unread_only
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${unread_only ? 'bg-white' : 'bg-indigo-500'}`} />
                    <span>Unread only</span>
                </button>
            </div>

            {/* Feed Stream */}
            {posts.data.length > 0 ? (
                <div className="space-y-3">
                    {posts.data.map((post, idx) => (
                        <AnnouncementFeedItem
                            key={post.id}
                            post={post}
                            index={idx}
                            estateName={estateName}
                        />
                    ))}

                    {/* Load More Spinner */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="flex justify-center py-6">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                        </div>
                    )}
                </div>
            ) : (
                /* Compact Empty State */
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-4 text-center"
                >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200/60">
                        <Megaphone className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">No updates yet</h3>
                    <p className="mt-1 max-w-xs text-xs text-slate-600">
                        New notices and announcements from your estate will appear here.
                    </p>
                </motion.div>
            )}
        </div>
    );
}

EstateBoardIndex.layout = (page: React.ReactNode) => (
    <ResidentLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
