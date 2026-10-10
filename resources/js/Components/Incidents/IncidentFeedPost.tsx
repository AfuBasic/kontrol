import { Link, router } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowBigUp, MessageSquare } from 'lucide-react';
import React, { useState } from 'react';
import type { Incident } from '@/types/incidents';
import IncidentCategoryLabel from './IncidentCategoryLabel';
import IncidentStatusBadge from './IncidentStatusBadge';

interface Props {
    incident: Incident;
    href: string;
}

const initialsOf = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);

    return parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * One incident as a post in the resident feed: who reported it and when, what it is, what people said.
 * Status is a small chip in the header, never a coloured edge, so cards read as posts and not as alerts.
 */
export default function IncidentFeedPost({ incident, href }: Props) {
    const isResolved = incident.status === 'solved' || incident.status === 'closed';
    const canUpvote = !isResolved;

    const [isUpvoted, setIsUpvoted] = useState(Boolean(incident.is_upvoted));
    const [upvotesCount, setUpvotesCount] = useState(incident.upvotes_count || 0);

    const reporterName = incident.reporter?.name || 'Anonymous Resident';
    const place = incident.zone?.name || incident.location;
    const commentsCount = incident.comments_count || 0;

    // Both are shown: the calendar date for certainty, the relative time for a quick read.
    let dateLabel = '';
    let relative = 'recently';
    try {
        const created = new Date(incident.created_at);
        dateLabel = format(created, 'd MMM yyyy');
        relative = formatDistanceToNow(created, { addSuffix: true });
    } catch {
        // keep the fallbacks
    }

    const open = (e: React.MouseEvent) => {
        // Buttons and links inside the card do their own thing.
        if ((e.target as HTMLElement).closest('button, a')) {
            return;
        }
        router.visit(href);
    };

    const toggleUpvote = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!canUpvote) {
            return;
        }

        const next = !isUpvoted;
        setIsUpvoted(next);
        setUpvotesCount((count) => (next ? count + 1 : Math.max(0, count - 1)));

        router.post(
            `/resident/incidents/${incident.hashid}/upvote`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setIsUpvoted(!next);
                    setUpvotesCount((count) => (!next ? count + 1 : Math.max(0, count - 1)));
                },
            },
        );
    };

    return (
        <article
            onClick={open}
            className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-colors hover:border-slate-300 active:bg-slate-50/60"
        >
            <header className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600">
                    {initialsOf(reporterName)}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] leading-5 font-semibold text-slate-900">{reporterName}</p>
                    <p className="mt-0.5 truncate text-[13px] leading-4 text-slate-500">
                        <time dateTime={incident.created_at}>{dateLabel}</time>
                        <span className="text-slate-300"> · </span>
                        {relative}
                    </p>
                </div>
            </header>

            <div className="mt-3.5 flex min-w-0 items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <IncidentCategoryLabel category={incident.category} size="xs" showBadge={false} className="shrink-0 text-slate-500" />
                    {place && <span className="truncate font-medium tracking-normal text-slate-400 normal-case">· {place}</span>}
                </div>
                <IncidentStatusBadge status={incident.status} size="sm" showDot />
            </div>

            <h3 className="mt-1.5 text-[17px] leading-snug font-semibold tracking-tight text-slate-900">{incident.title}</h3>

            {incident.body && <p className="mt-1.5 line-clamp-3 text-[15px] leading-6 text-slate-600">{incident.body}</p>}

            {incident.attachment_url && (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <img src={incident.attachment_url} alt={incident.title} loading="lazy" className="max-h-72 w-full object-cover" />
                </div>
            )}

            <footer className="mt-3.5 flex items-center gap-1 border-t border-slate-100 pt-2.5 text-[13px] font-medium text-slate-500">
                <button
                    type="button"
                    onClick={toggleUpvote}
                    disabled={!canUpvote}
                    aria-pressed={isUpvoted}
                    title={isResolved ? 'Upvoting is closed for resolved incidents' : isUpvoted ? 'Remove upvote' : 'Upvote'}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 transition-colors ${
                        isUpvoted ? 'text-primary-700' : 'hover:bg-slate-50 hover:text-slate-700'
                    } ${canUpvote ? 'active:scale-95' : 'cursor-not-allowed opacity-50'}`}
                >
                    <ArrowBigUp className={`h-[18px] w-[18px] ${isUpvoted ? 'fill-current' : ''}`} />
                    <span>{upvotesCount}</span>
                </button>

                <Link
                    href={href}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                    <MessageSquare className="h-[18px] w-[18px]" />
                    <span>{commentsCount}</span>
                </Link>

                {incident.reference_code && (
                    <span className="ml-auto font-mono text-[11px] tracking-wide text-slate-400">{incident.reference_code}</span>
                )}
            </footer>
        </article>
    );
}
