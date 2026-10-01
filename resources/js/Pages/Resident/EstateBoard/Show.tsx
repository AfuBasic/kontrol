import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Share2, Check, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { store as storeComment, destroy as destroyComment } from '@/actions/App/Http/Controllers/Resident/EstateBoardCommentController';
import { index } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import { useResidentConfirmation } from '@/Components/ConfirmationProvider';
import AnnouncementAttachments from '@/Components/EstateBoard/AnnouncementAttachments';
import AnnouncementDiscussion from '@/Components/EstateBoard/AnnouncementDiscussion';
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

    const isPropertyOwnerCreator = Boolean(post.property_owner_id && auth?.user?.id && post.property_owner_id === auth.user.id);

    const handleDeletePost = () => {
        confirm({
            title: 'Delete announcement',
            message: 'Are you sure you want to delete this announcement?',
            confirmLabel: 'Delete',
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
                // User cancelled
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

    const category = post.category || 'general';

    const categoryLabel =
        category === 'general' ? 'Update' :
        category === 'meeting' ? 'Meeting' :
        category === 'maintenance' ? 'Maintenance' :
        category === 'security' ? 'Security' :
        category === 'event' ? 'Event' : 'Update';

    return (
        <div className="mx-auto max-w-xl pb-24 text-left">
            <Head title={post.title || 'Announcement'} />

            {/* Back + Share */}
            <div className="mb-3 flex items-center justify-between px-1">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                        title="Share"
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

                    {isPropertyOwnerCreator && post.comments_count === 0 && (
                        <button
                            type="button"
                            onClick={handleDeletePost}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 shadow-xs transition-colors hover:bg-rose-100 active:scale-95"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Article */}
            <article>
                {/* Source + Time */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                        {post.property_owner_id
                            ? post.author?.name
                                ? `Landlord (${post.author.name})`
                                : 'Landlord Bulletin'
                            : post.author?.name || 'Estate Office'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                        {post.published_at
                            ? new Date(post.published_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                              })
                            : new Date(post.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                              })}
                    </span>
                </div>

                {/* Title */}
                <h1 className="mt-1.5 text-lg leading-snug font-black tracking-tight [overflow-wrap:anywhere] break-words text-slate-900 sm:text-xl">
                    {post.title || 'Untitled Announcement'}
                </h1>

                {/* Category badge */}
                <span className="mt-2 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                    {categoryLabel}
                </span>

                {/* Priority callout */}
                {post.priority === 'important' && (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        <div>
                            <p className="text-xs font-black tracking-tight text-amber-900">Important Notice</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-amber-700">
                                This announcement requires your attention.
                            </p>
                        </div>
                    </div>
                )}

                {post.priority === 'critical' && (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                        <div>
                            <p className="text-xs font-black tracking-tight text-rose-900">Urgent Announcement</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-rose-700">
                                This is an urgent announcement from estate administration.
                            </p>
                        </div>
                    </div>
                )}

                {/* Divider */}
                <hr className="mt-5 border-slate-100" />

                {/* Body */}
                <div className="mt-5 text-slate-800">
                    <AnnouncementProse html={post.body} />
                </div>

                {/* Attachments */}
                {post.media && post.media.length > 0 && (
                    <div className="mt-6">
                        <AnnouncementAttachments media={post.media} />
                    </div>
                )}
            </article>

            {/* Discussion */}
            <div className="mt-10">
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
                    variant="article"
                />
            </div>
        </div>
    );
}

EstateBoardShow.layout = (page: React.ReactNode) => (
    <ResidentLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
