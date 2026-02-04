import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Globe, Image as ImageIcon, MessageCircle, Shield, Users, Newspaper } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import EstateBoardController from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import SecurityLayout from '@/layouts/SecurityLayout';
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

function FeedCard({ post, index: idx }: { post: EstateBoardPost; index: number }) {
    const hasMedia = post.media && post.media.length > 0;
    const firstImage = hasMedia ? post.media[0] : null;

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05, ease: 'easeOut' }}
        >
            <Link
                href={EstateBoardController.show.url({ post: post.hashid })}
                className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all active:scale-[0.98]"
            >
                {/* Image Header */}
                {firstImage && (
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                        <img
                            src={firstImage.url}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                        {post.media.length > 1 && (
                            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                <ImageIcon className="h-3 w-3" />
                                <span>{post.media.length}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    {/* Audience Badge */}
                    <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {getAudienceIcon(post.audience)}
                            {getAudienceLabel(post.audience)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {post.published_at
                                ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    {/* Title */}
                    {post.title && (
                        <h2 className="mb-1.5 text-base font-semibold text-slate-900 line-clamp-2">
                            {post.title}
                        </h2>
                    )}

                    {/* Body Preview */}
                    <div
                        className="text-sm text-slate-600 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: post.body.replace(/<[^>]*>/g, ' ').substring(0, 150) }}
                    />

                    {/* Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-700 text-[10px] font-semibold text-white">
                                {post.author.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{post.author.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>{post.comments_count}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.article>
    );
}

export default function FeedIndex({ posts }: Props) {
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
            <Head title="Feed" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-5"
            >
                <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
                <p className="mt-0.5 text-sm text-slate-500">Estate news and updates</p>
            </motion.div>

            {/* Posts Feed */}
            {posts.data.length > 0 ? (
                <div className="space-y-4">
                    {posts.data.map((post, idx) => (
                        <FeedCard key={post.id} post={post} index={idx} />
                    ))}

                    {/* Load More Trigger */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="flex justify-center py-6">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-100"
                >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                        <Newspaper className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">No announcements</h3>
                    <p className="mt-1 max-w-xs px-4 text-sm text-slate-500">
                        Check back later for updates from estate management.
                    </p>
                </motion.div>
            )}
        </SecurityLayout>
    );
}
