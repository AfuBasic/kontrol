import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    Globe,
    Image as ImageIcon,
    Megaphone,
    MessageCircle,
    Plus,
    Settings,
    Shield,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import { create, show } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import AdminLayout from '@/layouts/AdminLayout';
import { manage } from '@/routes/admin/estate-board';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
};

function getAudienceConfig(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return {
                icon: <Users className="h-3.5 w-3.5" />,
                label: 'Residents',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-700',
                ringColor: 'ring-blue-600/20',
            };
        case 'security':
            return {
                icon: <Shield className="h-3.5 w-3.5" />,
                label: 'Security',
                bgColor: 'bg-amber-50',
                textColor: 'text-amber-700',
                ringColor: 'ring-amber-600/20',
            };
        default:
            return {
                icon: <Globe className="h-3.5 w-3.5" />,
                label: 'Everyone',
                bgColor: 'bg-green-50',
                textColor: 'text-green-700',
                ringColor: 'ring-green-600/20',
            };
    }
}

// Strip HTML tags for plain text preview
function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

function PostCard({ post, index: idx }: { post: EstateBoardPost; index: number }) {
    const hasMedia = post.media && post.media.length > 0;
    const audienceConfig = getAudienceConfig(post.audience);
    const plainTextBody = stripHtml(post.body);

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-gray-200 hover:shadow-lg"
        >
            {/* Media Section */}
            {hasMedia && (
                <Link href={show.url({ post: post.hashid })} className="block">
                    {post.media.length === 1 ? (
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={post.media[0].url}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-0.5">
                            {post.media.slice(0, 4).map((media, mediaIdx) => (
                                <div
                                    key={media.id}
                                    className={`relative overflow-hidden ${
                                        post.media.length === 3 && mediaIdx === 0 ? 'row-span-2' : ''
                                    } aspect-4/3`}
                                >
                                    <img
                                        src={media.url}
                                        alt=""
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {mediaIdx === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                            <span className="text-xl font-bold text-white">+{post.media.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Link>
            )}

            {/* Content Section */}
            <div className="p-5">
                {/* Author & Meta */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-600 text-white shadow-sm">
                                <span className="text-sm font-semibold">{post.author.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
                            <p className="text-xs text-gray-500">
                                {post.published_at
                                    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                    : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${audienceConfig.bgColor} ${audienceConfig.textColor} ${audienceConfig.ringColor}`}
                    >
                        {audienceConfig.icon}
                        {audienceConfig.label}
                    </span>
                </div>

                {/* Post Content */}
                <Link href={show.url({ post: post.hashid })} className="block">
                    {post.title && (
                        <h2 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-primary-600">
                            {post.title}
                        </h2>
                    )}
                    <p className={`line-clamp-3 leading-relaxed text-gray-600 ${!post.title ? 'text-base' : 'text-sm'}`}>
                        {plainTextBody}
                    </p>
                </Link>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <Link
                        href={show.url({ post: post.hashid })}
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span>
                            {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
                        </span>
                    </Link>
                    {hasMedia && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <ImageIcon className="h-4 w-4" />
                            <span>{post.media.length}</span>
                        </div>
                    )}
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
        <AdminLayout>
            <Head title="Estate Board" />

            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white shadow-xl"
            >
                {/* Decorative Elements */}
                <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-white/5 blur-2xl" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Megaphone className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Estate Board</h1>
                            <p className="mt-1 text-primary-100">Share announcements and updates with your community</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={manage.url()}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
                        >
                            <Settings className="h-4 w-4" />
                            Manage
                        </Link>
                        <Link
                            href={create.url()}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-all hover:bg-primary-50 hover:shadow-md"
                        >
                            <Plus className="h-5 w-5" />
                            New Post
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Posts Feed */}
            {posts.data.length > 0 ? (
                <>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {posts.data.map((post, idx) => (
                            <PostCard key={post.id} post={post} index={idx} />
                        ))}
                    </div>

                    {/* Load More */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="mt-10 flex justify-center">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
                                <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                                <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500" />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-20 text-center"
                >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100">
                        <Megaphone className="h-10 w-10 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No announcements yet</h3>
                    <p className="mt-2 max-w-md text-gray-500">
                        Start engaging with your community by creating your first announcement. Share updates, news, and important information.
                    </p>
                    <Link
                        href={create.url()}
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-500/30"
                    >
                        <Plus className="h-5 w-5" />
                        Create First Post
                    </Link>
                </motion.div>
            )}
        </AdminLayout>
    );
}
