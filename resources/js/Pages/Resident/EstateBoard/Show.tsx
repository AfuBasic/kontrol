import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Trash2, Share2, Check } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { store as storeComment, destroy as destroyComment } from '@/actions/App/Http/Controllers/Resident/EstateBoardCommentController';
import { index } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import { useResidentConfirmation } from '@/Components/ConfirmationProvider';
import AnnouncementAttachments from '@/Components/EstateBoard/AnnouncementAttachments';
import AnnouncementDiscussion from '@/Components/EstateBoard/AnnouncementDiscussion';
import AnnouncementHeader from '@/Components/EstateBoard/AnnouncementHeader';
import AnnouncementProse from '@/Components/EstateBoard/AnnouncementProse';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { CursorPaginatedComments, EstateBoardPost, SharedData } from '@/types';

type Props = {
    post: EstateBoardPost;
    comments: CursorPaginatedComments;
};

export default function EstateBoardShow({ post, comments }: Props) {
    const { confirm } = useResidentConfirmation();
    const { auth } = usePage<SharedData>().props;
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);
    const [copied, setCopied] = useState(false);

    const isPropertyOwnerCreator = Boolean(
        post.property_owner_id && auth?.user?.id && post.property_owner_id === auth.user.id
    );

    const handleDeletePost = () => {
        confirm({
            title: 'Delete announcement',
            message: 'Are you sure you want to delete this announcement?',
            confirmLabel: 'Delete announcement',
            onConfirm: () => router.delete(`/resident/property-owner/announcements/${post.hashid}`),
        });
    };

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

    function handleDeleteComment(commentId: number) {
        router.delete(destroyComment.url({ comment: commentId as any }), {
            preserveScroll: true,
        });
    }

    async function handleShare() {
        const shareData = {
            title: post.title || 'Estate Announcement',
            text: `Announcement from ${post.author?.name || 'Estate'}: ${post.title || ''}`,
            url: window.location.href,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch {
                // User cancelled or error
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // Fallback
            }
        }
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6 sm:py-6 pb-28 text-left">
            <Head title={post.title || 'Announcement'} />

            {/* Quiet Contextual Header */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Feed</span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* Share Action */}
                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                        title="Share announcement"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="h-3.5 w-3.5" />
                                <span>Share</span>
                            </>
                        )}
                    </button>

                    {/* Delete for creator */}
                    {isPropertyOwnerCreator && post.comments_count === 0 && (
                        <button
                            type="button"
                            onClick={handleDeletePost}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200/80 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 shadow-xs transition-colors hover:bg-rose-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Announcement Article Flow */}
            <article className="space-y-6">
                {/* Header */}
                <AnnouncementHeader post={post} />

                <hr className="border-slate-100" />

                {/* Natural Document Flow - Clean Prose */}
                <div className="text-slate-800">
                    <AnnouncementProse html={post.body} />
                </div>

                {/* Attachments */}
                {post.media && post.media.length > 0 && (
                    <div className="border-t border-slate-100 pt-6">
                        <AnnouncementAttachments media={post.media} />
                    </div>
                )}
            </article>

            {/* Discussion Flow */}
            <div className="mt-10 border-t border-slate-200/80 pt-8">
                <AnnouncementDiscussion
                    comments={comments.data}
                    commentsCount={post.comments_count}
                    commentBody={data.body}
                    onCommentBodyChange={(val) => setData('body', val)}
                    onSubmitComment={handleSubmitComment}
                    onDeleteComment={handleDeleteComment}
                    processing={processing}
                    error={errors.body}
                    currentUserId={auth?.user?.id}
                    nextPageUrl={comments.next_page_url}
                    loadMoreRef={loadMoreRef}
                />
            </div>
        </div>
    );
}

EstateBoardShow.layout = (page: React.ReactNode) => (
    <ResidentLayout hideNav={true}>
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
