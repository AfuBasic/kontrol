import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, MessageCircle, Send, Shield, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import EstateBoardController from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import EstateBoardCommentController from '@/actions/App/Http/Controllers/Security/EstateBoardCommentController';
import SecurityLayout from '@/layouts/SecurityLayout';
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
        router.delete(EstateBoardCommentController.destroy.url({ comment: comment.id }), {
            preserveScroll: true,
        });
    }

    return (
        <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <span className="text-xs font-semibold">{comment.author.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{comment.author.name}</span>
                        <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-slate-700 break-words">{comment.body}</p>
                </div>
                {comment.can_delete && (
                    <div className="mt-1.5 flex items-center gap-3 px-2">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500">Delete?</span>
                                <button onClick={handleDelete} className="text-[10px] font-semibold text-red-600">
                                    Yes
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="text-[10px] font-semibold text-slate-500">
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-1 text-[10px] text-slate-400"
                            >
                                <Trash2 className="h-3 w-3" />
                                Delete
                            </button>
                        )}
                    </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-3">
                        {comment.replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} postHashid={postHashid} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function FeedShow({ post, comments }: Props) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const { data, setData, post: submitComment, processing, reset, errors } = useForm({
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

        submitComment(EstateBoardCommentController.store.url({ post: post.hashid }), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <SecurityLayout>
            <Head title={post.title || 'Post'} />

            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
            >
                <Link
                    href={EstateBoardController.index.url()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-100 transition-all active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>
            </motion.div>

            {/* Post Card */}
            <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
            >
                {/* Media */}
                {post.media && post.media.length > 0 && (
                    <div className="relative">
                        {post.media.length === 1 ? (
                            <img src={post.media[0].url} alt="" className="max-h-80 w-full object-cover" />
                        ) : (
                            <div className="grid grid-cols-2 gap-0.5">
                                {post.media.slice(0, 4).map((media, idx) => (
                                    <div key={media.id} className="relative">
                                        <img src={media.url} alt="" className="h-40 w-full object-cover" />
                                        {idx === 3 && post.media.length > 4 && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                <span className="text-lg font-bold text-white">+{post.media.length - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4">
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white">
                                {post.author.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{post.author.name}</p>
                                <p className="text-[10px] text-slate-500">
                                    {post.published_at
                                        ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                        : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {getAudienceIcon(post.audience)}
                            {getAudienceLabel(post.audience)}
                        </span>
                    </div>

                    {/* Title */}
                    {post.title && <h1 className="mb-2 text-lg font-bold text-slate-900">{post.title}</h1>}

                    {/* Body */}
                    <div
                        className="prose prose-sm prose-slate max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: post.body }}
                    />

                    {/* Comment Count */}
                    <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                        <MessageCircle className="h-4 w-4" />
                        <span>
                            {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
                        </span>
                    </div>
                </div>
            </motion.article>

            {/* Comment Form */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
                <form onSubmit={handleSubmitComment}>
                    <textarea
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        placeholder="Write a comment..."
                        rows={2}
                        className="block w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                    <div className="mt-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing || !data.body.trim()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {processing ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Comments List */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mt-4"
            >
                {comments.data.length > 0 ? (
                    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Comments</h3>
                        <div className="space-y-4">
                            {comments.data.map((comment) => (
                                <CommentItem key={comment.id} comment={comment} postHashid={post.hashid} />
                            ))}
                        </div>

                        {/* Load More */}
                        {comments.next_page_url && (
                            <div ref={loadMoreRef} className="flex justify-center pt-2">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
                        <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm text-slate-500">No comments yet</p>
                    </div>
                )}
            </motion.div>
        </SecurityLayout>
    );
}
