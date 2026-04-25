import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, MessageCircle, Send, Shield, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { index } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import { store as storeComment, destroy as destroyComment } from '@/actions/App/Http/Controllers/Resident/EstateBoardCommentController';
import ResidentLayout from '@/layouts/ResidentLayout';
import type { CursorPaginatedComments, EstateBoardComment, EstateBoardPost, PostAudience } from '@/types';

type Props = {
    post: EstateBoardPost;
    comments: CursorPaginatedComments;
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

function CommentItem({ comment, postHashid }: { comment: EstateBoardComment; postHashid: string }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    function handleDelete() {
        router.delete(destroyComment.url({ comment: comment.id }), {
            preserveScroll: true,
        });
    }

    return (
        <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                <span className="text-xs font-semibold">{comment.author.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{comment.body}</p>
                </div>
                {comment.can_delete && (
                    <div className="mt-1 flex items-center gap-4 px-1">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Delete?</span>
                                <button onClick={handleDelete} className="text-xs font-medium text-red-600 hover:text-red-700">
                                    Yes
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-600"
                            >
                                <Trash2 className="h-3 w-3" />
                                Delete
                            </button>
                        )}
                    </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
                        {comment.replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} postHashid={postHashid} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EstateBoardShow({ post, comments }: Props) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const {
        data,
        setData,
        post: submitComment,
        processing,
        reset,
        errors,
    } = useForm({
        body: '',
    });

    const loadMore = useCallback(() => {
        if (!comments.next_page_url || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.get(
            comments.next_page_url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['comments'],
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [comments.next_page_url]);

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

    function handleSubmitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!data.body.trim()) return;

        submitComment(storeComment.url({ post: post.hashid }), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <ResidentLayout>
            <Head title={post.title || 'Post'} />

            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-6"
            >
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 shadow-sm transition-colors hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feed
                </Link>
            </motion.div>

            {/* Post */}
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-gray-100"
            >
                <div className="p-6">
                    {/* Post Header */}
                    <div className="mb-5 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                                <span className="text-lg font-semibold">{post.author.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{post.author.name}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-500">
                                        {post.published_at
                                            ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                            : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                    </p>
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
                    {post.title && <h1 className="mb-4 text-2xl font-bold text-gray-900">{post.title}</h1>}

                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                        <div className="mb-6">
                            {post.media.length === 1 ? (
                                <img src={post.media[0].url} alt="" className="max-h-[500px] w-full rounded-xl bg-gray-50 object-contain" />
                            ) : (
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                                    {post.media.map((media) => (
                                        <img key={media.id} src={media.url} alt="" className="h-48 w-full rounded-xl object-cover" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="prose prose-gray max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: post.body }} />
                </div>
            </motion.article>

            {/* Comments Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="mt-6"
            >
                <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-gray-100">
                    <h3 className="mb-6 font-bold text-gray-900">Comments ({post.comments_count})</h3>

                    {/* Comments List */}
                    {comments.data.length > 0 ? (
                        <div className="mb-8 space-y-6">
                            {comments.data.map((comment) => (
                                <CommentItem key={comment.id} comment={comment} postHashid={post.hashid} />
                            ))}

                            {/* Load More */}
                            {comments.next_page_url && (
                                <div ref={loadMoreRef} className="flex justify-center pt-4">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mb-8 py-8 text-center">
                            <MessageCircle className="mx-auto h-10 w-10 text-gray-200" />
                            <p className="mt-2 text-sm text-gray-500">No comments yet. Be the first to start the conversation!</p>
                        </div>
                    )}

                    {/* Comment Form */}
                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            <span className="text-xs font-semibold">?</span>
                        </div>
                        <div className="flex-1">
                            <form onSubmit={handleSubmitComment} className="relative">
                                <textarea
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    placeholder="Add a comment..."
                                    rows={2} // Start small
                                    className="block w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                                <div className="absolute right-2 bottom-2">
                                    <button
                                        type="submit"
                                        disabled={processing || !data.body.trim()}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300 disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                            {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
                        </div>
                    </div>
                </div>
            </motion.div>
        </ResidentLayout>
    );
}
