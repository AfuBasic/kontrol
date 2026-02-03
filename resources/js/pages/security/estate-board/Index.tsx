import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Globe, Image as ImageIcon, MessageCircle, Shield, Users } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import { index, show } from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import SecurityLayout from '@/layouts/SecurityLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
};

function getAudienceIcon(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return <Users className="h-3.5 w-3.5" />;
        case 'security':
            return <Shield className="h-3.5 w-3.5" />;
        default:
            return <Globe className="h-3.5 w-3.5" />;
    }
}

function getAudienceLabel(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return 'Residents Only';
        case 'security':
            return 'Security Only';
        default:
            return 'Everyone';
    }
}

function PostCard({ post, index: idx }: { post: EstateBoardPost; index: number }) {
    const hasMedia = post.media && post.media.length > 0;

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease: 'easeOut' }}
            className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
            {/* Post Header */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                        <span className="text-sm font-semibold">{post.author.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
                        <p className="text-xs text-gray-500">
                            {post.published_at
                                ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {getAudienceIcon(post.audience)}
                    <span>{getAudienceLabel(post.audience)}</span>
                </div>
            </div>

            {/* Post Content */}
            <Link href={show.url({ post: post.hashid })}>
                {post.title && <h2 className="mb-2 text-lg font-semibold text-gray-900 hover:text-primary-600">{post.title}</h2>}
                <div
                    className="prose prose-sm prose-gray line-clamp-3 max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.body }}
                />
            </Link>

            {/* Media Preview */}
            {hasMedia && (
                <div className="mt-4">
                    {post.media.length === 1 ? (
                        <img
                            src={post.media[0].url}
                            alt=""
                            className="h-64 w-full rounded-lg object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {post.media.slice(0, 4).map((media, mediaIdx) => (
                                <div key={media.id} className="relative">
                                    <img
                                        src={media.url}
                                        alt=""
                                        className="h-32 w-full rounded-lg object-cover"
                                        loading="lazy"
                                    />
                                    {mediaIdx === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                            <span className="text-lg font-semibold text-white">+{post.media.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Post Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <Link
                    href={show.url({ post: post.hashid })}
                    className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary-600"
                >
                    <MessageCircle className="h-4 w-4" />
                    <span>
                        {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
                    </span>
                </Link>
                {hasMedia && (
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                        <ImageIcon className="h-4 w-4" />
                        <span>{post.media.length}</span>
                    </div>
                )}
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
        <SecurityLayout>
            <Head title="Estate Board" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-gray-900">Estate Board</h1>
                <p className="mt-1 text-gray-500">Announcements and updates from the estate.</p>
            </motion.div>

            {/* Posts Feed */}
            {posts.data.length > 0 ? (
                <div className="space-y-6">
                    {posts.data.map((post, idx) => (
                        <PostCard key={post.id} post={post} index={idx} />
                    ))}

                    {/* Load More Trigger */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="flex justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center"
                >
                    <div className="mb-4 rounded-full bg-gray-100 p-4">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No announcements yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                        Check back later for updates from the estate management.
                    </p>
                </motion.div>
            )}
        </SecurityLayout>
    );
}
