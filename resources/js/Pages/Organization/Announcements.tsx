import { Head, Link } from '@inertiajs/react';
import { Bell, ChevronRight, ImageIcon, Sparkles } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { PostMedia } from '@/types';

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
    author_name: string;
    media_count: number;
    media?: PostMedia[];
}

interface PaginatedPosts {
    data: Post[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
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
    unread_count?: number;
    posts: PaginatedPosts;
}

const CATEGORY_STYLES: Record<string, { label: string; tone: string }> = {
    general: { label: 'Update', tone: 'text-slate-600 bg-slate-100' },
    meeting: { label: 'Meeting', tone: 'text-blue-700 bg-blue-50/90' },
    maintenance: { label: 'Maintenance', tone: 'text-amber-800 bg-amber-50/90' },
    security: { label: 'Security', tone: 'text-rose-700 bg-rose-50/90' },
    event: { label: 'Event', tone: 'text-purple-700 bg-purple-50/90' },
};

function formatRelativeDate(isoString: string | null): string {
    if (!isoString) return 'Recently';

    const date = new Date(isoString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

function stripHtml(html: string): string {
    return html
        .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
        .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export default function Announcements({ organization, membership, posts, unread_count = 0 }: Props) {
    const estateName = organization.estate_name || 'the estate';

    // Group posts subtly if there are multiple, or keep a unified list
    const items = posts.data;

    return (
        <OrganizationLayout title="Announcements" contentClassName="max-w-2xl">
            <Head title={`Announcements - ${organization.name}`} />

            <div className="space-y-5 pb-20 text-left">
                {/* Clean, Restrained Page Header */}
                <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Announcements</h1>
                        {unread_count > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                {unread_count} new
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-normal text-slate-500 leading-relaxed">
                        Updates, notices and important information from {estateName}.
                    </p>
                </div>

                {/* Feed or Quiet Empty State */}
                {items.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center sm:p-12">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Bell className="h-5 w-5" />
                        </div>
                        <h2 className="mt-4 text-base font-semibold text-slate-900">You're all caught up</h2>
                        <p className="mt-1.5 mx-auto max-w-sm text-xs sm:text-sm font-normal text-slate-500 leading-relaxed">
                            There aren't any estate announcements yet. New updates published by {estateName} will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                        {items.map((post) => {
                            const isUnread = !post.is_read;
                            const isUrgent = post.priority === 'critical' || post.priority === 'important';
                            const preview = stripHtml(post.body);
                            const category = CATEGORY_STYLES[post.category] || {
                                label: post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Notice',
                                tone: 'text-slate-600 bg-slate-100',
                            };
                            const dateLabel = formatRelativeDate(post.published_at);
                            const firstImage = post.media?.find((m) => m.mime_type?.startsWith('image/')) ?? post.media?.[0] ?? null;

                            return (
                                <Link
                                    key={post.id}
                                    href={`/org/announcements/${post.hashid || post.id}`}
                                    className={`group block p-4 sm:p-5 transition-colors duration-150 ${
                                        isUnread ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-white'
                                    }`}
                                >
                                    {/* Top Metadata Row: Category, Priority, Date, Read State */}
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            {/* Unread Accent Indicator */}
                                            {isUnread && (
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-full bg-blue-600"
                                                    title="Unread notice"
                                                    aria-label="Unread notice"
                                                />
                                            )}

                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${category.tone}`}>
                                                {category.label}
                                            </span>

                                            {isUrgent && (
                                                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                                                    Urgent
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-[11px] font-normal text-slate-600 tabular-nums">
                                            {dateLabel}
                                        </span>
                                    </div>

                                    {/* Title: Intentional emphasis without excessive 4-line heavy bolding */}
                                    <h2
                                        className={`mt-2.5 text-base sm:text-lg leading-snug break-words transition-colors ${
                                            isUnread
                                                ? 'font-bold text-slate-900 group-hover:text-blue-700'
                                                : 'font-medium text-slate-700 group-hover:text-slate-900'
                                        }`}
                                    >
                                        {post.title || 'Untitled notice'}
                                    </h2>

                                    {/* Short restrained preview excerpt */}
                                    {preview && (
                                        <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm font-normal leading-relaxed text-slate-600">
                                            {preview}
                                        </p>
                                    )}

                                    {/* Footer: Author, media indicator, open arrow affordance */}
                                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-600">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="truncate font-medium text-slate-700">{post.author_name}</span>
                                            {post.media_count > 0 && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-600">
                                                    <ImageIcon className="h-3 w-3" />
                                                    <span>{post.media_count}</span>
                                                </span>
                                            )}
                                        </div>

                                        <span className="inline-flex items-center gap-1 text-slate-600 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-900">
                                            <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls if >15 notices */}
                {posts.last_page > 1 && (
                    <div className="flex items-center justify-between gap-2 pt-2 text-xs font-medium text-slate-600">
                        <span>
                            Page {posts.current_page} of {posts.last_page}
                        </span>
                        <div className="flex items-center gap-1">
                            {posts.links.map((link, idx) => {
                                if (!link.url) return null;
                                return (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className={`rounded-lg px-2.5 py-1 transition ${
                                            link.active
                                                ? 'bg-slate-900 font-bold text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200/80'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
