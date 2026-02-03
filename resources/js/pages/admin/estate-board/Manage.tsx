import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Edit, Eye, Globe, Image as ImageIcon, MessageCircle, Plus, Shield, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { create, edit, index, manage, show, destroy } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import AdminLayout from '@/layouts/AdminLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience, PostStatus } from '@/types';

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

function getStatusBadge(status: PostStatus) {
    if (status === 'published') {
        return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Published
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            Draft
        </span>
    );
}

function PostRow({ post }: { post: EstateBoardPost }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    function handleDelete() {
        router.delete(destroy.url({ post: post.hashid }), {
            preserveScroll: true,
        });
    }

    return (
        <tr className="border-b border-gray-100 last:border-0">
            <td className="py-4 pr-4">
                <div className="max-w-md">
                    {post.title ? (
                        <>
                            <p className="font-medium text-gray-900 truncate">{post.title}</p>
                            <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{post.body}</p>
                        </>
                    ) : (
                        <p className="text-gray-700 line-clamp-2">{post.body}</p>
                    )}
                </div>
            </td>
            <td className="py-4 px-4">
                {getStatusBadge(post.status)}
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                    {getAudienceIcon(post.audience)}
                    <span>{getAudienceLabel(post.audience)}</span>
                </div>
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.comments_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {post.media_count}
                    </span>
                </div>
            </td>
            <td className="py-4 px-4 text-sm text-gray-500">
                {post.published_at
                    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                    : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </td>
            <td className="py-4 pl-4">
                {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDelete}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <Link
                            href={show.url({ post: post.hashid })}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="View"
                        >
                            <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                            href={edit.url({ post: post.hashid })}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Edit"
                        >
                            <Edit className="h-4 w-4" />
                        </Link>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}

export default function ManagePosts({ posts }: Props) {
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
            <Head title="Manage Posts" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Manage Posts</h1>
                    <p className="mt-1 text-gray-500">View and manage all estate board posts.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={index.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <Eye className="h-4 w-4" />
                        View Feed
                    </Link>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <Plus className="h-5 w-5" />
                        New Post
                    </Link>
                </div>
            </motion.div>

            {/* Posts Table */}
            {posts.data.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                    className="rounded-xl border border-gray-200 bg-white"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    <th className="py-3 pr-4 pl-6">Post</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Audience</th>
                                    <th className="py-3 px-4">Engagement</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 pl-4 pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="px-6">
                                {posts.data.map((post) => (
                                    <PostRow key={post.id} post={post} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Load More */}
                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="flex justify-center border-t border-gray-100 py-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                        </div>
                    )}
                </motion.div>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                    className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center"
                >
                    <div className="mb-4 rounded-full bg-gray-100 p-4">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                        Get started by creating the first announcement for your estate community.
                    </p>
                    <Link
                        href={create.url()}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <Plus className="h-5 w-5" />
                        Create First Post
                    </Link>
                </motion.div>
            )}
        </AdminLayout>
    );
}
