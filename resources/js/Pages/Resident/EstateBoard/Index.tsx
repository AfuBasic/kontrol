import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Globe, Image as ImageIcon, MessageCircle, Shield, Users } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import { index, show } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import ResidentLayout from '@/layouts/ResidentLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
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

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-gray-100 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
        >
            <div className="p-4 sm:p-5">
                {/* Post Header */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                            <span className="text-sm font-semibold">{post.author.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                    {post.published_at
                                        ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                        : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </span>
                                <span className="text-[10px] text-gray-300">•</span>
                                <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                    {getAudienceIcon(post.audience)}
                                    <span>{getAudienceLabel(post.audience)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Post Content */}
                <Link href={show.url({ post: post.hashid })} className="group block">
                    {post.title && (
                        <h2 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-600">{post.title}</h2>
                    )}
                    <div
                        className="prose prose-sm prose-gray line-clamp-3 max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: post.body }}
                    />
                </Link>

                {/* Media Preview */}
                {hasMedia && (
                    <div className="mt-4 overflow-hidden rounded-xl bg-gray-50">
                        {post.media.length === 1 ? (
                            <img
                                src={post.media[0].url}
                                alt=""
                                className="h-64 w-full object-cover transition-transform hover:scale-[1.02]"
                                loading="lazy"
                            />
                        ) : (
                            <div className="grid grid-cols-2 gap-0.5">
                                {post.media.slice(0, 4).map((media, mediaIdx) => (
                                    <div key={media.id} className="relative aspect-square overflow-hidden">
                                        <img
                                            src={media.url}
                                            alt=""
                                            className="h-full w-full object-cover transition-transform hover:scale-105"
                                            loading="lazy"
                                        />
                                        {mediaIdx === 3 && post.media.length > 4 && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                                                <span className="text-lg font-bold text-white">+{post.media.length - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Post Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                    <Link
                        href={show.url({ post: post.hashid })}
                        className="flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
                    >
                        <MessageCircle className="h-4.5 w-4.5" />
                        <span>
                            {post.comments_count > 0 ? `${post.comments_count} ${post.comments_count === 1 ? 'Comment' : 'Comments'}` : 'Add Comment'}
                        </span>
                    </Link>
                    {/* Share / More actions could go here */}
                </div>
            </div>
        </motion.article>
    );
}

export default function EstateBoardIndex({ posts }: Props) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

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

    return (
        <ResidentLayout>
            <Head title="Feed" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-6 px-1"
            >
                <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
                <p className="mt-1 text-sm text-gray-500">Updates from your community</p>
            </motion.div>

            {/* Posts Feed */}
            {posts.data.length > 0 ? (
                <div className="space-y-5">
                    {posts.data.map((post, idx) => (
                        <PostCard key={post.id} post={post} index={idx} />
                    ))}

                    {/* Load More Trigger */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="flex justify-center py-8">
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
        </ResidentLayout>
    );
}
