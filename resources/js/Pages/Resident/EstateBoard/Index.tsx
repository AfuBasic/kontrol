import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronRight, Globe, Image as ImageIcon, MessageCircle, Shield, Users, Home } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import { index, show } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience, SharedData } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
    filter: string | null;
};

function getAudienceIcon(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return <Users className="h-3 w-3" />;
        case 'security':
            return <Shield className="h-3 w-3" />;
        default:
            return <Globe className="h-3 w-3" />;
    }
}

function getAudienceLabel(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return 'Residents';
        case 'security':
            return 'Security';
        default:
            return 'Everyone';
    }
}

function PostCard({ post, index: idx }: { post: EstateBoardPost; index: number }) {
    const hasMedia = post.media && post.media.length > 0;
    const bodyPreview = post.body.replace(/<[^>]*>/g, ' ').trim();

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease: 'easeOut' }}
            className="group relative h-full overflow-hidden rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        >
            <Link href={show.url({ post: post.hashid })} className="flex h-full flex-col justify-between p-5 sm:p-6">
                <div>
                    {/* Post Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 font-black text-white shadow-lg ring-2 shadow-indigo-200 ring-white">
                                <span className="text-sm">{post.author.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{post.author.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        {post.published_at
                                            ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                            : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {post.property_owner_id ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[9px] font-black tracking-widest text-purple-700 uppercase ring-1 ring-purple-100/50">
                                    <Home className="h-2 w-2" /> House Update
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-black tracking-widest text-blue-700 uppercase ring-1 ring-blue-100/50">
                                    <Shield className="h-2 w-2" /> Estate Update
                                </span>
                            )}
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                {getAudienceIcon(post.audience)}
                                <span className="tracking-wider uppercase">{getAudienceLabel(post.audience)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Post Content */}
                    {post.title && (
                        <h2 className="mb-2 text-xl leading-tight font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 break-words [overflow-wrap:anywhere]">
                            {post.title}
                        </h2>
                    )}

                    <p className="line-clamp-3 text-[15px] leading-relaxed text-slate-600 break-words [overflow-wrap:anywhere]">{bodyPreview}</p>

                    {/* Media Preview */}
                    {hasMedia && (
                        <div className="mt-4 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
                            {post.media.slice(0, 2).map((media, mIdx) => (
                                <div
                                    key={media.id}
                                    className={`relative aspect-video overflow-hidden bg-slate-50 ${post.media.length === 1 ? 'col-span-2' : ''}`}
                                >
                                    <img
                                        src={media.url}
                                        alt=""
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {mIdx === 1 && post.media.length > 2 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                                            <span className="text-lg font-black text-white">+{post.media.length - 2}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Post Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <MessageCircle className="h-5 w-5" />
                            <span className="text-xs font-black tabular-nums">{post.comments_count}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-black tracking-widest text-indigo-600 uppercase">
                        Read Story
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                </div>
            </Link>
        </motion.article>
    );
}

export default function EstateBoardIndex({ posts, filter }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isPropertyOwner = auth?.user?.roles?.includes('property_owner') ?? false;
    const hasLandlord = !!auth?.user?.property_owner_id;
    const showTabs = isPropertyOwner || hasLandlord;

    const tabs = [
        { id: 'estate', label: 'Estate' },
        { id: 'property_owner', label: 'My House' },
    ];

    const handleFilterChange = (filterId: string | null) => {
        router.get(index.url(), { filter: filterId || undefined }, { preserveState: true, preserveScroll: true });
    };

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const loadMore = useCallback(() => {
        if (!posts.next_page_url || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.get(
            posts.next_page_url,
            { filter: filter || undefined },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [posts.next_page_url, filter]);

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
        <>
            <Head title="Feed" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-4 px-1"
            >
                <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
                <p className="mt-1 text-sm text-gray-500">Updates from your community</p>
            </motion.div>

            {/* Filter Tabs - only for property owners and residents with a landlord */}
            {showTabs && (
                <div className="mb-6">
                    <div className="flex max-w-xs rounded-xl bg-slate-100 p-1">
                        {tabs.map((tab) => {
                            const isActive = filter === tab.id || (filter === null && tab.id === 'estate');
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleFilterChange(tab.id)}
                                    className={`relative flex flex-1 items-center justify-center rounded-lg py-2 text-xs font-semibold transition-all ${
                                        isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeFeedFilter"
                                            className="absolute inset-0 rounded-lg bg-white shadow-xs"
                                            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Posts Feed */}
            {posts.data.length > 0 ? (
                <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2">
                    {posts.data.map((post, idx) => (
                        <PostCard key={post.id} post={post} index={idx} />
                    ))}

                    {/* Load More Trigger */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="col-span-1 flex justify-center py-8 sm:col-span-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 py-16 text-center"
                >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No updates yet</h3>
                    <p className="mt-1 max-w-xs text-sm text-gray-500">
                        When there are announcements or updates from the estate, they'll appear here.
                    </p>
                </motion.div>
            )}
        </>
    );
}
