import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Trash2,
    Users,
    Shield,
    Globe,
    Clock,
    CheckCircle2,
    Eye,
    MessageCircle,
    Send,
    MoreHorizontal,
    Image as ImageIcon,
    Edit,
    BarChart3,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { store as storeComment, destroy as destroyComment } from '@/actions/App/Http/Controllers/Admin/EstateBoardCommentController';
import { index, destroy, edit } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import type { CursorPaginatedComments, EstateBoardComment, EstateBoardPost, PostAudience } from '@/types';

interface Target {
    type: string;
    name: string;
}

type Props = {
    post: EstateBoardPost;
    comments?: CursorPaginatedComments | null;
    metrics: {
        targets_count: number;
        reads_count: number;
        read_rate: number;
    };
    targets?: Target[];
};

const CATEGORY_COLORS: Record<string, string> = {
    general: 'bg-slate-100 text-slate-700 ring-slate-200',
    meeting: 'bg-blue-100 text-blue-700 ring-blue-200',
    maintenance: 'bg-orange-100 text-orange-700 ring-orange-200',
    security: 'bg-rose-100 text-rose-700 ring-rose-200',
    event: 'bg-purple-100 text-purple-700 ring-purple-200',
};

const PRIORITY_STYLES: Record<string, { badge: string; border: string }> = {
    normal: { badge: 'bg-slate-100 text-slate-600', border: 'border-slate-100' },
    important: { badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300', border: 'border-amber-200' },
    critical: { badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300 animate-pulse', border: 'border-rose-200' },
};

function getAudienceIcon(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return <Users className="h-4 w-4" />;
        case 'security':
            return <Shield className="h-4 w-4" />;
        default:
            return <Globe className="h-4 w-4" />;
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

function CommentItem({ comment, postHashid }: { comment: EstateBoardComment; postHashid: string }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    function handleDelete() {
        router.delete(destroyComment.url({ comment: comment.id as any }), {
            preserveScroll: true,
        });
    }

    return (
        <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                <span className="text-sm font-bold">{comment.author.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
                <div className="rounded-2xl bg-slate-50 px-5 py-4">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{comment.author.name}</span>
                        <span className="text-xs font-semibold text-slate-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-slate-700">{comment.body}</p>
                </div>
                <div className="mt-2 flex items-center gap-4 px-2">
                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Delete this comment?</span>
                            <button onClick={handleDelete} className="text-xs font-bold text-rose-600 hover:text-rose-700">
                                Yes
                            </button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-rose-600"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </button>
                    )}
                </div>

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 border-l-2 border-slate-100 pl-5">
                        {comment.replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} postHashid={postHashid} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EstateBoardShow({ post, comments, metrics, targets }: Props) {
    const { confirm } = useAdminConfirmation();
    const [showActions, setShowActions] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);
    const commentPage = comments ?? { data: [], next_page_url: null as string | null };

    const { data, setData, post: submitComment, processing, reset, errors } = useForm({ body: '' });

    const handleDelete = () => {
        confirm({
            title: 'Delete broadcast',
            message: 'Are you sure you want to delete this broadcast? This action cannot be undone.',
            confirmLabel: 'Delete broadcast',
            onConfirm: () => router.delete(destroy.url({ post: post.hashid as any })),
        });
    };

    const loadMore = useCallback(() => {
        if (!commentPage.next_page_url || isLoadingMore.current) return;
        isLoadingMore.current = true;
        router.get(
            commentPage.next_page_url,
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
    }, [commentPage.next_page_url]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMore();
            },
            { threshold: 0.1 },
        );
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [loadMore]);

    function handleSubmitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!data.body.trim()) return;
        submitComment(storeComment.url({ post: post.hashid as any }), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    const priorityStyle = PRIORITY_STYLES[post.priority || 'normal'];

    return (
        <div className="mx-auto max-w-5xl pb-32">
            <Head title={`Broadcast - ${post.title || 'Untitled'}`} />

            {/* Top Navigation */}
            <div className="mb-8 flex items-center justify-between">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feed
                </Link>

                <div className="relative flex items-center gap-2">
                    <Link
                        href={edit.url({ post: post.hashid as any })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                        title="Edit Broadcast"
                    >
                        <Edit className="h-4 w-4" />
                    </Link>
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </button>

                    <AnimatePresence>
                        {showActions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute top-full right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5"
                            >
                                <div className="p-1">
                                    <button
                                        onClick={handleDelete}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Broadcast
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main Content Column */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Hero Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 ${priorityStyle?.border ? `border-t-4 ${priorityStyle.border}` : ''}`}
                    >
                        <div className="p-8 sm:p-10">
                            {/* Author & Meta */}
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 ring-4 ring-primary-50">
                                        <span className="text-lg font-black">{post.author.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{post.author.name}</p>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            {post.published_at
                                                ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                                : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 flex flex-wrap items-center gap-3">
                                {post.category && (
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase ring-1 ring-inset ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}
                                    >
                                        {post.category}
                                    </span>
                                )}
                                {post.priority && post.priority !== 'normal' && (
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase ${priorityStyle.badge}`}
                                    >
                                        {post.priority}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl">
                                {post.title || 'Untitled Broadcast'}
                            </h1>

                            <div className="prose prose-slate prose-lg mt-8 max-w-none">
                                <div className="leading-relaxed font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: post.body }} />
                            </div>

                            {/* Media */}
                            {post.media && post.media.length > 0 && (
                                <div className="mt-8 border-t border-slate-100 pt-8">
                                    <div className="mb-4 flex items-center gap-2 text-slate-400">
                                        <ImageIcon className="h-5 w-5" />
                                        <h3 className="text-xs font-black tracking-wider uppercase">Attachments</h3>
                                    </div>
                                    {post.media.length === 1 ? (
                                        <img
                                            src={post.media[0].url}
                                            alt=""
                                            className="max-h-[500px] w-full rounded-2xl object-cover shadow-sm ring-1 ring-slate-200"
                                        />
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                                            {post.media.map((media) => (
                                                <img
                                                    key={media.id}
                                                    src={media.url}
                                                    alt=""
                                                    className="aspect-square w-full rounded-2xl object-cover shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Comments Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-900">Discussion</h2>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{post.comments_count}</span>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <form onSubmit={handleSubmitComment}>
                                <textarea
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    placeholder="Write your comment..."
                                    rows={3}
                                    className="block w-full resize-none rounded-2xl border-0 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-primary-600 focus:ring-inset"
                                />
                                {errors.body && <p className="mt-2 text-sm font-semibold text-rose-600">{errors.body}</p>}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing || !data.body.trim()}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                        {processing ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>

                        <Deferred data="comments" fallback={<div className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-white" />}>
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                                {commentPage.data.length > 0 ? (
                                    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                        <div className="space-y-6">
                                            {commentPage.data.map((comment) => (
                                                <CommentItem key={comment.id} comment={comment} postHashid={post.hashid} />
                                            ))}
                                        </div>
                                        {commentPage.next_page_url && (
                                            <div ref={loadMoreRef} className="flex justify-center pt-6">
                                                <div className="flex gap-2">
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                                            <MessageCircle className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No comments yet</h3>
                                        <p className="mt-1 text-sm font-medium text-slate-500">Be the first to share your thoughts!</p>
                                    </div>
                                )}
                            </motion.div>
                        </Deferred>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Delivery Insights */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl"
                    >
                        <div className="mb-6 flex items-center gap-2 text-primary-200">
                            <BarChart3 className="h-5 w-5 opacity-70" />
                            <h3 className="text-xs font-black tracking-wider uppercase">Delivery Insights</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-end justify-between">
                                    <span className="text-3xl font-black">{metrics.read_rate}%</span>
                                    <span className="pb-1 text-sm font-semibold text-primary-200">Read Rate</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metrics.read_rate}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                                <div>
                                    <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">Delivered</p>
                                    <p className="flex items-center gap-2 text-lg font-bold">
                                        <CheckCircle2 className="h-4 w-4 text-primary-400" />
                                        {metrics.targets_count}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">Read</p>
                                    <p className="flex items-center gap-2 text-lg font-bold">
                                        <Eye className="h-4 w-4 text-emerald-400" />
                                        {metrics.reads_count}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Audience Targets */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
                    >
                        <div className="mb-6 flex items-center gap-2 text-slate-400">
                            <Globe className="h-5 w-5" />
                            <h3 className="text-xs font-black tracking-wider uppercase">Audience Targeting</h3>
                        </div>

                        {post.applies_to === 'all' || !targets ? (
                            <div className="rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-100">
                                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                                    {getAudienceIcon(post.audience)}
                                </div>
                                <p className="text-sm font-bold text-slate-900">{getAudienceLabel(post.audience)}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    This broadcast was visible to {getAudienceLabel(post.audience).toLowerCase()}.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2">
                                    {targets.map((tgt, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
                                        >
                                            <span className="text-sm font-bold text-slate-700">{tgt.name}</span>
                                            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black tracking-wider text-slate-400 uppercase shadow-sm ring-1 ring-slate-200">
                                                {tgt.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
