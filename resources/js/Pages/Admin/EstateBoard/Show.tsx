import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Trash2,
    MoreHorizontal,
    Edit,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { store as storeComment, destroy as destroyComment } from '@/actions/App/Http/Controllers/Admin/EstateBoardCommentController';
import { index, destroy, edit } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import AnnouncementAttachments from '@/Components/EstateBoard/AnnouncementAttachments';
import AnnouncementAudienceCard from '@/Components/EstateBoard/AnnouncementAudienceCard';
import AnnouncementDeliveryCard from '@/Components/EstateBoard/AnnouncementDeliveryCard';
import AnnouncementDiscussion from '@/Components/EstateBoard/AnnouncementDiscussion';
import AnnouncementHeader from '@/Components/EstateBoard/AnnouncementHeader';
import AnnouncementMetaCard from '@/Components/EstateBoard/AnnouncementMetaCard';
import AnnouncementProse from '@/Components/EstateBoard/AnnouncementProse';
import type { CursorPaginatedComments, EstateBoardPost } from '@/types';

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
        unread_count?: number;
        read_rate: number;
    };
    targets?: Target[];
};

export default function EstateBoardShow({ post, comments, metrics, targets }: Props) {
    const { confirm } = useAdminConfirmation();
    const [showActions, setShowActions] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);
    const commentPage = comments ?? { data: [], next_page_url: null as string | null };

    const { data, setData, post: submitComment, processing, reset, errors } = useForm({ body: '' });

    const handleDelete = () => {
        confirm({
            title: 'Delete announcement',
            message: 'Are you sure you want to delete this announcement? This action cannot be undone.',
            confirmLabel: 'Delete announcement',
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

    function handleDeleteComment(commentId: number) {
        router.delete(destroyComment.url({ comment: commentId as any }), {
            preserveScroll: true,
        });
    }

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-32">
            <Head title={`Announcement - ${post.title || 'Untitled'}`} />

            {/* Top Contextual Navigation */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Announcements
                </Link>

                <div className="relative flex items-center gap-2">
                    <Link
                        href={edit.url({ post: post.hashid as any })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                    </Link>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowActions(!showActions)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                            aria-label="More actions"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                            {showActions && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                    className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-2xl bg-white p-1 shadow-xl ring-1 ring-slate-900/5"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowActions(false);
                                            handleDelete();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Announcement
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Two-Column Management Workspace */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
                {/* Main Content Column (7 cols) */}
                <div className="space-y-8 lg:col-span-8">
                    {/* Main Reading Surface */}
                    <article className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 lg:p-10 shadow-xs space-y-6 text-left">
                        {/* Header */}
                        <AnnouncementHeader
                            post={post}
                            showStatusBadge={true}
                            isAdminView={true}
                        />

                        <hr className="border-slate-100" />

                        {/* Prose Body */}
                        <AnnouncementProse html={post.body} />

                        {/* Attachments */}
                        {post.media && post.media.length > 0 && (
                            <div className="border-t border-slate-100 pt-6">
                                <AnnouncementAttachments media={post.media} />
                            </div>
                        )}
                    </article>

                    {/* Discussion Section */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
                        <Deferred
                            data="comments"
                            fallback={
                                <div className="space-y-4 py-4">
                                    <div className="h-6 w-32 animate-pulse rounded-lg bg-slate-100" />
                                    <div className="h-24 animate-pulse rounded-2xl bg-slate-50" />
                                </div>
                            }
                        >
                            <AnnouncementDiscussion
                                comments={commentPage.data}
                                commentsCount={post.comments_count}
                                commentBody={data.body}
                                onCommentBodyChange={(val) => setData('body', val)}
                                onSubmitComment={handleSubmitComment}
                                onDeleteComment={handleDeleteComment}
                                processing={processing}
                                error={errors.body}
                                canDeleteGlobal={true}
                                nextPageUrl={commentPage.next_page_url}
                                loadMoreRef={loadMoreRef}
                            />
                        </Deferred>
                    </div>
                </div>

                {/* Secondary Operational Rail (4 cols) */}
                <aside className="space-y-6 lg:col-span-4 sticky top-6">
                    {/* Delivery Insights */}
                    <AnnouncementDeliveryCard metrics={metrics} />

                    {/* Audience Targeting */}
                    <AnnouncementAudienceCard
                        audience={post.audience}
                        appliesTo={post.applies_to}
                        targets={targets}
                        recipientsCount={metrics.targets_count}
                    />

                    {/* Publication Metadata */}
                    <AnnouncementMetaCard
                        publishedAt={post.published_at}
                        createdAt={post.created_at}
                        updatedAt={post.updated_at}
                        category={post.category}
                        priority={post.priority}
                        status={post.status}
                    />
                </aside>
            </div>
        </div>
    );
}
