import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Building2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { index as announcementsIndex, storeComment } from '@/actions/App/Http/Controllers/Organization/AnnouncementController';
import AnnouncementAttachments from '@/Components/EstateBoard/AnnouncementAttachments';
import AnnouncementDiscussion from '@/Components/EstateBoard/AnnouncementDiscussion';
import AnnouncementProse from '@/Components/EstateBoard/AnnouncementProse';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { CursorPaginatedComments, PostMedia } from '@/types';

interface DetailPost {
    id: number;
    hashid?: string;
    title: string | null;
    body: string;
    category: string;
    priority: string;
    published_at: string | null;
    published_at_label: string;
    published_at_timezone: string;
    publisher_name: string;
    publisher_role: string;
    author_name: string | null;
    comments_count?: number;
    media?: PostMedia[];
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        estate_name?: string;
    };
    estate?: {
        id: number;
        name: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    post: DetailPost;
    comments: CursorPaginatedComments;
}

const CATEGORY_META: Record<string, { label: string; tone: string }> = {
    general: { label: 'Estate update', tone: 'text-slate-600' },
    meeting: { label: 'Meeting', tone: 'text-sky-700' },
    maintenance: { label: 'Maintenance', tone: 'text-amber-700' },
    security: { label: 'Security', tone: 'text-rose-700' },
    event: { label: 'Community event', tone: 'text-indigo-700' },
};

export default function AnnouncementDetail({ organization, estate, post, comments }: Props) {
    const estateName = estate?.name || organization.estate_name || 'Estate';
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);
    const category = CATEGORY_META[post.category] || {
        label: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Estate update',
        tone: 'text-slate-600',
    };
    const isCritical = post.priority === 'critical';
    const isImportant = post.priority === 'important';
    const { data, setData, post: submitComment, processing, reset, errors } = useForm({ body: '' });

    const loadMore = useCallback(() => {
        if (!comments?.next_page_url || isLoadingMore.current) {
            return;
        }

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
    }, [comments?.next_page_url]);

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

    function returnToFeed() {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit(announcementsIndex.url());
    }

    function handleSubmitComment(event: React.FormEvent) {
        event.preventDefault();
        if (!data.body.trim()) {
            return;
        }

        submitComment(storeComment.url(post.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <OrganizationLayout title="Announcement" contentClassName="max-w-5xl px-4 sm:px-6" hideBottomNav={true}>
            <Head title={`${post.title || 'Announcement'} - ${estateName}`} />

            <main className="mx-auto w-full max-w-3xl pb-20 sm:pb-24">
                <button
                    type="button"
                    onClick={returnToFeed}
                    className="group mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0b4aa2]"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Back to updates
                </button>

                <article className="mt-7 sm:mt-10">
                    {isCritical && (
                        <div className="mb-7 flex items-start gap-3 border-y border-rose-200 bg-rose-50/70 px-1 py-3.5 text-rose-900 sm:px-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                            <div>
                                <p className="text-sm font-semibold">Urgent estate advisory</p>
                                <p className="mt-0.5 text-sm text-rose-700">Please read this update carefully.</p>
                            </div>
                        </div>
                    )}

                    <header>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b4aa2] text-white shadow-sm shadow-blue-950/10">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">{post.publisher_name || estateName}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{post.publisher_role}</p>
                            </div>
                        </div>

                        <div className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium">
                            <span className={category.tone}>{category.label}</span>
                            {isImportant && !isCritical && (
                                <>
                                    <span aria-hidden="true" className="text-slate-300">
                                        ·
                                    </span>
                                    <span className="text-amber-700">Important</span>
                                </>
                            )}
                        </div>

                        <h1 className="mt-3 max-w-[22ch] text-[1.75rem] leading-[1.16] font-semibold tracking-normal break-words text-slate-950 sm:text-4xl sm:leading-[1.12]">
                            {post.title || 'Estate update'}
                        </h1>

                        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                            {post.author_name && <span>By {post.author_name}</span>}
                            {post.author_name && <span aria-hidden="true">·</span>}
                            <time dateTime={post.published_at || undefined} title={post.published_at_timezone}>
                                {post.published_at_label}
                            </time>
                        </div>
                    </header>

                    <div className="mt-8 border-t border-slate-200 pt-7 sm:mt-10 sm:pt-9">
                        <AnnouncementProse html={post.body} />
                    </div>

                    {post.media && post.media.length > 0 && <AnnouncementAttachments media={post.media} className="mt-10 sm:mt-12" />}
                </article>

                <div id="discussion" className="mt-12 border-t border-slate-200 pt-9 sm:mt-16 sm:pt-11">
                    <AnnouncementDiscussion
                        comments={comments?.data || []}
                        commentsCount={post.comments_count ?? comments?.data?.length ?? 0}
                        commentBody={data.body}
                        onCommentBodyChange={(value) => setData('body', value)}
                        onSubmitComment={handleSubmitComment}
                        canDeleteComments={false}
                        processing={processing}
                        error={errors.body}
                        nextPageUrl={comments?.next_page_url}
                        loadMoreRef={loadMoreRef}
                        variant="article"
                    />
                </div>
            </main>
        </OrganizationLayout>
    );
}
