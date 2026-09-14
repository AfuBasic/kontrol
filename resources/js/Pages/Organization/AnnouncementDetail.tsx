import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, ChevronRight, ImageIcon, Share2 } from 'lucide-react';
import React, { useState } from 'react';
import AnnouncementAttachments from '@/Components/EstateBoard/AnnouncementAttachments';
import AnnouncementProse from '@/Components/EstateBoard/AnnouncementProse';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { PostMedia } from '@/types';

interface DetailPost {
    id: number;
    hashid?: string;
    title: string | null;
    body: string;
    category: string;
    priority: string;
    is_read?: boolean;
    published_at: string | null;
    published_at_human: string;
    author_name: string;
    media?: PostMedia[];
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        estate_name?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    post: DetailPost;
}

const CATEGORY_STYLES: Record<string, { label: string; tone: string }> = {
    general: { label: 'Update', tone: 'text-slate-600 bg-slate-100' },
    meeting: { label: 'Meeting', tone: 'text-blue-700 bg-blue-50/90' },
    maintenance: { label: 'Maintenance', tone: 'text-amber-800 bg-amber-50/90' },
    security: { label: 'Security', tone: 'text-rose-700 bg-rose-50/90' },
    event: { label: 'Event', tone: 'text-purple-700 bg-purple-50/90' },
};

export default function AnnouncementDetail({ organization, post }: Props) {
    const [copied, setCopied] = useState(false);

    const category = CATEGORY_STYLES[post.category] || {
        label: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Notice',
        tone: 'text-slate-600 bg-slate-100',
    };

    const isUrgent = post.priority === 'critical' || post.priority === 'important';

    const formattedDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : 'Recently';

    const handleShare = async () => {
        const shareData = {
            title: post.title || 'Estate Announcement',
            text: `Notice from ${post.author_name}: ${post.title || ''}`,
            url: window.location.href,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch {
                // Ignore cancel
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // Clipboard fallback
            }
        }
    };

    return (
        <OrganizationLayout title="Announcement" contentClassName="max-w-2xl">
            <Head title={`${post.title || 'Announcement'} - ${organization.name}`} />

            <div className="space-y-6 pb-20">
                {/* Back Link & Contextual Action */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <Link
                        href="/org/announcements"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Announcements</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                                <span>Share</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Editorial Reading Surface */}
                <article className="space-y-6 text-left">
                    {/* Meta Header */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${category.tone}`}>
                                {category.label}
                            </span>
                            {isUrgent && (
                                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                                    Urgent Notice
                                </span>
                            )}
                            <span className="text-slate-300">·</span>
                            <time className="text-slate-500 font-normal">{formattedDate}</time>
                        </div>

                        {/* Title - comfortable scale, not oversized */}
                        <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl lg:text-3xl leading-snug [overflow-wrap:anywhere] break-words">
                            {post.title || 'Untitled notice'}
                        </h1>

                        {/* Author & Timestamp */}
                        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                            <span className="font-medium text-slate-800">{post.author_name}</span>
                            <span>·</span>
                            <span>{post.published_at_human}</span>
                        </div>
                    </div>

                    <div className="h-px w-full bg-slate-100" />

                    {/* Clean Prose Body */}
                    <div className="text-slate-800">
                        <AnnouncementProse html={post.body} className="prose-p:text-sm sm:prose-p:text-base prose-p:leading-7 prose-p:text-slate-700" />
                    </div>

                    {/* Media Attachments */}
                    {post.media && post.media.length > 0 && (
                        <div className="border-t border-slate-100 pt-6">
                            <AnnouncementAttachments media={post.media} />
                        </div>
                    )}
                </article>
            </div>
        </OrganizationLayout>
    );
}
