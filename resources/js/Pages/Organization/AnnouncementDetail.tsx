import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Check, ChevronRight, FileText, Share2 } from 'lucide-react';
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
    publisher_name: string;
    publisher_role: string;
    author_name: string | null;
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
}

const CATEGORY_META: Record<string, { label: string; tone: string }> = {
    general: { label: 'Notice', tone: 'text-slate-600 bg-slate-100' },
    meeting: { label: 'Meeting', tone: 'text-sky-700 bg-sky-50' },
    maintenance: { label: 'Maintenance', tone: 'text-amber-700 bg-amber-50' },
    security: { label: 'Security', tone: 'text-rose-700 bg-rose-50' },
    event: { label: 'Community Event', tone: 'text-indigo-700 bg-indigo-50' },
};

export default function AnnouncementDetail({ organization, estate, post }: Props) {
    const estateName = estate?.name || organization.estate_name || 'Golden Heights';
    const [copied, setCopied] = useState(false);

    const category = CATEGORY_META[post.category] || {
        label: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Notice',
        tone: 'text-slate-600 bg-slate-100',
    };

    const isCritical = post.priority === 'critical';
    const isImportant = post.priority === 'important';

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
            text: `${post.publisher_name || estateName}: ${post.title || ''}`,
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
        <OrganizationLayout title="Announcement" contentClassName="max-w-2xl px-4">
            <Head title={`${post.title || 'Announcement'} - ${estateName}`} />

            <div className="space-y-6 pb-24 text-left">
                {/* 1. Subtle Navigation Bar: Back link + Share */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <Link
                        href="/org/announcements"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4 stroke-[2.2]" />
                        <span>Announcements</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Link Copied</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                                <span>Share</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 2. Critical Alert Banner if applicable */}
                {isCritical && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>Urgent Estate Advisory</span>
                    </div>
                )}

                {/* 3. The Article itself is the reading surface (No enclosing giant card) */}
                <article className="space-y-6">
                    {/* Publisher Header Block */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold tracking-wide text-white shadow-xs">
                            {estateName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                    {post.publisher_name || estateName}
                                </span>
                                {isImportant && !isCritical && (
                                    <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                        Important
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span>{post.publisher_role}</span>
                                <span>·</span>
                                <time dateTime={post.published_at || undefined}>
                                    {formattedDate} ({post.published_at_human})
                                </time>
                            </div>
                        </div>
                    </div>

                    {/* Metadata & Title */}
                    <div className="space-y-2 border-t border-slate-100 pt-5">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${category.tone}`}>
                                {category.label}
                            </span>
                            {post.author_name && (
                                <span className="text-xs text-slate-400">
                                    Posted by {post.author_name}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl leading-snug [overflow-wrap:anywhere] break-words">
                            {post.title || 'Untitled notice'}
                        </h1>
                    </div>

                    {/* Clean Prose Body */}
                    <div className="text-slate-800 pt-1">
                        <AnnouncementProse
                            html={post.body}
                            className="prose-p:text-base prose-p:leading-7 prose-p:text-slate-700 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900"
                        />
                    </div>

                    {/* Media Attachments & Lightbox */}
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

