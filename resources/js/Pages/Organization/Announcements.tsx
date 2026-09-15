import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, Building2, Check, ChevronRight, FileText, Image as ImageIcon, MessageSquare, Share2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { PostMedia } from '@/types';
import { extractAnnouncementPreview } from '@/Utils/announcementPreview';

interface Post {
    id: number;
    hashid?: string;
    title: string | null;
    body: string;
    category: string;
    priority: string;
    is_read: boolean;
    read_at: string | null;
    published_at: string | null;
    published_at_human: string;
    publisher_name: string;
    publisher_role: string;
    author_name: string | null;
    comments_count: number;
    media_count: number;
    media?: PostMedia[];
}

interface CursorPaginatedPosts {
    data: Post[];
    next_cursor: string | null;
    prev_cursor: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    per_page: number;
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
    unread_count?: number;
    posts: CursorPaginatedPosts;
}

const CATEGORY_META: Record<string, { label: string; tone: string }> = {
    general: { label: 'Notice', tone: 'text-slate-600 bg-slate-100' },
    meeting: { label: 'Meeting', tone: 'text-sky-700 bg-sky-50' },
    maintenance: { label: 'Maintenance', tone: 'text-amber-700 bg-amber-50' },
    security: { label: 'Security', tone: 'text-rose-700 bg-rose-50' },
    event: { label: 'Community Event', tone: 'text-indigo-700 bg-indigo-50' },
};

