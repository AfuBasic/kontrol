import { router } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarDays, MessageSquare, Megaphone, PartyPopper, Shield, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import type { EstateBoardPost, PostCategory } from '@/types';

type Props = {
    post: EstateBoardPost;
    estateName: string;
};

const CATEGORY: Record<PostCategory, { label: string; icon: LucideIcon }> = {
    general: { label: 'Notice', icon: Megaphone },
    meeting: { label: 'Meeting', icon: CalendarDays },
    maintenance: { label: 'Maintenance', icon: Wrench },
    security: { label: 'Security', icon: Shield },
    event: { label: 'Event', icon: PartyPopper },
};

const initialsOf = (name: string): string => {
    const parts = name.trim().split(/\s+/);

    return parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const stripHtml = (html: string): string =>
    html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * One announcement as a post in the estate feed. Same anatomy as an incident post:
 * who and when, a quiet label row, the headline, an excerpt, then the reactions.
 * Urgency is a small chip, never a coloured edge.
 */
export default function EstateBoardFeedPost({ post, estateName }: Props) {
    const isUnread = !post.is_read;
    const category = CATEGORY[post.category as PostCategory] ?? CATEGORY.general;
    const CategoryIcon = category.icon;
    const showCategory = post.category && post.category !== 'general';
    const isLandlord = Boolean(post.property_owner_id);

    const sender = isLandlord ? (post.author?.name ? `Landlord (${post.author.name})` : 'Landlord Bulletin') : estateName || 'Estate Office';
    const body = post.body ? stripHtml(post.body) : '';
    const href = `/resident/estate-board/${post.hashid}`;
    const images = (post.media ?? []).filter((item) => item.mime_type?.startsWith('image/'));

    let dateLabel = '';
    let relative = 'recently';
    try {
        const published = new Date(post.published_at || post.created_at);
        dateLabel = format(published, 'd MMM yyyy');
        relative = formatDistanceToNow(published, { addSuffix: true });
    } catch {
        // keep the fallbacks
    }

    const urgency =
        post.priority === 'critical'
            ? { label: 'Critical', tone: 'border-rose-200 bg-rose-50 text-rose-700' }
            : post.priority === 'important'
              ? { label: 'Important', tone: 'border-amber-200 bg-amber-50 text-amber-700' }
              : null;

    const open = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, a')) {
            return;
        }
        router.visit(href);
    };

    return (
        <article
            onClick={open}
            className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-colors hover:border-slate-300 active:bg-slate-50/60"
        >
            <header className="flex items-center gap-3">
                <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600">
                        {isLandlord ? (
                            initialsOf(sender.replace(/^Landlord \(|\)$/g, ''))
                        ) : (
                            <Megaphone className="h-[18px] w-[18px] text-slate-500" />
                        )}
                    </div>
                    {isUnread && (
                        <span
                            className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary-500"
                            aria-label="Unread"
                        />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] leading-5 font-semibold text-slate-900">{sender}</p>
                    <p className="mt-0.5 truncate text-[13px] leading-4 text-slate-500">
                        <time dateTime={post.published_at || post.created_at}>{dateLabel}</time>
                        <span className="text-slate-300"> · </span>
                        {relative}
                    </p>
                </div>
            </header>

            {(showCategory || urgency) && (
                <div className="mt-3.5 flex min-w-0 items-center gap-2">
                    {showCategory && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                            <CategoryIcon className="h-3.5 w-3.5" />
                            {category.label}
                        </span>
                    )}
                    {urgency && (
                        <span
                            className={`ml-auto inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${urgency.tone}`}
                        >
                            {urgency.label}
                        </span>
                    )}
                </div>
            )}

            <h3
                className={`${showCategory || urgency ? 'mt-1.5' : 'mt-3.5'} text-[17px] leading-snug font-semibold tracking-tight [overflow-wrap:anywhere] ${
                    isUnread ? 'text-slate-900' : 'text-slate-700'
                }`}
            >
                {post.title || 'Untitled announcement'}
            </h3>

            {body && <p className="mt-1.5 line-clamp-3 text-[15px] leading-6 [overflow-wrap:anywhere] text-slate-600">{body}</p>}

            {images.length > 0 && (
                <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <img src={images[0].url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                    {images.length > 1 && (
                        <span className="absolute right-2 bottom-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                            +{images.length - 1} more
                        </span>
                    )}
                </div>
            )}

            <footer className="mt-3.5 flex items-center gap-1 border-t border-slate-100 pt-2.5 text-[13px] font-medium text-slate-500">
                <span className="inline-flex min-h-9 items-center gap-1.5 px-2.5">
                    <MessageSquare className="h-[18px] w-[18px]" />
                    {post.comments_count > 0 ? post.comments_count : 'Comment'}
                </span>
                {isUnread && <span className="ml-auto text-[11px] font-semibold tracking-wide text-primary-600 uppercase">New</span>}
            </footer>
        </article>
    );
}
