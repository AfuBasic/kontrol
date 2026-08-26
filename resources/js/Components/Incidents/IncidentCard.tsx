import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowBigUp, ChevronRight, MessageSquare } from 'lucide-react';
import type { Incident } from '@/types/incidents';
import IncidentStatusBadge from './IncidentStatusBadge';
import IncidentCategoryLabel from './IncidentCategoryLabel';

interface Props {
    incident: Incident;
    variant?: 'resident' | 'security' | 'admin';
    href: string;
    className?: string;
    onUpvote?: (incident: Incident) => void;
}

export default function IncidentCard({ incident, variant = 'resident', href, className = '', onUpvote }: Props) {
    const isResolved = incident.status === 'solved' || incident.status === 'closed';
    const canUpvote = variant === 'resident' && !isResolved;
    const isStaffVariant = variant === 'security' || variant === 'admin';
    const forceLight = variant === 'security';
    const dark = (classes: string): string => (forceLight ? '' : classes);

    // Local optimistic upvote state
    const [isUpvoted, setIsUpvoted] = useState(Boolean(incident.is_upvoted));
    const [upvotesCount, setUpvotesCount] = useState(incident.upvotes_count || 0);

    const getRelativeTime = (isoString: string) => {
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true });
        } catch {
            return 'recently';
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const reporterName = incident.reporter?.name || 'Anonymous Resident';
    const relativeTime = getRelativeTime(incident.created_at);
    const locationOrZone = incident.zone?.name || incident.location;
    const commentsCount = incident.comments_count || 0;

    // Semantic status rail on the left
    const statusAccentBorder =
        {
            pending: 'border-l-amber-500',
            acknowledged: 'border-l-blue-500',
            resolving: 'border-l-indigo-600',
            solved: 'border-l-emerald-500',
            closed: 'border-l-slate-400',
        }[incident.status] || 'border-l-slate-300';

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking interactive elements inside
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        router.visit(href);
    };

    const handleUpvoteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!canUpvote) {
            return;
        }

        if (onUpvote) {
            onUpvote(incident);
            return;
        }

        // Optimistic toggle
        const nextState = !isUpvoted;
        setIsUpvoted(nextState);
        setUpvotesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

        router.post(
            `/resident/incidents/${incident.hashid}/upvote`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    // Rollback on error
                    setIsUpvoted(!nextState);
                    setUpvotesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
                },
            },
        );
    };

    return (
        <div
            onClick={handleCardClick}
            className={`group relative block cursor-pointer rounded-[26px] border border-l-[5px] border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all hover:border-slate-300 hover:shadow-md sm:rounded-3xl sm:p-6 ${dark('dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 dark:hover:border-slate-700')} ${statusAccentBorder} ${
                isResolved ? 'opacity-90 hover:opacity-100' : ''
            } ${className}`}
        >
            {/* 1. Header: Category + Status Badge */}
            <div className={`mb-3 flex gap-2 ${isStaffVariant ? 'flex-col items-start' : 'items-center justify-between'}`}>
                <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
                    <IncidentCategoryLabel
                        category={incident.category}
                        size="sm"
                        showBadge
                        forceLight={forceLight}
                        className={isStaffVariant ? 'max-w-full whitespace-nowrap [&>span]:truncate' : ''}
                    />
                    {incident.reference_code && (
                        <span
                            className={`shrink-0 rounded-full bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-500 ${dark('dark:bg-slate-800 dark:text-slate-400')}`}
                        >
                            {incident.reference_code}
                        </span>
                    )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {incident.priority && variant !== 'resident' && (
                        <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider uppercase ${
                                incident.priority === 'critical'
                                    ? `bg-rose-100 text-rose-800 ${dark('dark:bg-rose-950 dark:text-rose-300')}`
                                    : incident.priority === 'high'
                                      ? `bg-orange-100 text-orange-800 ${dark('dark:bg-orange-950 dark:text-orange-300')}`
                                      : `bg-slate-100 text-slate-600 ${dark('dark:bg-slate-800 dark:text-slate-400')}`
                            }`}
                        >
                            {incident.priority}
                        </span>
                    )}
                    <IncidentStatusBadge status={incident.status} size="sm" showDot forceLight={forceLight} />
                </div>
            </div>

            {/* 2. Primary Title */}
            <h3
                className={`text-lg leading-snug font-black tracking-tight text-slate-950 transition-colors group-hover:text-primary-700 sm:text-lg ${dark('dark:text-slate-100 dark:group-hover:text-primary-300')}`}
            >
                {incident.title}
            </h3>

            {/* 3. Description Excerpt */}
            {incident.body && (
                <p className={`mt-2 line-clamp-3 text-sm leading-relaxed font-medium text-slate-500 ${dark('dark:text-slate-400')}`}>
                    {incident.body}
                </p>
            )}

            {/* 4. Media Evidence Preview */}
            {incident.attachment_url && (
                <div
                    className={`mt-3.5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 ${dark('dark:border-slate-800 dark:bg-slate-950/50')}`}
                >
                    <img
                        src={incident.attachment_url}
                        alt={incident.title}
                        loading="lazy"
                        className="max-h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.01] sm:max-h-72"
                    />
                </div>
            )}

            {/* 5. Human Reporter Line */}
            <div
                className={`mt-4 flex items-center gap-3 ${
                    isStaffVariant ? `rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 ${dark('dark:bg-slate-950/40 dark:ring-slate-800/80')}` : ''
                }`}
            >
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-black text-purple-700 ring-1 ring-purple-200/50 ${dark('dark:bg-purple-950/50 dark:text-purple-300 dark:ring-purple-800/40')}`}
                >
                    {getInitials(reporterName)}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                    <p className={`truncate font-bold text-slate-900 ${dark('dark:text-slate-200')}`}>{reporterName}</p>
                    <p className={`truncate text-[11px] text-slate-400 ${dark('dark:text-slate-500')}`}>
                        Reported {relativeTime}
                        {locationOrZone && ` · ${locationOrZone}`}
                    </p>
                </div>
            </div>

            {/* 6. Interaction Footer Bar */}
            <div className={`mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 ${dark('dark:border-slate-800/80')}`}>
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    {variant === 'resident' ? (
                        <button
                            type="button"
                            onClick={handleUpvoteClick}
                            disabled={!canUpvote}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                isUpvoted
                                    ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:ring-purple-800'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800'
                            } ${!canUpvote ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
                            title={isResolved ? 'Upvoting closed incidents is disabled' : isUpvoted ? 'Remove upvote' : 'Upvote this incident'}
                        >
                            <ArrowBigUp className={`h-4 w-4 ${isUpvoted ? 'fill-current' : ''}`} />
                            <span>{upvotesCount}</span>
                            <span className="hidden text-[11px] font-normal opacity-80 sm:inline">{upvotesCount === 1 ? 'upvote' : 'upvotes'}</span>
                        </button>
                    ) : (
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 ${dark('dark:bg-slate-800/60 dark:text-slate-400')}`}
                        >
                            <ArrowBigUp className="h-4 w-4" />
                            {upvotesCount}
                        </span>
                    )}

                    {/* Comments Indicator */}
                    <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 ${dark('dark:text-slate-400 dark:hover:text-slate-200')}`}
                    >
                        <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{commentsCount === 1 ? '1 comment' : `${commentsCount} comments`}</span>
                    </Link>
                </div>

                <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black text-primary-600 transition-colors hover:text-primary-700 ${dark('dark:text-primary-300 dark:hover:text-primary-200')}`}
                >
                    <span>View</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}
