import React from 'react';
import { Link } from '@inertiajs/react';
import {
    ChevronRight,
    Clock,
    MapPin,
    MessageSquare,
    Paperclip,
    ThumbsUp,
    User,
} from 'lucide-react';
import type { Incident } from '@/types/incidents';
import IncidentStatusBadge from './IncidentStatusBadge';
import IncidentCategoryLabel from './IncidentCategoryLabel';

interface Props {
    incident: Incident;
    variant?: 'resident' | 'security' | 'admin';
    href: string;
    className?: string;
}

export default function IncidentCard({
    incident,
    variant = 'resident',
    href,
    className = '',
}: Props) {
    const isResolved = incident.status === 'solved' || incident.status === 'closed';

    const formatDate = (isoString: string) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    // Calculate left border accent color based on status
    const statusAccentBorder = {
        pending: 'border-l-amber-500',
        acknowledged: 'border-l-blue-500',
        resolving: 'border-l-indigo-600',
        solved: 'border-l-emerald-500',
        closed: 'border-l-slate-400',
    }[incident.status] || 'border-l-slate-300';

    return (
        <Link
            href={href}
            className={`group relative block rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 border-l-[6px] ${statusAccentBorder} ${
                isResolved ? 'opacity-85 hover:opacity-100' : ''
            } ${className}`}
        >
            {/* Top Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                    <IncidentCategoryLabel
                        category={incident.category}
                        size="sm"
                        showBadge
                    />
                    {incident.reference_code && (
                        <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">
                            {incident.reference_code}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {incident.priority && variant !== 'resident' && (
                        <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                incident.priority === 'critical'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : incident.priority === 'high'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                        >
                            {incident.priority}
                        </span>
                    )}
                    <IncidentStatusBadge status={incident.status} size="sm" />
                </div>
            </div>

            {/* Title & Excerpt */}
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                {incident.title}
            </h3>

            {incident.body && (
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                    {incident.body}
                </p>
            )}

            {/* Footer Information */}
            <div className="mt-4 pt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                    {incident.location && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px] sm:max-w-[220px]">
                                {incident.location}
                            </span>
                        </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {formatDate(incident.created_at)}
                    </span>

                    {incident.reporter?.name && (
                        <span className="inline-flex items-center gap-1 text-[11px]">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {incident.reporter.name}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {incident.attachment_url && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            <Paperclip className="w-3 h-3" />
                            Photo
                        </span>
                    )}

                    {incident.upvotes_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            <ThumbsUp className="w-3 h-3" />
                            {incident.upvotes_count}
                        </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {incident.comments_count || 0}
                    </span>

                    <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </div>
            </div>
        </Link>
    );
}