function formatFeedTimestamp(isoString: string | null, humanFallback: string): string {
    if (!isoString) return humanFallback || 'Recently';

    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

export default function Announcements({ organization, estate, posts }: Props) {
    const estateName = estate?.name || organization.estate_name || 'Golden Heights';
    const [items, setItems] = useState<Post[]>(posts.data);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(posts.next_page_url);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    // Sync when fresh props arrive from initial page navigation
    useEffect(() => {
        setItems(posts.data);
        setNextPageUrl(posts.next_page_url);
    }, [posts]);

    const loadMore = useCallback(() => {
        if (!nextPageUrl || isLoadingMore.current) return;

        isLoadingMore.current = true;
        router.get(
            nextPageUrl,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onSuccess: (page) => {
                    const newPosts = (page.props as any).posts as CursorPaginatedPosts;
                    setItems((prev) => {
                        const existingIds = new Set(prev.map((p) => p.id));
                        const uniqueNew = newPosts.data.filter((p) => !existingIds.has(p.id));
                        return [...prev, ...uniqueNew];
                    });
                    setNextPageUrl(newPosts.next_page_url);
                },
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [nextPageUrl]);

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

    const handleQuickShare = async (e: React.MouseEvent, post: Post) => {
        e.preventDefault();
        e.stopPropagation();

        const postUrl = `${window.location.origin}/org/announcements/${post.hashid || post.id}`;
        const shareData = {
            title: post.title || 'Estate Announcement',
            text: `${post.publisher_name}: ${post.title || ''}`,
            url: postUrl,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch {
                // Cancel
            }
        } else {
            try {
                await navigator.clipboard.writeText(postUrl);
                setCopiedId(post.id);
                setTimeout(() => setCopiedId(null), 2000);
            } catch {
                // Fallback
            }
        }
    };

    return (
        <OrganizationLayout title="Announcements" contentClassName="max-w-xl px-0 sm:px-4">
            <Head title={`Updates - ${estateName}`} />

            <div className="text-left">
                {/* 1. Restrained Header: Fast entry into actual estate communication */}
                <header className="px-4 py-3 sm:px-1 sm:py-3.5 border-b border-slate-100 sm:border-b-0">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        Updates
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                        {estateName}
                    </p>
                </header>

                {/* 2. Community Stream Feed or Empty State */}
                {items.length === 0 ? (
                    <div className="px-4 py-16 text-center sm:py-20">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Building2 className="h-6 w-6 stroke-[1.5]" />
                        </div>
                        <h2 className="mt-4 text-base font-semibold text-slate-900">
                            You're all caught up
                        </h2>
                        <p className="mt-1 mx-auto max-w-xs text-xs sm:text-sm font-normal text-slate-500 leading-relaxed">
                            There aren't any estate updates yet. New announcements from {estateName} will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100/90 sm:space-y-4 sm:divide-y-0">
                        {items.map((post) => {
                            const isUnread = !post.is_read;
                            const isCritical = post.priority === 'critical';
                            const isImportant = post.priority === 'important';
                            const preview = extractAnnouncementPreview(post.body, 220);
                            const category = CATEGORY_META[post.category] || {
                                label: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Notice',
                                tone: 'text-slate-600 bg-slate-100',
                            };
                            const timeLabel = formatFeedTimestamp(post.published_at, post.published_at_human);

                            const images = post.media?.filter((m) => m.mime_type?.startsWith('image/')) || [];
                            const nonImageMedia = post.media?.filter((m) => !m.mime_type?.startsWith('image/')) || [];
                            const postDetailUrl = `/org/announcements/${post.hashid || post.id}`;

                            return (
                                <article
                                    key={post.id}
                                    className={`relative transition-colors duration-150 sm:rounded-2xl sm:border sm:border-slate-200/70 sm:shadow-xs ${
                                        isUnread ? 'bg-white' : 'bg-slate-50/40 sm:bg-white'
                                    }`}
                                >
                                    {/* Critical Semantic Header Banner */}
                                    {isCritical && (
                                        <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50/80 px-4 py-1.5 text-[11px] font-semibold text-rose-800 sm:rounded-t-2xl sm:px-5">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                                            <span>Urgent Estate Advisory</span>
                                        </div>
                                    )}

                                    {/* Main Feed Content Container */}
                                    <div className="p-4 sm:p-5">
                                        {/* Publisher Identity Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {/* Estate Avatar / Monogram */}
                                                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold tracking-wide text-white shadow-xs sm:h-10 sm:w-10 sm:text-sm">
                                                    <span>{estateName.charAt(0).toUpperCase()}</span>
                                                    {isUnread && (
                                                        <span
                                                            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                                                            title="Unread notice"
                                                            aria-label="Unread notice"
                                                        />
                                                    )}
                                                </div>

                                                {/* Publisher Name, Provenance & Timestamp */}
                                                <div className="min-w-0 flex-1 text-left">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-semibold text-slate-900 truncate sm:text-sm">
                                                            {post.publisher_name || estateName}
                                                        </span>
                                                        {isImportant && !isCritical && (
                                                            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-800">
                                                                Important
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-normal sm:text-xs">
                                                        <span>{post.publisher_role}</span>
                                                        <span>·</span>
                                                        <time dateTime={post.published_at || undefined} className="text-slate-400">
                                                            {timeLabel}
                                                        </time>
                                                        {post.author_name && (
                                                            <>
                                                                <span className="hidden xs:inline text-slate-300">·</span>
                                                                <span className="hidden xs:inline text-slate-400 truncate max-w-[110px]">
                                                                    by {post.author_name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Share Button Affordance */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleQuickShare(e, post)}
                                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                                                title="Share notice"
                                                aria-label="Share notice"
                                            >
                                                {copiedId === post.id ? (
                                                    <Check className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <Share2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Announcement Title & Prose Area */}
                                        <div className="mt-3">
                                            {post.title && (
                                                <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-slate-950 sm:text-base">
                                                    <Link
                                                        href={postDetailUrl}
                                                        className="hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                </h2>
                                            )}

                                            {/* Preview Excerpt */}
                                            {preview && (
                                                <div className="mt-1.5 text-xs sm:text-sm font-normal leading-relaxed text-slate-700">
                                                    <p className="whitespace-pre-line line-clamp-3">
                                                        {preview}
                                                    </p>
                                                    <Link
                                                        href={postDetailUrl}
                                                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        <span>Read more</span>
                                                        <ChevronRight className="h-3 w-3 stroke-[2.5]" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Optional Media (Inline Aspect Ratio) */}
                                        {images.length > 0 && (
                                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                                <Link href={postDetailUrl} className="block group">
                                                    {images.length === 1 ? (
                                                        <div className="aspect-16/9 sm:aspect-2/1 w-full overflow-hidden bg-slate-100">
                                                            <img
                                                                src={images[0].url}
                                                                alt={post.title || 'Notice attachment'}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-1 bg-slate-100">
                                                            {images.slice(0, 2).map((img, idx) => (
                                                                <div key={img.id || idx} className="relative aspect-4/3 overflow-hidden bg-slate-200">
                                                                    <img
                                                                        src={img.url}
                                                                        alt={post.title || 'Notice attachment'}
                                                                        className="h-full w-full object-cover"
                                                                        loading="lazy"
                                                                    />
                                                                    {idx === 1 && images.length > 2 && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-xs font-semibold text-white backdrop-blur-xs">
                                                                            +{images.length - 2} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Link>
                                            </div>
                                        )}

                                        {/* Document Attachments indicator */}
                                        {nonImageMedia.length > 0 && (
                                            <Link
                                                href={postDetailUrl}
                                                className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    {nonImageMedia.length} document attachment{nonImageMedia.length > 1 ? 's' : ''}
                                                </span>
                                                <ChevronRight className="h-3 w-3 text-slate-400 ml-auto shrink-0" />
                                            </Link>
                                        )}

                                        {/* Bottom Action Bar: Category + Discussion / Comment engagement */}
                                        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100/80 text-xs">
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${category.tone}`}>
                                                {category.label}
                                            </span>

                                            {/* Discussion & Comment Affordance */}
                                            <Link
                                                href={`${postDetailUrl}#discussion`}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                                <span>
                                                    {post.comments_count > 0 ? (
                                                        <span>
                                                            {post.comments_count}{' '}
                                                            <span className="hidden xs:inline">
                                                                {post.comments_count === 1 ? 'comment' : 'comments'}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span>Comment</span>
                                                    )}
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                        {/* Infinite Scroll Trigger Indicator */}
                        {nextPageUrl && (
                            <div ref={loadMoreRef} className="flex justify-center py-6">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}


