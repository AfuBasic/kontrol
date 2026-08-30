import { AlertOctagon, AlertTriangle, CalendarDays, CheckCircle2, Home, Megaphone, PartyPopper, Shield, Wrench } from 'lucide-react';
import React from 'react';
import type { EstateBoardPost, PostCategory, PostPriority } from '@/types';

const CATEGORY_CONFIG: Record<PostCategory, { label: string; badge: string; icon: React.ElementType }> = {
    general: { label: 'General', badge: 'bg-slate-100 text-slate-700 ring-slate-200/60', icon: Megaphone },
    meeting: { label: 'Meeting', badge: 'bg-blue-50 text-blue-700 ring-blue-200/60', icon: CalendarDays },
    maintenance: { label: 'Maintenance', badge: 'bg-orange-50 text-orange-700 ring-orange-200/60', icon: Wrench },
    security: { label: 'Security', badge: 'bg-rose-50 text-rose-700 ring-rose-200/60', icon: Shield },
    event: { label: 'Event', badge: 'bg-purple-50 text-purple-700 ring-purple-200/60', icon: PartyPopper },
};

const PRIORITY_CALLOUTS: Record<PostPriority, { banner: string; text: string; icon: React.ElementType; title: string } | null> = {
    normal: null,
    important: {
        banner: 'bg-amber-50/90 border-amber-200/70 text-amber-900',
        text: 'This announcement requires your attention. Please review the details below.',
        icon: AlertTriangle,
        title: 'Important Notice',
    },
    critical: {
        banner: 'bg-rose-50/90 border-rose-200/70 text-rose-900',
        text: 'This is an urgent announcement from estate administration.',
        icon: AlertOctagon,
        title: 'Urgent Announcement',
    },
};

interface AnnouncementHeaderProps {
    post: EstateBoardPost;
    showStatusBadge?: boolean;
    isAdminView?: boolean;
    className?: string;
}

export default function AnnouncementHeader({
    post,
    showStatusBadge = false,
    isAdminView = false,
    className = '',
}: AnnouncementHeaderProps) {
    const category = post.category || 'general';
    const categoryInfo = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
    const CategoryIcon = categoryInfo.icon;
    const priority = post.priority || 'normal';
    const priorityCallout = PRIORITY_CALLOUTS[priority];

    const formattedDate = post.published_at
        ? new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
          }).format(new Date(post.published_at))
        : new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          }).format(new Date(post.created_at));

    const authorName = post.author?.name || 'Estate Administration';
    const initial = authorName.charAt(0).toUpperCase();

    return (
        <header className={`space-y-4 ${className}`}>
            {/* Top Row: Category & Status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wider uppercase ring-1 ring-inset ${categoryInfo.badge}`}
                    >
                        <CategoryIcon className="h-3 w-3" />
                        {categoryInfo.label}
                    </span>

                    {post.property_owner_id ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-purple-700 uppercase ring-1 ring-purple-100">
                            <Home className="h-2.5 w-2.5" /> Landlord Bulletin
                        </span>
                    ) : null}
                </div>

                {showStatusBadge && (
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                            post.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50'
                                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/50'
                        }`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {post.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                {post.title || 'Untitled Announcement'}
            </h1>

            {/* Author & Publication Context */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                            {authorName}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                            {post.published_at ? `Published ${formattedDate}` : `Created ${formattedDate}`}
                        </p>
                    </div>
                </div>

                {!isAdminView && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {post.is_read ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Read</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                                <span>Unread</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Priority Callout if Important / Critical */}
            {priorityCallout && (
                <div className={`flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 text-left transition-all ${priorityCallout.banner}`}>
                    <priorityCallout.icon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-black tracking-tight">{priorityCallout.title}</p>
                        <p className="mt-0.5 text-[11px] font-medium leading-relaxed opacity-90">{priorityCallout.text}</p>
                    </div>
                </div>
            )}
        </header>
    );
}
